import type { SupportedRuntime } from "../core/adapters.js";

export interface FrameworkSkillDescriptor {
  skillName: string;
  sourcePath: string;
}

export function renderRuntimeInitBridge(
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

  const body = [
    `# ${formatRuntimeBridgeName(runtime, "init")}`,
    "",
    "Use this runtime bridge to start working with the dotagent framework in this project.",
    "",
    "Load and follow:",
    "- `.agent/skills/init/SKILL.md`",
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
    "The framework bootstrap path remains `.agent/BOOTSTRAP.md`.",
    "These runtime files are generated bridges for native invocation only.",
    ""
  ];

  return renderRuntimeBridgeDocument(
    runtime,
    "init",
    "Start a dotagent session from this runtime using the generated native bridge.",
    body
  );
}

export function renderRuntimeSkillBridge(
  runtime: SupportedRuntime,
  skill: FrameworkSkillDescriptor
): string {
  const body = [
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
  ];

  return renderRuntimeBridgeDocument(
    runtime,
    skill.skillName,
    `Invoke the dotagent ${skill.skillName} skill natively from this runtime.`,
    body
  );
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

function renderRuntimeBridgeDocument(
  runtime: SupportedRuntime,
  name: string,
  description: string,
  bodyLines: readonly string[]
): string {
  const frontmatter = renderRuntimeBridgeFrontmatter(runtime, name, description);
  return [...frontmatter, "", ...bodyLines].join("\n");
}

function renderRuntimeBridgeFrontmatter(
  runtime: SupportedRuntime,
  name: string,
  description: string
): string[] {
  switch (runtime) {
    case "codex":
      return [
        "---",
        `name: dotagent-${name}`,
        `description: ${description}`,
        "metadata:",
        `  short-description: ${description}`,
        "---"
      ];
    case "claude":
      return [
        "---",
        `name: dotagent:${name}`,
        `description: ${description}`,
        "allowed-tools:",
        "  - Read",
        "  - Write",
        "  - Bash",
        "---"
      ];
    case "opencode":
      return [
        "---",
        `description: ${description}`,
        "tools:",
        "  read: true",
        "  write: true",
        "  bash: true",
        "---"
      ];
    case "copilot":
      return [
        "---",
        `name: dotagent-${name}`,
        `description: ${description}`,
        "allowed-tools: Read, Write, Bash",
        "---"
      ];
    default:
      return ["---", `description: ${description}`, "---"];
  }
}
