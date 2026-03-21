import path from "node:path";

import { collectDirectoryPaths, collectFilePaths, ensureProjectDirectory, fileExists, filesAreEqual, hashBuffer, readBinaryFile, readUtf8File, safeAppendUtf8File, safeWriteBinaryFile, safeWriteUtf8File } from "./files.js";
import { assertPathWithinRoot } from "./paths.js";
import type { CliContext } from "../models/command.js";
import type { PlaybookContract, PlaybookTransportContract } from "../models/playbook.js";
import { CliUsageError, DotagentError } from "../utils/errors.js";

type PlaybookPlanAction = "create" | "adopt" | "skip";
type PlaybookGitignoreAction = "create" | "append" | "unchanged";
type PlaybookDirectoryAction = "create" | "adopt";

export interface PlaybookInitDirectoryPlan {
  relativePath: string;
  targetPath: string;
  action: PlaybookDirectoryAction;
}

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
  directories: PlaybookInitDirectoryPlan[];
  files: PlaybookInitFilePlan[];
  gitignore: PlaybookGitignorePlan | null;
}

export interface PlaybookInitExecutionResult {
  createdDirectories: PlaybookInitDirectoryPlan[];
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
  contract: PlaybookContract,
  taskName: string
): PlaybookInitPlan {
  if (!context.projectState.hasFramework) {
    throw new DotagentError(`No .agent framework found in target project: ${context.projectRoot}`);
  }

  const { transportName, transport } = resolvePlaybookTransport(context, contract);
  const playbookRoot = path.join(context.projectRoot, ".agent", "playbooks", contract.name);
  const templateRoot = assertPathWithinRoot(
    playbookRoot,
    path.join(playbookRoot, transport.templateDir),
    `Playbook template root for ${contract.name}`
  );
  const runtimeRoot = assertPathWithinRoot(
    context.projectRoot,
    transport.taskScoped
    ? path.join(context.projectRoot, transport.runtimeRoot, taskName)
    : path.join(context.projectRoot, transport.runtimeRoot),
    `Playbook runtime root for ${contract.name}`
  );
  const roundDirectory = transport.initialRound ?? "round_001";
  const roundRoot = assertPathWithinRoot(
    context.projectRoot,
    path.join(runtimeRoot, roundDirectory),
    `Playbook round root for ${contract.name}`
  );
  const directories = planTemplateDirectories(context.projectRoot, templateRoot, roundRoot);
  const files = planTemplateFiles(context.projectRoot, templateRoot, roundRoot);
  const gitignore = planPlaybookGitignore(context.projectRoot, transport.gitignoreEntry);

  return {
    projectRoot: context.projectRoot,
    playbookName: contract.name,
    transport: transportName,
    taskName,
    runtimeRoot,
    roundRoot,
    directories,
    files,
    gitignore
  };
}

export function applyPlaybookInitPlan(plan: PlaybookInitPlan): PlaybookInitExecutionResult {
  const createdDirectories = plan.directories.filter((entry) => entry.action === "create");
  const writtenFiles = plan.files.filter((entry) => entry.action === "create");
  const skippedFiles = plan.files.filter((entry) => entry.action === "skip");

  for (const directoryPlan of createdDirectories) {
    ensureProjectDirectory(plan.projectRoot, directoryPlan.targetPath, `Playbook directory create: ${directoryPlan.relativePath}`);
  }

  for (const filePlan of writtenFiles) {
    const content = readBinaryFile(filePlan.sourcePath);
    safeWriteBinaryFile(
      plan.projectRoot,
      filePlan.targetPath,
      content,
      `Playbook file write: ${filePlan.relativePath}`
    );
  }

  if (plan.gitignore?.action === "create") {
    safeWriteUtf8File(
      plan.projectRoot,
      plan.gitignore.targetPath,
      plan.gitignore.content ?? "",
      "Playbook gitignore write"
    );
  } else if (plan.gitignore?.action === "append") {
    safeAppendUtf8File(
      plan.projectRoot,
      plan.gitignore.targetPath,
      plan.gitignore.appendContent ?? "",
      "Playbook gitignore append"
    );
  }

  return {
    createdDirectories,
    writtenFiles,
    skippedFiles,
    gitignore: plan.gitignore
  };
}

export function renderPlaybookInitPlan(plan: PlaybookInitPlan, verbose = false): string {
  const directoryCounts = {
    create: plan.directories.filter((entry) => entry.action === "create").length,
    adopt: plan.directories.filter((entry) => entry.action === "adopt").length
  };
  const counts = {
    create: plan.files.filter((entry) => entry.action === "create").length,
    adopt: plan.files.filter((entry) => entry.action === "adopt").length,
    skip: plan.files.filter((entry) => entry.action === "skip").length
  };

  const lines = [
    `dotagent playbook init ${plan.playbookName}`,
    "",
    `project_root: ${plan.projectRoot}`,
    `playbook: ${plan.playbookName}`,
    `transport: ${plan.transport}`,
    `task: ${plan.taskName}`,
    `runtime_root: ${toProjectRelativePath(plan.projectRoot, plan.runtimeRoot)}`,
    `round_root: ${toProjectRelativePath(plan.projectRoot, plan.roundRoot)}`,
    `template_directories: create=${directoryCounts.create}, adopt=${directoryCounts.adopt}`,
    `template_files: create=${counts.create}, adopt=${counts.adopt}, skip=${counts.skip}`,
    `gitignore: ${plan.gitignore ? plan.gitignore.action : "unchanged"}`
  ];

  if (verbose) {
    lines.push("template_directory_actions:");
    if (plan.directories.length === 0) {
      lines.push("- (none)");
    } else {
      for (const directory of plan.directories) {
        lines.push(`- ${directory.action}: ${directory.relativePath}`);
      }
    }

    lines.push("template_file_actions:");
    if (plan.files.length === 0) {
      lines.push("- (none)");
    } else {
      for (const file of plan.files) {
        lines.push(`- ${file.action}: ${file.relativePath}`);
      }
    }
  }

  return lines.join("\n");
}

function planTemplateDirectories(
  projectRoot: string,
  templateRoot: string,
  roundRoot: string
): PlaybookInitDirectoryPlan[] {
  if (!fileExists(templateRoot)) {
    throw new DotagentError(`Playbook template directory is missing: ${templateRoot}`);
  }

  return collectDirectoryPaths(templateRoot, `Playbook template root: ${templateRoot}`).map((sourceDirectory) => {
    const relativeFromTemplate = path.relative(templateRoot, sourceDirectory);
    const targetPath = path.join(roundRoot, relativeFromTemplate);

    return {
      relativePath: toProjectRelativePath(projectRoot, targetPath),
      targetPath,
      action: fileExists(targetPath) ? "adopt" : "create"
    };
  });
}

function planTemplateFiles(projectRoot: string, templateRoot: string, roundRoot: string): PlaybookInitFilePlan[] {
  if (!fileExists(templateRoot)) {
    throw new DotagentError(`Playbook template directory is missing: ${templateRoot}`);
  }

  return collectFilePaths(templateRoot, `Playbook template root: ${templateRoot}`)
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
