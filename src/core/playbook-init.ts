import path from "node:path";

import { appendUtf8File, collectFilePaths, ensureParentDirectory, fileExists, filesAreEqual, hashBuffer, hashUtf8, readBinaryFile, readUtf8File, writeBinaryFile, writeUtf8File } from "./files.js";
import { loadInstalledPlaybookContract } from "./playbooks.js";
import type { CliContext } from "../models/command.js";
import type { PlaybookContract, PlaybookTransportContract } from "../models/playbook.js";
import { CliUsageError, DotagentError } from "../utils/errors.js";

type PlaybookPlanAction = "create" | "adopt" | "skip";
type PlaybookGitignoreAction = "create" | "append" | "unchanged";

export interface PlaybookInitFilePlan {
  relativePath: string;
  targetPath: string;
  sourcePath: string;
  action: PlaybookPlanAction;
  contentHash: string;
}

export interface PlaybookGitignorePlan {
  targetPath: string;
  action: PlaybookGitignoreAction;
  content?: string;
  appendContent?: string;
}

export interface PlaybookInitPlan {
  projectRoot: string;
  playbookName: string;
  transport: string;
  taskName: string;
  runtimeRoot: string;
  roundRoot: string;
  files: PlaybookInitFilePlan[];
  gitignore: PlaybookGitignorePlan | null;
}

export interface PlaybookInitExecutionResult {
  writtenFiles: PlaybookInitFilePlan[];
  skippedFiles: PlaybookInitFilePlan[];
  gitignore: PlaybookGitignorePlan | null;
}

export function resolvePlaybookTransport(
  context: CliContext,
  contract: PlaybookContract
): { transportName: string; transport: PlaybookTransportContract } {
  const requested = context.flags.transport?.trim();
  const transportName = requested && requested.length > 0 ? requested : contract.defaultTransport;
  const transport = contract.transports[transportName];

  if (!transport) {
    throw new CliUsageError(
      `Unsupported transport for ${contract.name}: ${transportName}. Supported: ${Object.keys(contract.transports).join(", ")}.`
    );
  }

  return { transportName, transport };
}

export function planPlaybookInit(
  context: CliContext,
  playbookName: string,
  taskName: string
): PlaybookInitPlan {
  if (!context.projectState.hasFramework) {
    throw new DotagentError(`No .agent framework found in target project: ${context.projectRoot}`);
  }

  const contract = loadInstalledPlaybookContract(context.projectRoot, playbookName);
  if (contract.name !== playbookName) {
    throw new DotagentError(
      `Playbook contract name mismatch. Expected ${playbookName}, found ${contract.name}.`
    );
  }

  const { transportName, transport } = resolvePlaybookTransport(context, contract);
  const playbookRoot = path.join(context.projectRoot, ".agent", "playbooks", playbookName);
  const templateRoot = path.join(playbookRoot, transport.templateDir);
  const runtimeRoot = transport.taskScoped
    ? path.join(context.projectRoot, transport.runtimeRoot, taskName)
    : path.join(context.projectRoot, transport.runtimeRoot);
  const roundDirectory = transport.initialRound ?? "round_001";
  const roundRoot = path.join(runtimeRoot, roundDirectory);
  const files = planTemplateFiles(context.projectRoot, templateRoot, roundRoot);
  const gitignore = planPlaybookGitignore(context.projectRoot, transport.gitignoreEntry);

  return {
    projectRoot: context.projectRoot,
    playbookName,
    transport: transportName,
    taskName,
    runtimeRoot,
    roundRoot,
    files,
    gitignore
  };
}

