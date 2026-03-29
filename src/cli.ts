import path from "node:path";
import type { Readable, Writable } from "node:stream";

import { handleClaimState } from "./commands/claim-state.js";
import { handleDoctor } from "./commands/doctor.js";
import { handleInit } from "./commands/init.js";
import { handlePlaybookInit } from "./commands/playbook/init.js";
import { handlePlaybookList } from "./commands/playbook/list.js";
import { handleUpdate } from "./commands/update.js";
import { detectProjectState, resolveExistingProjectRoot, resolveProjectRoot } from "./core/project.js";
import { normalizePlaybookIdentifier } from "./core/playbooks.js";
import { resolveBundledAgentRoot, resolvePackageRoot } from "./core/paths.js";
import { readUtf8File } from "./core/files.js";
import type { CliCommand, CliContext, CommandFlags, ParsedCommand } from "./models/command.js";
import { CliUsageError, DotagentError, NotImplementedCliError, toExitCode } from "./utils/errors.js";
import { createLogger } from "./utils/logger.js";

export interface RunCliInput {
  argv: string[];
  cwd: string;
  stdin: Readable;
  stdout: Writable;
  stderr: Writable;
}

export async function runCli(input: RunCliInput): Promise<number> {
  const logger = createLogger(input.stdout, input.stderr);

  try {
    const parsed = parseArgv(input.argv);
    const packageRoot = resolvePackageRoot(import.meta.url);
    if (parsed.kind === "help") {
      logger.info(renderHelp());
      return 0;
    }

    if (parsed.kind === "version") {
      logger.info(readPackageVersion(packageRoot));
      return 0;
    }

    const requestedProjectRoot = parsed.flags.cwd ?? input.cwd;
    const projectRoot = parsed.kind === "init"
      ? resolveProjectRoot(requestedProjectRoot)
      : resolveExistingProjectRoot(requestedProjectRoot);
    const bundledAgentRoot = resolveBundledAgentRoot(packageRoot);
    const projectState = detectProjectState(projectRoot);

    const context: CliContext = {
      invocationCwd: input.cwd,
      stdin: input.stdin,
      stdout: input.stdout,
      projectRoot,
      packageRoot,
      bundledAgentRoot,
      projectState,
      flags: parsed.flags,
      logger
    };

    return await dispatch(parsed, context);
  } catch (error) {
    const cliError = normalizeError(error);
    logger.error(cliError.message);
    return toExitCode(cliError);
  }
}

function parseArgv(argv: string[]): ParsedCommand {
  const flags: CommandFlags = {
    dryRun: false,
    verbose: false,
    yes: false,
    help: false
  };
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }

    if (token === "--dry-run") {
      flags.dryRun = true;
      continue;
    }

    if (token === "--verbose") {
      flags.verbose = true;
      continue;
    }

    if (token === "--yes") {
      flags.yes = true;
      continue;
    }

    if (token === "--help" || token === "-h") {
      flags.help = true;
      continue;
    }

    if (token === "--version" || token === "-v") {
      return {
        kind: "version",
        flags
      };
    }

    if (token === "--cwd") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new CliUsageError("Missing value for --cwd.");
      }
      flags.cwd = nextValue;
      index += 1;
      continue;
    }

    if (token.startsWith("--cwd=")) {
      const value = token.slice(token.indexOf("=") + 1);
      if (!value) {
        throw new CliUsageError("Missing value for --cwd.");
      }
      flags.cwd = value;
      continue;
    }

    if (token === "--runtimes") {
      const { values, lastIndex } = collectFlagValues(argv, index + 1);
      if (values.length === 0) {
        throw new CliUsageError("Missing value for --runtimes.");
      }
      for (const value of values) {
        flags.runtimes = mergeRuntimes(flags.runtimes, value);
      }
      index = lastIndex;
      continue;
    }

    if (token.startsWith("--runtimes=")) {
      const value = token.slice(token.indexOf("=") + 1);
      if (!value) {
        throw new CliUsageError("Missing value for --runtimes.");
      }
      flags.runtimes = mergeRuntimes(flags.runtimes, value);
      continue;
    }

    if (token === "--runtime") {
      const { values, lastIndex } = collectFlagValues(argv, index + 1);
      if (values.length === 0) {
        throw new CliUsageError("Missing value for --runtime.");
      }
      for (const value of values) {
        flags.runtimes = mergeRuntimes(flags.runtimes, value);
      }
      index = lastIndex;
      continue;
    }

    if (token.startsWith("--runtime=")) {
      const value = token.slice(token.indexOf("=") + 1);
      if (!value) {
        throw new CliUsageError("Missing value for --runtime.");
      }
      flags.runtimes = mergeRuntimes(flags.runtimes, value);
      continue;
    }

    if (token === "--task") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new CliUsageError("Missing value for --task.");
      }
      flags.task = nextValue;
      index += 1;
      continue;
    }

    if (token.startsWith("--task=")) {
      const value = token.slice(token.indexOf("=") + 1);
      if (!value) {
        throw new CliUsageError("Missing value for --task.");
      }
      flags.task = value;
      continue;
    }

    if (token.startsWith("--") || (token.startsWith("-") && token !== "-")) {
      throw new CliUsageError(`Unknown flag: ${token}.`);
    }

    positionals.push(token);
  }

  if (flags.help || positionals.length === 0) {
    return {
      kind: "help",
      flags
    };
  }

  const [command, subcommand, maybeArg] = positionals;
  switch (command) {
    case "version":
      return { kind: "version", flags };
    case "init":
      return { kind: "init", flags };
    case "claim-state": {
      if (!subcommand) {
        throw new CliUsageError("Missing session id for `dotagent claim-state <session_id> [state_<other_session_id>.md]`.");
      }
      return {
        kind: "claim-state",
        flags,
        sessionId: subcommand,
        ...(maybeArg ? { stateToPickup: maybeArg } : {})
      };
    }
    case "update":
      return { kind: "update", flags };
    case "doctor":
      return { kind: "doctor", flags };
    case "playbook": {
      if (subcommand === "list") {
        return { kind: "playbook-list", flags };
      }
      if (subcommand === "init") {
        if (!maybeArg) {
          throw new CliUsageError("Missing playbook name for `dotagent playbook init <name>`.");
        }
        return {
          kind: "playbook-init",
          flags,
          name: normalizeCommandPlaybookName(maybeArg)
        };
      }
      throw new CliUsageError("Unknown playbook subcommand. Supported: list, init.");
    }
    default:
      throw new CliUsageError(`Unknown command: ${command}.`);
  }
}

