import type { SupportedRuntime } from "../core/adapters.js";

export function renderRuntimeIndex(runtime: SupportedRuntime, bundledPlaybooks: string[]): string {
  const playbookLines =
    bundledPlaybooks.length > 0 ? bundledPlaybooks.map((entry) => `- .agent/playbooks/${entry}/PLAYBOOK.md`) : ["- none"];

  return [
    `# dotagent ${runtime} adapter`,
    "",
    "Start here:",
    "- .agent/BOOTSTRAP.md",
    "",
    "Bundled playbooks:",
    ...playbookLines,
    "",
    "Supported CLI commands:",
    "- dotagent init",
    "- dotagent doctor",
    "- dotagent update",
    "- dotagent playbook list",
    "- dotagent playbook init the-extreme-cr-rig",
    "",
    "This file is a thin adapter. The framework source of truth remains under `.agent/`.",
    ""
  ].join("\n");
}

export function renderAgentsBridge(): string {
  return [
    "# AGENTS",
    "",
    "dotagent bootstrap:",
    "- .agent/BOOTSTRAP.md",
    "",
    "The framework and playbook source of truth remains under `.agent/`.",
    ""
  ].join("\n");
}
