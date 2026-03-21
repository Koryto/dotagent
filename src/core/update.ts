import path from "node:path";

import { collectFilePaths, fileExists, hashBuffer, readBinaryFile, toRelativeManifestPath, writeBinaryFile } from "./files.js";
import { createInitialManifest, loadManifest, saveManifest } from "./manifest.js";
import { listBundledPlaybooks } from "./playbooks.js";
import { readFrameworkRef } from "./framework.js";
import type { CliContext } from "../models/command.js";
import type { DotagentManifest, FileOwnershipRecord } from "../models/manifest.js";
import { DotagentError } from "../utils/errors.js";

const UPDATE_NAMESPACES = ["workflows", "skills", "playbooks"] as const;

type UpdateOwner = Extract<FileOwnershipRecord["owner"], "framework" | "playbook">;
type UpdateAction = "create" | "update" | "adopt" | "skip";

export interface ManagedUpdatePlan {
  relativePath: string;
  targetPath: string;
  sourcePath: string;
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
  const files = planManagedUpdates(context.projectRoot, context.bundledAgentRoot, existingManifest);
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
  const updatedFiles = plan.files.filter((entry) => entry.action === "create" || entry.action === "update");

  for (const filePlan of updatedFiles) {
    const content = readBinaryFile(filePlan.sourcePath);
    writeBinaryFile(filePlan.targetPath, content);
  }

  saveManifest(plan.projectRoot, plan.manifest);

  return {
    updatedFiles,
    manifestPath: path.join(plan.projectRoot, ".agent", ".dotagent-manifest.json")
  };
}

export function renderUpdatePlan(plan: UpdatePlan): string {
  const counts = {
    create: plan.files.filter((entry) => entry.action === "create").length,
    update: plan.files.filter((entry) => entry.action === "update").length,
    adopt: plan.files.filter((entry) => entry.action === "adopt").length,
    skip: plan.files.filter((entry) => entry.action === "skip").length
  };

  return [
    "dotagent update",
    "",
    `project_root: ${plan.projectRoot}`,
    `framework_ref: ${plan.frameworkRef}`,
    `bundled_playbooks: ${plan.bundledPlaybooks.length > 0 ? plan.bundledPlaybooks.join(", ") : "(none)"}`,
    `managed_files: create=${counts.create}, update=${counts.update}, adopt=${counts.adopt}, skip=${counts.skip}`,
    "namespaces: workflows, skills, playbooks",
    "manifest: write .agent/.dotagent-manifest.json"
  ].join("\n");
}

function planManagedUpdates(
  projectRoot: string,
  bundledAgentRoot: string,
  existingManifest: DotagentManifest
): ManagedUpdatePlan[] {
  const plans: ManagedUpdatePlan[] = [];
  const ownership = new Map(existingManifest.ownedFiles.map((entry) => [entry.path, entry]));

  for (const namespace of UPDATE_NAMESPACES) {
    const sourceRoot = path.join(bundledAgentRoot, namespace);
    for (const sourcePath of collectFilePaths(sourceRoot)) {
      const relativeFromBundled = path.relative(bundledAgentRoot, sourcePath);
      const targetPath = path.join(projectRoot, ".agent", relativeFromBundled);
      const relativePath = toRelativeManifestPath(projectRoot, targetPath);
      const targetExists = fileExists(targetPath);
      const sourceHash = hashBuffer(readBinaryFile(sourcePath));
      const existingRecord = ownership.get(relativePath);
      const owner: UpdateOwner = namespace === "playbooks" ? "playbook" : "framework";

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

  return plans.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
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
