import type { SupportedRuntime } from "../core/adapters.js";
import type { FrameworkSkillInvocationArg } from "../core/framework-skills.js";

export interface FrameworkSkillDescriptor {
  skillName: string;
  sourcePath: string;
  invocationArgs: readonly FrameworkSkillInvocationArg[];
}

export function renderRuntimeAdapterManifest(
  runtime: SupportedRuntime,
  frameworkRef: string,
  installedAt: string
): string {
  return `${JSON.stringify(
    {
      manifestVersion: 1,
      runtime,
      frameworkRef,
      installedAt
    },
    null,
    2
  )}\n`;
}

export function renderRuntimeInitBridge(
  runtime: SupportedRuntime,
  frameworkSkills: readonly FrameworkSkillDescriptor[],
  bundledPlaybooks: readonly string[]
): string {
  const initInvocationArgs = frameworkSkills.find((entry) => entry.skillName === "init")?.invocationArgs ?? [];
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
    "The framework init path remains `.agent/skills/init/SKILL.md`.",
    "These runtime files are generated bridges for native invocation only.",
    ""
  ];

  return renderRuntimeBridgeDocument(
    runtime,
    "init",
    "Start a dotagent session from this runtime using the generated native bridge.",
    body,
    initInvocationArgs
  );
}

export function renderRuntimeSkillBridge(
  runtime: SupportedRuntime,
  skill: FrameworkSkillDescriptor
): string {
  const invocationArgLines =
    skill.invocationArgs.length > 0
      ? [
          "Invocation arguments:",
          "```yaml",
          ...skill.invocationArgs.map((arg) => `${arg.name}: <${arg.required ? "required" : "optional"}>`),
          "```",
          "",
          "Provide these arguments explicitly when invoking this bridge.",
          ""
        ]
      : [];

  const body = [
    `# ${formatRuntimeBridgeName(runtime, skill.skillName)}`,
    "",
    "Generated bridge for a dotagent framework skill.",
    "",
    "Load and follow:",
    `- \`${skill.sourcePath}\``,
    "",
    ...invocationArgLines,
    `This wrapper exists so the skill can be invoked natively in ${runtime}.`,
    "The framework source of truth remains under `.agent/`.",
    ""
  ];

  return renderRuntimeBridgeDocument(
    runtime,
    skill.skillName,
    `Invoke the dotagent ${skill.skillName} skill natively from this runtime.`,
    body,
    skill.invocationArgs
  );
}

function formatRuntimeBridgeName(runtime: SupportedRuntime, name: string): string {
  if (runtime === "claude") {
    return `dotagent:${name}`;
  }

  return `dotagent-${name}`;
}

function formatRuntimeInvocation(runtime: SupportedRuntime, name: string): string {
  switch (runtime) {
    case "codex":
    case "copilot":
      return `\`$${formatRuntimeBridgeName(runtime, name)}\``;
    case "claude":
      return `\`/dotagent:${name}\``;
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
  bodyLines: readonly string[],
  invocationArgs: readonly FrameworkSkillInvocationArg[] = []
): string {
  const frontmatter = renderRuntimeBridgeFrontmatter(runtime, name, description, invocationArgs);
  return [...frontmatter, "", ...bodyLines].join("\n");
}

function renderRuntimeBridgeFrontmatter(
  runtime: SupportedRuntime,
  name: string,
  description: string,
  invocationArgs: readonly FrameworkSkillInvocationArg[]
): string[] {
  const argumentHint = invocationArgs.length > 0 ? formatArgumentHint(invocationArgs) : null;

  switch (runtime) {
    case "codex":
      return compactYamlLines([
        "---",
        `name: ${yamlString(`dotagent-${name}`)}`,
        `description: ${yamlString(description)}`,
        argumentHint ? `argument-hint: ${yamlString(argumentHint)}` : null,
        "metadata:",
        `  short-description: ${yamlString(description)}`,
        "---"
      ]);
    case "claude":
      return compactYamlLines([
        "---",
        `name: ${yamlString(`dotagent:${name}`)}`,
        `description: ${yamlString(description)}`,
        argumentHint ? `argument-hint: ${yamlString(argumentHint)}` : null,
        "allowed-tools:",
        "  - Read",
        "  - Write",
        "  - Bash",
        "  - Grep",
        "  - Glob",
        "---"
      ]);
    case "opencode":
      return compactYamlLines([
        "---",
        `description: ${yamlString(description)}`,
        argumentHint ? `argument-hint: ${yamlString(argumentHint)}` : null,
        "tools:",
        "  read: true",
        "  write: true",
        "  bash: true",
        "  grep: true",
        "  glob: true",
        "---"
      ]);
    case "copilot":
      return compactYamlLines([
        "---",
        `name: ${yamlString(`dotagent-${name}`)}`,
        `description: ${yamlString(description)}`,
        argumentHint ? `argument-hint: ${yamlString(argumentHint)}` : null,
        "allowed-tools: Read, Write, Bash, Grep, Glob",
        "---"
      ]);
    default:
      return compactYamlLines([
        "---",
        `description: ${yamlString(description)}`,
        argumentHint ? `argument-hint: ${yamlString(argumentHint)}` : null,
        "---"
      ]);
  }
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function formatArgumentHint(invocationArgs: readonly FrameworkSkillInvocationArg[]): string {
  return invocationArgs
    .map((arg) => (arg.required ? `${arg.name}=<value>` : `[${arg.name}=<value>]`))
    .join(" ");
}

function compactYamlLines(lines: Array<string | null>): string[] {
  return lines.filter((line): line is string => line !== null);
}
