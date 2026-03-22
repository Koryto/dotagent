import { CliUsageError } from "../utils/errors.js";

export const SUPPORTED_RUNTIMES = ["codex", "claude", "opencode", "copilot"] as const;

export type SupportedRuntime = (typeof SUPPORTED_RUNTIMES)[number];

export interface RuntimeAdapterDescriptor {
  runtime: SupportedRuntime;
  entrypointPath: string;
}

export const RUNTIME_ADAPTERS: readonly RuntimeAdapterDescriptor[] = [
  { runtime: "codex", entrypointPath: ".codex/skills/dotagent-bootstrap/SKILL.md" },
  { runtime: "claude", entrypointPath: ".claude/commands/dotagent/bootstrap.md" },
  { runtime: "opencode", entrypointPath: ".opencode/commands/dotagent-bootstrap.md" },
  { runtime: "copilot", entrypointPath: ".github/skills/dotagent-bootstrap/SKILL.md" }
];

export function parseRuntimeSelection(values: string[]): SupportedRuntime[] {
  const normalized = values.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0);
  const unique = [...new Set(normalized)];
  const unsupported = unique.filter((value) => !isSupportedRuntime(value));

  if (unsupported.length > 0) {
    throw new CliUsageError(`Unsupported runtime selection: ${unsupported.join(", ")}.`);
  }

  return unique as SupportedRuntime[];
}

export function getRuntimeDescriptor(runtime: SupportedRuntime): RuntimeAdapterDescriptor {
  const descriptor = RUNTIME_ADAPTERS.find((entry) => entry.runtime === runtime);
  if (!descriptor) {
    throw new CliUsageError(`Unsupported runtime descriptor lookup: ${runtime}.`);
  }

  return descriptor;
}

export function getRuntimeEntrypointRelativePath(runtime: SupportedRuntime): string {
  return getRuntimeDescriptor(runtime).entrypointPath;
}

export function getRuntimeBridgeRelativePath(runtime: SupportedRuntime, bridgeName: string): string {
  switch (runtime) {
    case "codex":
      return `.codex/skills/dotagent-${bridgeName}/SKILL.md`;
    case "claude":
      return `.claude/commands/dotagent/${bridgeName}.md`;
    case "opencode":
      return `.opencode/commands/dotagent-${bridgeName}.md`;
    case "copilot":
      return `.github/skills/dotagent-${bridgeName}/SKILL.md`;
    default:
      throw new CliUsageError(`Unsupported runtime bridge path lookup: ${runtime}.`);
  }
}

function isSupportedRuntime(value: string): value is SupportedRuntime {
  return (SUPPORTED_RUNTIMES as readonly string[]).includes(value);
}