async function dispatch(command: CliCommand, context: CliContext): Promise<number> {
  switch (command.kind) {
    case "init":
      return handleInit(context);
    case "claim-state":
      return handleClaimState(command, context);
    case "update":
      return handleUpdate(context);
    case "doctor":
      return handleDoctor(context);
    case "playbook-list":
      return handlePlaybookList(context);
    case "playbook-init":
      return handlePlaybookInit(command, context);
    default:
      throw new NotImplementedCliError(`Command is not implemented: ${assertNever(command)}.`);
  }
}

function renderHelp(): string {
  return [
    "dotagent",
    "",
    "Usage:",
    "  dotagent --version",
    "  dotagent version",
    "  dotagent init [--cwd <path>] [--runtimes <list>] [--dry-run] [--verbose] [--yes]",
    "  dotagent claim-state <session_id> [state_<other_session_id>.md] [--cwd <path>] [--dry-run] [--verbose]",
    "  dotagent update [--cwd <path>] [--dry-run] [--verbose] [--yes]",
    "  dotagent doctor [--cwd <path>]",
    "  dotagent playbook list [--cwd <path>]",
    "  dotagent playbook init <name> [--cwd <path>] [--task <name>] [--dry-run] [--verbose] [--yes]"
  ].join("\n");
}

function mergeRuntimes(existing: string[] | undefined, value: string): string[] {
  const parsed = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return [...(existing ?? []), ...parsed];
}

function readPackageVersion(packageRoot: string): string {
  const packageJsonPath = path.join(packageRoot, "package.json");
  const parsed = JSON.parse(readUtf8File(packageJsonPath)) as { version?: unknown };

  if (typeof parsed.version !== "string" || parsed.version.length === 0) {
    throw new DotagentError(`Package version is missing from ${packageJsonPath}.`);
  }

  return parsed.version;
}

function collectFlagValues(argv: string[], startIndex: number): { values: string[]; lastIndex: number } {
  const values: string[] = [];
  let index = startIndex;

  while (index < argv.length) {
    const token = argv[index];
    if (!token || token.startsWith("-")) {
      break;
    }

    values.push(token);
    index += 1;
  }

  return {
    values,
    lastIndex: index - 1
  };
}

function normalizeCommandPlaybookName(value: string): string {
  try {
    return normalizePlaybookIdentifier(value, "Playbook name");
  } catch {
    throw new CliUsageError(`Invalid playbook name: ${value}.`);
  }
}

function normalizeError(error: unknown): DotagentError {
  if (error instanceof DotagentError) {
    return error;
  }

  if (error instanceof Error) {
    return new DotagentError(error.message);
  }

  return new DotagentError("Unknown CLI failure.");
}

function assertNever(value: never): string {
  return JSON.stringify(value);
}
