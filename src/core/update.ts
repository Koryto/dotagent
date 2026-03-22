import { statSync } from "node:fs";
import path from "node:path";

import { collectFilePaths, fileExists, hashBuffer, hashUtf8, readBinaryFile, readUtf8File, safeRemoveFileIfExists, safeWriteBinaryFile, safeWriteUtf8File, toRelativeManifestPath } from "./files.js";
import { getRuntimeBridgeRelativePath, getRuntimeManifestRelativePath, isRuntimeBridgePath, resolveRuntimeInstalledAt, SUPPORTED_RUNTIMES } from "./adapters.js";
import { assertBundledFrameworkSkillsAvailable, listBundledFrameworkSkills } from "./framework-skills.js";
import { createInitialManifest, loadManifest, saveManifest } from "./manifest.js";
import { listBundledPlaybooks } from "./playbooks.js";
import { readFrameworkRef } from "./framework.js";
import { renderRuntimeAdapterManifest, renderRuntimeInitBridge, renderRuntimeSkillBridge } from "../runtime/templates.js";
import type { CliContext } from "../models/command.js";
import type { SupportedRuntime } from "./adapters.js";
import type { DotagentManifest, FileOwnershipRecord } from "../models/manifest.js";
import { BundledAssetsError, DotagentError } from "../utils/errors.js";

const UPDATE_NAMESPACES = ["workflows", "skills", "playbooks"] as const;

type UpdateOwner = FileOwnershipRecord["owner"];
type UpdateAction = "create" | "update" | "remove" | "adopt" | "skip";

export interface ManagedUpdatePlan {
  relativePath: string;
  targetPath: string;
  sourcePath?: string;
  content?: string;
  owner: UpdateOwner;
  action: UpdateAction;
  contentHash: string;
}

export interface UpdatePlan {
  projectRoot: string;
  frameworkRef: string;
  bundledPlaybooks: string[];
  files: ManagedUpdatePlan[];
  manifest: DotagentManifest;
}

export interface UpdateExecutionResult {
  updatedFiles: ManagedUpdatePlan[];
  manifestPath: string;
}

export function planUpdate(context: CliContext): UpdatePlan {
  if (!context.projectState.hasFramework) {
    throw new DotagentError(`No .agent framework found in target project: ${context.projectRoot}`);
  }

  const existingManifest = loadManifest(context.projectRoot);
  if (!existingManifest) {
    throw new DotagentError(
      `No manifest found in target project. Re-run \`dotagent init\` first: ${context.projectRoot}`
    );
  }

  const frameworkRef = readFrameworkRef(context.packageRoot);
  const bundledPlaybooks = listBundledPlaybooks(context.bundledAgentRoot).map((entry) => entry.name);
  const files = planManagedUpdates(
    context.projectRoot,
    context.bundledAgentRoot,
    frameworkRef,
    bundledPlaybooks,
    existingManifest
  );
  const manifest = buildUpdatedManifest(existingManifest, frameworkRef, bundledPlaybooks, files);

  return {
    projectRoot: context.projectRoot,
    frameworkRef,
    bundledPlaybooks,
    files,
    manifest
  };
}

export function applyUpdatePlan(plan: UpdatePlan): UpdateExecutionResult {
  const updatedFiles = plan.files.filter(
    (entry) => entry.action === "create" || entry.action === "update" || entry.action === "remove"
  );

  for (const filePlan of updatedFiles) {
    if (filePlan.action === "remove") {
      safeRemoveFileIfExists(plan.projectRoot, filePlan.targetPath, `Managed file remove: ${filePlan.relativePath}`);
      continue;
    }

    if (filePlan.sourcePath) {
      const content = readBinaryFile(filePlan.sourcePath);
      safeWriteBinaryFile(
        plan.projectRoot,
        filePlan.targetPath,
        content,
        `Managed file write: ${filePlan.relativePath}`
      );
      continue;
    }

    safeWriteUtf8File(
      plan.projectRoot,
      filePlan.targetPath,
      requirePlannedUtf8Content(filePlan),
      `Managed file write: ${filePlan.relativePath}`
    );
  }

  saveManifest(plan.projectRoot, plan.manifest);

  return {
    updatedFiles,
    manifestPath: path.join(plan.projectRoot, ".agent", ".dotagent-manifest.json")
  };
}

