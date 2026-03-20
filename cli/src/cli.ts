import type { Writable } from "node:stream";

import { handleDoctor } from "./commands/doctor.js";
import { handleInit } from "./commands/init.js";
import { handlePlaybookInit } from "./commands/playbook/init.js";
import { handlePlaybookList } from "./commands/playbook/list.js";
import { handleUpdate } from "./commands/update.js";
import { detectProjectState, resolveProjectRoot } from "./core/project.js";
import { resolveBundledAgentRoot, resolvePackageRoot } from "./core/paths.js";
import type { CliCommand, CliContext, CommandFlags, ParsedCommand } from "./models/command.js";
import { CliUsageError, DotagentError, NotImplementedCliError, toExitCode } from "./utils/errors.js";
import { createLogger } from "./utils/logger.js";

export interface RunCliInput {
  argv: string[];
  cwd: string;
  stdout: Writable;
  stderr: Writable;
}

export async function runCli(input: RunCliInput): Promise<number> {
  const logger = createLogger(input.stdout, input.stderr);

  try {
    const parsed = parseArgv(input.argv);
    if (parsed.kind === "help") {
      logger.info(renderHelp());
      return 0;
    }

    const packageRoot = resolvePackageRoot(import.meta.url);
    const projectRoot = resolveProjectRoot(parsed.flags.cwd ?? input.cwd);
    const bundledAgentRoot = resolveBundledAgentRoot(packageRoot);
    const projectState = detectProjectState(projectRoot);

    const context: CliContext = {
      cwd: input.cwd,
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

    if (token === "--yes") {
      flags.yes = true;
      continue;
    }

    if (token === "--help" || token === "-h") {
      flags.help = true;
      continue;
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
      const [, value] = token.split("=", 2);
      if (!value) {
        throw new CliUsageError("Missing value for --cwd.");
      }
      flags.cwd = value;
      continue;
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
    case "init":
      return { kind: "init", flags };
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
          name: maybeArg
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
    "  dotagent init [--cwd <path>] [--dry-run] [--yes]",
    "  dotagent update [--cwd <path>] [--dry-run] [--yes]",
    "  dotagent doctor [--cwd <path>]",
    "  dotagent playbook list [--cwd <path>]",
    "  dotagent playbook init <name> [--cwd <path>] [--dry-run] [--yes]"
  ].join("\n");
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
