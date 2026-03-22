import path from "node:path";

import { fileExists, readUtf8File } from "./files.js";
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

export function getRuntimeManifestRelativePath(runtime: SupportedRuntime): string {
  switch (runtime) {
    case "codex":
      return ".codex/dotagent.json";
    case "claude":
      return ".claude/dotagent.json";
    case "opencode":
      return ".opencode/dotagent.json";
    case "copilot":
      return ".github/dotagent.json";
    default:
      throw new CliUsageError(`Unsupported runtime manifest path lookup: ${runtime}.`);
  }
}

export function resolveRuntimeInstalledAt(projectRoot: string, runtime: SupportedRuntime): string {
  const manifestPath = path.join(projectRoot, ...getRuntimeManifestRelativePath(runtime).split("/"));
  if (!fileExists(manifestPath)) {
    return new Date().toISOString();
  }

  try {
    const parsed = JSON.parse(readUtf8File(manifestPath)) as { installedAt?: unknown };
    if (typeof parsed.installedAt === "string" && parsed.installedAt.length > 0) {
      return parsed.installedAt;
    }
  } catch {
    // Fall back to a fresh installation timestamp if the existing runtime manifest is unreadable.
  }

  return new Date().toISOString();
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
