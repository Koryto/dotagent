import type { SupportedRuntime } from "../core/adapters.js";

export interface FrameworkSkillDescriptor {
  skillName: string;
  sourcePath: string;
}

export function renderRuntimeBootstrapBridge(
  runtime: SupportedRuntime,
  frameworkSkills: readonly FrameworkSkillDescriptor[],
  bundledPlaybooks: readonly string[]
): string {
  const skillInvocationLines =
    frameworkSkills.length > 0
      ? frameworkSkills.map((entry) => `- ${formatRuntimeInvocation(runtime, entry.skillName)}`)
      : ["- none"];
  const playbookLines =
    bundledPlaybooks.length > 0 ? bundledPlaybooks.map((entry) => `- ${entry}`) : ["- none"];

  return [
    `# ${formatRuntimeBridgeName(runtime, "bootstrap")}`,
    "",
    "Use this runtime bridge to start working with the dotagent framework in this project.",
    "",
    "Read first:",
    "- `.agent/BOOTSTRAP.md`",
    "",
    "Available native runtime bridges:",
    ...skillInvocationLines,
    "",
    "Available playbooks:",
    ...playbookLines,
    "",
    "Supported CLI commands:",
    "- `dotagent init`",
    "- `dotagent doctor`",
    "- `dotagent update`",
    "- `dotagent playbook list`",
    "- `dotagent playbook init <name>`",
    "",
    "The framework source of truth remains under `.agent/`.",
    "These runtime files are generated bridges for native invocation only.",
    ""
  ].join("\n");
}

export function renderRuntimeSkillBridge(
  runtime: SupportedRuntime,
  skill: FrameworkSkillDescriptor
): string {
  return [
    `# ${formatRuntimeBridgeName(runtime, skill.skillName)}`,
    "",
    "Generated bridge for a dotagent framework skill.",
    "",
    "Load and follow:",
    `- \`${skill.sourcePath}\``,
    "",
    `This wrapper exists so the skill can be invoked natively in ${runtime}.`,
    "The framework source of truth remains under `.agent/`.",
    ""
  ].join("\n");
}

function formatRuntimeBridgeName(runtime: SupportedRuntime, name: string): string {
  if (runtime === "claude") {
    return `dotagent/${name}`;
  }

  return `dotagent-${name}`;
}

function formatRuntimeInvocation(runtime: SupportedRuntime, name: string): string {
  switch (runtime) {
    case "codex":
    case "copilot":
      return `\`$${formatRuntimeBridgeName(runtime, name)}\``;
    case "claude":
      return `\`dotagent/${name}\``;
    case "opencode":
      return `\`dotagent-${name}\``;
    default:
      return `\`${formatRuntimeBridgeName(runtime, name)}\``;
  }
}