export function renderUpdatePlan(plan: UpdatePlan, verbose = false): string {
  const counts = {
    create: plan.files.filter((entry) => entry.action === "create").length,
    update: plan.files.filter((entry) => entry.action === "update").length,
    remove: plan.files.filter((entry) => entry.action === "remove").length,
    adopt: plan.files.filter((entry) => entry.action === "adopt").length,
    skip: plan.files.filter((entry) => entry.action === "skip").length
  };

  const lines = [
    "dotagent update",
    "",
    `project_root: ${plan.projectRoot}`,
    `framework_ref: ${plan.frameworkRef}`,
    `bundled_playbooks: ${plan.bundledPlaybooks.length > 0 ? plan.bundledPlaybooks.join(", ") : "(none)"}`,
    `managed_files: create=${counts.create}, update=${counts.update}, remove=${counts.remove}, adopt=${counts.adopt}, skip=${counts.skip}`,
    "namespaces: workflows, skills, playbooks, installed runtime adapters",
    "manifest: write .agent/.dotagent-manifest.json"
  ];

  if (verbose) {
    lines.push("managed_file_actions:");
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

function planManagedUpdates(
  projectRoot: string,
  bundledAgentRoot: string,
  frameworkRef: string,
  bundledPlaybooks: string[],
  existingManifest: DotagentManifest
): ManagedUpdatePlan[] {
  const plans: ManagedUpdatePlan[] = [];
  const ownership = new Map(existingManifest.ownedFiles.map((entry) => [entry.path, entry]));
  const seenPaths = new Set<string>();

  for (const namespace of UPDATE_NAMESPACES) {
    const sourceRoot = path.join(bundledAgentRoot, namespace);
    if (!fileExists(sourceRoot) || !statSync(sourceRoot).isDirectory()) {
      throw new BundledAssetsError(`Bundled namespace is missing: ${sourceRoot}`);
    }

    for (const sourcePath of collectFilePaths(sourceRoot, `Managed namespace source: ${sourceRoot}`)) {
      const relativeFromBundled = path.relative(bundledAgentRoot, sourcePath);
      const targetPath = path.join(projectRoot, ".agent", relativeFromBundled);
      const relativePath = toRelativeManifestPath(projectRoot, targetPath);
      const targetExists = fileExists(targetPath);
      const sourceHash = hashBuffer(readBinaryFile(sourcePath));
      const existingRecord = ownership.get(relativePath);
      const owner: UpdateOwner = namespace === "playbooks" ? "playbook" : "framework";
      seenPaths.add(relativePath);

      if (!targetExists) {
        plans.push({
          relativePath,
          targetPath,
          sourcePath,
          owner,
          action: "create",
          contentHash: sourceHash
        });
        continue;
      }

      const targetHash = hashBuffer(readBinaryFile(targetPath));
      if (targetHash === sourceHash) {
        plans.push({
          relativePath,
          targetPath,
          sourcePath,
          owner,
          action: "adopt",
          contentHash: sourceHash
        });
        continue;
      }

      if (existingRecord?.contentHash && existingRecord.contentHash === targetHash) {
        plans.push({
          relativePath,
          targetPath,
          sourcePath,
          owner,
          action: "update",
          contentHash: sourceHash
        });
        continue;
      }

      plans.push({
        relativePath,
        targetPath,
        sourcePath,
        owner,
        action: "skip",
        contentHash: sourceHash
      });
    }
  }

  const installedRuntimes = normalizeInstalledRuntimes(existingManifest);
  const bundledSkills = listBundledFrameworkSkills(bundledAgentRoot);
  if (installedRuntimes.length > 0) {
    assertBundledFrameworkSkillsAvailable(bundledAgentRoot, bundledSkills);
  }

  for (const runtime of installedRuntimes) {
    const runtimeManifestTargetPath = path.join(projectRoot, ...getRuntimeManifestRelativePath(runtime).split("/"));
    seenPaths.add(toRelativeManifestPath(projectRoot, runtimeManifestTargetPath));
    plans.push(
      planGeneratedManagedUpdate(
        projectRoot,
        runtimeManifestTargetPath,
        renderRuntimeAdapterManifest(runtime, frameworkRef, resolveRuntimeInstalledAt(projectRoot, runtime)),
        "adapter",
        ownership.get(toRelativeManifestPath(projectRoot, runtimeManifestTargetPath))
      )
    );

    for (const skill of bundledSkills) {
      const targetPath = path.join(projectRoot, ...getRuntimeBridgeRelativePath(runtime, skill.skillName).split("/"));
      const relativePath = toRelativeManifestPath(projectRoot, targetPath);
      seenPaths.add(relativePath);
      const content =
        skill.skillName === "init"
          ? renderRuntimeInitBridge(runtime, bundledSkills, bundledPlaybooks)
          : renderRuntimeSkillBridge(runtime, skill);

      plans.push(
        planGeneratedManagedUpdate(projectRoot, targetPath, content, "adapter", ownership.get(relativePath))
      );
    }
  }

  for (const existingRecord of existingManifest.ownedFiles) {
    if (!isUpdateManagedRecord(existingRecord)) {
      continue;
    }

    if (seenPaths.has(existingRecord.path)) {
      continue;
    }

    const targetPath = path.join(projectRoot, ...existingRecord.path.split("/"));
    const targetExists = fileExists(targetPath);
    const owner: UpdateOwner = existingRecord.owner;

    if (!targetExists) {
      continue;
    }

    const targetHash = hashBuffer(readBinaryFile(targetPath));
    if (existingRecord.contentHash && existingRecord.contentHash === targetHash) {
      plans.push({
        relativePath: existingRecord.path,
        targetPath,
        owner,
        action: "remove",
        contentHash: existingRecord.contentHash
      });
      continue;
    }

    plans.push({
      relativePath: existingRecord.path,
      targetPath,
      owner,
      action: "skip",
      contentHash: existingRecord.contentHash ?? ""
    });
  }

  return plans.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function requirePlannedUtf8Content(plan: Pick<ManagedUpdatePlan, "relativePath" | "content">): string {
  if (typeof plan.content === "string") {
    return plan.content;
  }

  throw new DotagentError(`Generated file content was missing from the update plan: ${plan.relativePath}`);
}

function planGeneratedManagedUpdate(
  projectRoot: string,
  targetPath: string,
  content: string,
  owner: UpdateOwner,
  existingRecord: FileOwnershipRecord | undefined
): ManagedUpdatePlan {
  const relativePath = toRelativeManifestPath(projectRoot, targetPath);
  const sourceHash = hashUtf8(content);

  if (!fileExists(targetPath)) {
    return {
      relativePath,
      targetPath,
      owner,
      action: "create",
      contentHash: sourceHash,
      content
    };
  }

  const targetHash = hashUtf8(readUtf8File(targetPath));
  if (targetHash === sourceHash) {
    return {
      relativePath,
      targetPath,
      owner,
      action: "adopt",
      contentHash: sourceHash,
      content
    };
  }

  if (existingRecord?.contentHash && existingRecord.contentHash === targetHash) {
    return {
      relativePath,
      targetPath,
      owner,
      action: "update",
      contentHash: sourceHash,
      content
    };
  }

  return {
    relativePath,
    targetPath,
    owner,
    action: "skip",
    contentHash: sourceHash,
    content
  };
}

function buildUpdatedManifest(
  existingManifest: DotagentManifest,
  frameworkRef: string,
  bundledPlaybooks: string[],
  plans: ManagedUpdatePlan[]
): DotagentManifest {
  const manifest: DotagentManifest = {
    ...(existingManifest ?? createInitialManifest(frameworkRef, bundledPlaybooks)),
    frameworkRef,
    bundledPlaybooks: [...bundledPlaybooks],
    installedAdapters: [...existingManifest.installedAdapters],
    ownedFiles: [...existingManifest.ownedFiles]
  };

  const ownership = new Map(manifest.ownedFiles.map((entry) => [entry.path, entry]));

  for (const plan of plans) {
    if (plan.action === "skip") {
      continue;
    }

    if (plan.action === "remove") {
      ownership.delete(plan.relativePath);
      continue;
    }

    ownership.set(plan.relativePath, {
      path: plan.relativePath,
      owner: plan.owner,
      contentHash: plan.contentHash
    });
  }

  manifest.ownedFiles = [...ownership.values()].sort((left, right) => left.path.localeCompare(right.path));
  return manifest;
}

function isUpdateManagedRecord(record: FileOwnershipRecord): record is FileOwnershipRecord & { owner: UpdateOwner } {
  if (record.owner === "adapter") {
    return (
      (SUPPORTED_RUNTIMES as readonly SupportedRuntime[]).some((runtime) => isRuntimeBridgePath(runtime, record.path)) ||
      (SUPPORTED_RUNTIMES as readonly SupportedRuntime[]).some(
        (runtime) => record.path === getRuntimeManifestRelativePath(runtime)
      )
    );
  }

  if (record.owner !== "framework" && record.owner !== "playbook") {
    return false;
  }

  return UPDATE_NAMESPACES.some((namespace) => record.path.startsWith(`.agent/${namespace}/`));
}

function normalizeInstalledRuntimes(existingManifest: DotagentManifest): SupportedRuntime[] {
  const runtimes = existingManifest.installedAdapters
    .map((entry) => entry.runtime)
    .filter((runtime): runtime is SupportedRuntime =>
      (SUPPORTED_RUNTIMES as readonly string[]).includes(runtime)
    );

  return [...new Set(runtimes)].sort((left, right) => left.localeCompare(right));
}
