import path from "node:path";

import type { SupportedRuntime } from "./adapters.js";
import { getRuntimeDescriptor } from "./adapters.js";
import { collectFilePaths, fileExists, filesAreEqual, hashBuffer, hashUtf8, readBinaryFile, readUtf8File, safeAppendUtf8File, safeWriteBinaryFile, safeWriteUtf8File, toRelativeManifestPath } from "./files.js";
import { createInitialManifest, loadManifest, saveManifest } from "./manifest.js";
import { listBundledPlaybooks } from "./playbooks.js";
import { renderAgentsBridge, renderRuntimeIndex } from "../runtime/templates.js";
import type { CliContext } from "../models/command.js";
import type { DotagentManifest, FileOwnershipRecord, InstalledAdapterRecord } from "../models/manifest.js";

type ManagedOwner = FileOwnershipRecord["owner"];
type PlanAction = "create" | "adopt" | "skip";
type GitignoreAction = "create" | "append" | "unchanged";

export interface ManagedFilePlan {
  relativePath: string;
  targetPath: string;
  owner: ManagedOwner;
  action: PlanAction;
  contentHash: string;
  sourcePath?: string;
  content?: string;
}

export interface GitignorePlan {
  targetPath: string;
  action: GitignoreAction;
  appendContent?: string;
  content?: string;
}

export interface InitPlan {
  projectRoot: string;
  frameworkRef: string;
  bundledPlaybooks: string[];
  runtimes: SupportedRuntime[];
  frameworkFiles: ManagedFilePlan[];
  adapterFiles: ManagedFilePlan[];
  gitignore: GitignorePlan;
  manifest: DotagentManifest;
}

export interface InitExecutionResult {
  frameworkFiles: ManagedFilePlan[];
  adapterFiles: ManagedFilePlan[];
  gitignore: GitignorePlan;
  manifestPath: string;
}

export function planInit(
  context: CliContext,
  frameworkRef: string,
  runtimes: SupportedRuntime[]
): InitPlan {
  const bundledPlaybooks = listBundledPlaybooks(context.bundledAgentRoot).map((entry) => entry.name);
  const existingManifest = loadManifest(context.projectRoot);

  const frameworkFiles = planBundledFrameworkFiles(context.projectRoot, context.bundledAgentRoot);
  const adapterFiles = planAdapterFiles(context.projectRoot, runtimes, bundledPlaybooks);
  const gitignore = planGitignore(context.projectRoot);
  const manifest = buildManifest(
    context.projectRoot,
    frameworkRef,
    bundledPlaybooks,
    existingManifest,
    frameworkFiles,
    adapterFiles,
    runtimes
  );

  return {
    projectRoot: context.projectRoot,
    frameworkRef,
    bundledPlaybooks,
    runtimes,
    frameworkFiles,
    adapterFiles,
    gitignore,
    manifest
  };
}

export function applyInitPlan(plan: InitPlan): InitExecutionResult {
  for (const filePlan of [...plan.frameworkFiles, ...plan.adapterFiles]) {
    if (filePlan.action !== "create") {
      continue;
    }

    if (filePlan.sourcePath) {
      const content = readBinaryFile(filePlan.sourcePath);
      safeWriteBinaryFile(
        plan.projectRoot,
        filePlan.targetPath,
        content,
        `Framework file write: ${filePlan.relativePath}`
      );
      continue;
    }

    safeWriteUtf8File(
      plan.projectRoot,
      filePlan.targetPath,
      filePlan.content ?? "",
      `Generated file write: ${filePlan.relativePath}`
    );
  }

  if (plan.gitignore.action === "create") {
    safeWriteUtf8File(plan.projectRoot, plan.gitignore.targetPath, plan.gitignore.content ?? "", "Init gitignore write");
  } else if (plan.gitignore.action === "append") {
    safeAppendUtf8File(
      plan.projectRoot,
      plan.gitignore.targetPath,
      plan.gitignore.appendContent ?? "",
      "Init gitignore append"
    );
  }

  saveManifest(plan.projectRoot, plan.manifest);

  return {
    frameworkFiles: plan.frameworkFiles,
    adapterFiles: plan.adapterFiles,
    gitignore: plan.gitignore,
    manifestPath: path.join(plan.projectRoot, ".agent", ".dotagent-manifest.json")
  };
}