export function applyPlaybookInitPlan(plan: PlaybookInitPlan): PlaybookInitExecutionResult {
  const writtenFiles = plan.files.filter((entry) => entry.action === "create");
  const skippedFiles = plan.files.filter((entry) => entry.action === "skip");

  for (const filePlan of writtenFiles) {
    ensureParentDirectory(filePlan.targetPath);
    const content = readBinaryFile(filePlan.sourcePath);
    writeBinaryFile(filePlan.targetPath, content);
  }

  if (plan.gitignore?.action === "create") {
    writeUtf8File(plan.gitignore.targetPath, plan.gitignore.content ?? "");
  } else if (plan.gitignore?.action === "append") {
    appendUtf8File(plan.gitignore.targetPath, plan.gitignore.appendContent ?? "");
  }

  return {
    writtenFiles,
    skippedFiles,
    gitignore: plan.gitignore
  };
}

export function renderPlaybookInitPlan(plan: PlaybookInitPlan): string {
  const counts = {
    create: plan.files.filter((entry) => entry.action === "create").length,
    adopt: plan.files.filter((entry) => entry.action === "adopt").length,
    skip: plan.files.filter((entry) => entry.action === "skip").length
  };

  return [
    `dotagent playbook init ${plan.playbookName}`,
    "",
    `project_root: ${plan.projectRoot}`,
    `playbook: ${plan.playbookName}`,
    `transport: ${plan.transport}`,
    `task: ${plan.taskName}`,
    `runtime_root: ${toProjectRelativePath(plan.projectRoot, plan.runtimeRoot)}`,
    `round_root: ${toProjectRelativePath(plan.projectRoot, plan.roundRoot)}`,
    `template_files: create=${counts.create}, adopt=${counts.adopt}, skip=${counts.skip}`,
    `gitignore: ${plan.gitignore ? plan.gitignore.action : "unchanged"}`
  ].join("\n");
}

function planTemplateFiles(projectRoot: string, templateRoot: string, roundRoot: string): PlaybookInitFilePlan[] {
  if (!fileExists(templateRoot)) {
    throw new DotagentError(`Playbook template directory is missing: ${templateRoot}`);
  }

  return collectFilePaths(templateRoot)
    .filter((sourcePath) => shouldCopyTemplateFile(sourcePath))
    .map((sourcePath) => {
    const relativeFromTemplate = path.relative(templateRoot, sourcePath);
    const targetPath = path.join(roundRoot, relativeFromTemplate);

    if (!fileExists(targetPath)) {
      return {
        relativePath: toProjectRelativePath(projectRoot, targetPath),
        targetPath,
        sourcePath,
        action: "create" as const,
        contentHash: hashBuffer(readBinaryFile(sourcePath))
      };
    }

    return {
      relativePath: toProjectRelativePath(projectRoot, targetPath),
      targetPath,
      sourcePath,
      action: filesAreEqual(sourcePath, targetPath) ? ("adopt" as const) : ("skip" as const),
      contentHash: hashBuffer(readBinaryFile(sourcePath))
    };
  });
}

function planPlaybookGitignore(projectRoot: string, gitignoreEntry?: string): PlaybookGitignorePlan | null {
  if (!gitignoreEntry) {
    return null;
  }

  const gitignorePath = path.join(projectRoot, ".gitignore");
  if (!fileExists(gitignorePath)) {
    return {
      targetPath: gitignorePath,
      action: "create",
      content: `${gitignoreEntry}\n`
    };
  }

  const current = readUtf8File(gitignorePath);
  const lines = current.split(/\r?\n/).map((line) => line.trim());
  if (lines.includes(gitignoreEntry)) {
    return {
      targetPath: gitignorePath,
      action: "unchanged"
    };
  }

  const prefix = current.endsWith("\n") || current.length === 0 ? "" : "\n";
  return {
    targetPath: gitignorePath,
    action: "append",
    appendContent: `${prefix}${gitignoreEntry}\n`
  };
}

function toProjectRelativePath(projectRoot: string, absolutePath: string): string {
  return path.relative(projectRoot, absolutePath).split(path.sep).join("/");
}

function shouldCopyTemplateFile(sourcePath: string): boolean {
  const basename = path.basename(sourcePath).toLowerCase();
  return basename !== "reviewer_template.md" && basename !== "batch_template.md";
}
