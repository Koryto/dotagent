export const SUPPORTED_RUNTIMES = ["codex", "claude", "opencode", "github"] as const;

export type SupportedRuntime = (typeof SUPPORTED_RUNTIMES)[number];

export interface RuntimeAdapterDescriptor {
  runtime: SupportedRuntime;
  directoryName: string;
}

export const RUNTIME_ADAPTERS: readonly RuntimeAdapterDescriptor[] = [
  { runtime: "codex", directoryName: ".codex" },
  { runtime: "claude", directoryName: ".claude" },
  { runtime: "opencode", directoryName: ".opencode" },
  { runtime: "github", directoryName: ".github" }
];