export function renderInitPlan(plan: InitPlan, verbose = false): string {
  const lines = [
    "dotagent init",
    "",
    `project_root: ${plan.projectRoot}`,
    `framework_ref: ${plan.frameworkRef}`,
    `runtimes: ${plan.runtimes.length > 0 ? plan.runtimes.join(", ") : "(none)"}`,
    `bundled_playbooks: ${plan.bundledPlaybooks.length > 0 ? plan.bundledPlaybooks.join(", ") : "(none)"}`,
    summarizeManagedFiles("framework_files", plan.frameworkFiles),
    summarizeManagedFiles("adapter_files", plan.adapterFiles),
    `gitignore: ${plan.gitignore.action}`,
    `manifest: write .agent/.dotagent-manifest.json`
  ];

  if (verbose) {
    appendVerboseManagedFiles(lines, "framework_file_actions", plan.frameworkFiles);
    appendVerboseManagedFiles(lines, "adapter_file_actions", plan.adapterFiles);
  }

  return lines.join("\n");
}

function planBundledFrameworkFiles(projectRoot: string, bundledAgentRoot: string): ManagedFilePlan[] {
  const results: ManagedFilePlan[] = [];

  for (const sourcePath of collectFilePaths(bundledAgentRoot)) {
    const relativeFromBundled = path.relative(bundledAgentRoot, sourcePath);
    const targetPath = path.join(projectRoot, ".agent", relativeFromBundled);
    const relativePath = toRelativeManifestPath(projectRoot, targetPath);
    const owner = relativeFromBundled.startsWith("playbooks") ? "playbook" : "framework";

    if (!fileExists(targetPath)) {
      results.push({
        relativePath,
        targetPath,
        owner,
        action: "create",
        contentHash: hashBuffer(readBinaryFile(sourcePath)),
        sourcePath
      });
      continue;
    }

    results.push({
      relativePath,
      targetPath,
      owner,
      action: filesAreEqual(sourcePath, targetPath) ? "adopt" : "skip",
      contentHash: hashBuffer(readBinaryFile(sourcePath)),
      sourcePath
    });
  }

  return results;
}

function planAdapterFiles(
  projectRoot: string,
  runtimes: SupportedRuntime[],
  bundledPlaybooks: string[]
): ManagedFilePlan[] {
  const results: ManagedFilePlan[] = [];

  for (const runtime of runtimes) {
    const descriptor = getRuntimeDescriptor(runtime);
    const targetPath = path.join(projectRoot, descriptor.directoryName, "INDEX.md");
    const content = renderRuntimeIndex(runtime, bundledPlaybooks);
    results.push(planGeneratedFile(projectRoot, targetPath, content, "adapter"));
  }

  if (runtimes.length > 0) {
    const agentsPath = path.join(projectRoot, "AGENTS.md");
    results.push(planGeneratedFile(projectRoot, agentsPath, renderAgentsBridge(), "adapter"));
  }

  return results;
}

function planGeneratedFile(
  projectRoot: string,
  targetPath: string,
  content: string,
  owner: ManagedOwner
): ManagedFilePlan {
  const relativePath = toRelativeManifestPath(projectRoot, targetPath);
  if (!fileExists(targetPath)) {
    return {
      relativePath,
      targetPath,
      owner,
      action: "create",
      contentHash: hashUtf8(content),
      content
    };
  }

  const action = readUtf8File(targetPath) === content ? "adopt" : "skip";
  return {
    relativePath,
    targetPath,
    owner,
    action,
    contentHash: hashUtf8(content),
    content
  };
}

