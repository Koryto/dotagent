import { CliUsageError } from "../utils/errors.js";

export const SUPPORTED_RUNTIMES = ["codex", "claude", "opencode", "copilot"] as const;

export type SupportedRuntime = (typeof SUPPORTED_RUNTIMES)[number];

export function parseRuntimeSelection(values: string[]): SupportedRuntime[] {
  const normalized = values.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0);
  const unique = [...new Set(normalized)];
  const unsupported = unique.filter((value) => !isSupportedRuntime(value));

  if (unsupported.length > 0) {
    throw new CliUsageError(`Unsupported runtime selection: ${unsupported.join(", ")}.`);
  }

  return unique as SupportedRuntime[];
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

export function isRuntimeBridgePath(runtime: SupportedRuntime, relativePath: string): boolean {
  switch (runtime) {
    case "codex":
      return relativePath.startsWith(".codex/skills/dotagent-") && relativePath.endsWith("/SKILL.md");
    case "claude":
      return relativePath.startsWith(".claude/commands/dotagent/") && relativePath.endsWith(".md");
    case "opencode":
      return relativePath.startsWith(".opencode/commands/dotagent-") && relativePath.endsWith(".md");
    case "copilot":
      return relativePath.startsWith(".github/skills/dotagent-") && relativePath.endsWith("/SKILL.md");
    default:
      throw new CliUsageError(`Unsupported runtime bridge path match: ${runtime}.`);
  }
}

function isSupportedRuntime(value: string): value is SupportedRuntime {
  return (SUPPORTED_RUNTIMES as readonly string[]).includes(value);
}
