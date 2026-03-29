import type { SupportedRuntime } from "../core/adapters.js";
import type { FrameworkSkillInvocationArg } from "../core/framework-skills.js";

export interface FrameworkSkillDescriptor {
  skillName: string;
  sourcePath: string;
  invocationArgs: readonly FrameworkSkillInvocationArg[];
}

interface RuntimeSkillBridgeOptions {
  extraBodyLines?: readonly string[];
  extraTools?: readonly string[];
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

export function buildRuntimeInitBridgeExtraBody(
  runtime: SupportedRuntime,
  frameworkSkills: readonly FrameworkSkillDescriptor[],
  bundledPlaybooks: readonly string[]
): string[] {
  const skillInvocationLines =
    frameworkSkills.length > 0
      ? frameworkSkills.map((entry) => `- ${formatRuntimeInvocation(runtime, entry.skillName)}`)
      : ["- none"];
  const playbookLines =
    bundledPlaybooks.length > 0 ? bundledPlaybooks.map((entry) => `- ${entry}`) : ["- none"];

  return [
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
    "- `dotagent claim-state <session_id> [state_<other_session_id>.md]`",
    "- `dotagent archive-sessions <days>`",
    "- `dotagent cleanup-sessions <days>`",
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
}

export function renderRuntimeSkillBridge(
  runtime: SupportedRuntime,
  skill: FrameworkSkillDescriptor,
  options: RuntimeSkillBridgeOptions = {}
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
    ...(options.extraBodyLines ?? [
      "Generated bridge for a dotagent framework skill.",
      "",
      "Load and follow:",
      `- \`${skill.sourcePath}\``,
      "",
      ...invocationArgLines,
      `This wrapper exists so the skill can be invoked natively in ${runtime}.`,
      "The framework source of truth remains under `.agent/`.",
      ""
    ])
  ];

  return renderRuntimeBridgeDocument(
    runtime,
    skill.skillName,
    skill.skillName === "init"
      ? "Start a dotagent session from this runtime using the generated native bridge."
      : `Invoke the dotagent ${skill.skillName} skill natively from this runtime.`,
    body,
    skill.invocationArgs,
    options.extraTools
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
  invocationArgs: readonly FrameworkSkillInvocationArg[] = [],
  extraTools: readonly string[] = []
): string {
  const frontmatter = renderRuntimeBridgeFrontmatter(runtime, name, description, invocationArgs, extraTools);
  return [...frontmatter, "", ...bodyLines].join("\n");
}

function renderRuntimeBridgeFrontmatter(
  runtime: SupportedRuntime,
  name: string,
  description: string,
  invocationArgs: readonly FrameworkSkillInvocationArg[],
  extraTools: readonly string[]
): string[] {
  const argumentHint = invocationArgs.length > 0 ? formatArgumentHint(invocationArgs) : null;
  const toolLines = buildToolLines(extraTools);

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
        ...toolLines.claude,
        "---"
      ]);
    case "opencode":
      return compactYamlLines([
        "---",
        `description: ${yamlString(description)}`,
        argumentHint ? `argument-hint: ${yamlString(argumentHint)}` : null,
        "tools:",
        ...toolLines.opencode,
        "---"
      ]);
    case "copilot":
      return compactYamlLines([
        "---",
        `name: ${yamlString(`dotagent-${name}`)}`,
        `description: ${yamlString(description)}`,
        argumentHint ? `argument-hint: ${yamlString(argumentHint)}` : null,
        `allowed-tools: ${toolLines.copilot.join(", ")}`,
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

function buildToolLines(extraTools: readonly string[]): { claude: string[]; opencode: string[]; copilot: string[] } {
  const normalizedTools = [...new Set(["Read", "Write", "Bash", "Grep", "Glob", ...extraTools])];

  return {
    claude: normalizedTools.map((tool) => `  - ${tool}`),
    opencode: normalizedTools.map((tool) => `  ${tool.toLowerCase()}: true`),
    copilot: normalizedTools
  };
}

function compactYamlLines(lines: Array<string | null>): string[] {
  return lines.filter((line): line is string => line !== null);
}