function planGitignore(projectRoot: string): GitignorePlan {
  const gitignorePath = path.join(projectRoot, ".gitignore");
  const requiredEntry = ".agent/";

  if (!fileExists(gitignorePath)) {
    return {
      targetPath: gitignorePath,
      action: "create",
      content: `${requiredEntry}\n`
    };
  }

  const current = readUtf8File(gitignorePath);
  const lines = current.split(/\r?\n/).map((line) => line.trim());
  if (lines.includes(requiredEntry)) {
    return {
      targetPath: gitignorePath,
      action: "unchanged"
    };
  }

  const prefix = current.endsWith("\n") || current.length === 0 ? "" : "\n";
  return {
    targetPath: gitignorePath,
    action: "append",
    appendContent: `${prefix}${requiredEntry}\n`
  };
}

function buildManifest(
  projectRoot: string,
  frameworkRef: string,
  bundledPlaybooks: string[],
  existingManifest: DotagentManifest | null,
  frameworkFiles: ManagedFilePlan[],
  adapterFiles: ManagedFilePlan[],
  runtimes: SupportedRuntime[]
): DotagentManifest {
  const manifest: DotagentManifest = {
    ...(existingManifest ?? createInitialManifest(frameworkRef, bundledPlaybooks)),
    frameworkRef,
    bundledPlaybooks: [...bundledPlaybooks],
    installedAdapters: [...(existingManifest?.installedAdapters ?? [])],
    ownedFiles: [...(existingManifest?.ownedFiles ?? [])]
  };

  manifest.ownedFiles = mergeOwnedFiles(manifest.ownedFiles, [...frameworkFiles, ...adapterFiles]);
  manifest.installedAdapters = mergeInstalledAdapters(projectRoot, manifest.installedAdapters, adapterFiles, runtimes);

  return manifest;
}

function mergeOwnedFiles(existing: FileOwnershipRecord[], plans: ManagedFilePlan[]): FileOwnershipRecord[] {
  const map = new Map(existing.map((entry) => [entry.path, entry]));

  for (const plan of plans) {
    if (plan.action === "skip") {
      map.delete(plan.relativePath);
      continue;
    }

    map.set(plan.relativePath, {
      path: plan.relativePath,
      owner: plan.owner,
      contentHash: plan.contentHash
    });
  }

  return [...map.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function mergeInstalledAdapters(
  projectRoot: string,
  existing: InstalledAdapterRecord[],
  adapterPlans: ManagedFilePlan[],
  runtimes: SupportedRuntime[]
): InstalledAdapterRecord[] {
  const map = new Map(existing.map((entry) => [entry.runtime, entry]));

  for (const runtime of runtimes) {
    const descriptor = getRuntimeDescriptor(runtime);
    const targetPath = path.join(projectRoot, descriptor.directoryName, "INDEX.md");
    const plan = adapterPlans.find((entry) => entry.targetPath === targetPath);
    if (!plan) {
      continue;
    }

    map.set(runtime, {
      runtime,
      path: toRelativeManifestPath(projectRoot, targetPath)
    });
  }

  return [...map.values()].sort((left, right) => left.runtime.localeCompare(right.runtime));
}

function summarizeManagedFiles(label: string, plans: ManagedFilePlan[]): string {
  const counts = {
    create: plans.filter((plan) => plan.action === "create").length,
    adopt: plans.filter((plan) => plan.action === "adopt").length,
    skip: plans.filter((plan) => plan.action === "skip").length
  };

  return `${label}: create=${counts.create}, adopt=${counts.adopt}, skip=${counts.skip}`;
}

function appendVerboseManagedFiles(lines: string[], label: string, plans: ManagedFilePlan[]): void {
  lines.push(`${label}:`);

  if (plans.length === 0) {
    lines.push("- (none)");
    return;
  }

  for (const plan of plans) {
    lines.push(`- ${plan.action}: ${plan.relativePath}`);
  }
}
