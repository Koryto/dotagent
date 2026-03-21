import { CliUsageError } from "../utils/errors.js";

export const SUPPORTED_RUNTIMES = ["codex", "claude", "opencode", "copilot"] as const;

export type SupportedRuntime = (typeof SUPPORTED_RUNTIMES)[number];

export interface RuntimeAdapterDescriptor {
  runtime: SupportedRuntime;
  directoryName: string;
}

export const RUNTIME_ADAPTERS: readonly RuntimeAdapterDescriptor[] = [
  { runtime: "codex", directoryName: ".codex" },
  { runtime: "claude", directoryName: ".claude" },
  { runtime: "opencode", directoryName: ".opencode" },
  { runtime: "copilot", directoryName: ".github/copilot" }
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

function isSupportedRuntime(value: string): value is SupportedRuntime {
  return (SUPPORTED_RUNTIMES as readonly string[]).includes(value);
}
