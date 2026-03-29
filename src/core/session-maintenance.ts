import { lstatSync, readdirSync } from "node:fs";
import path from "node:path";

import { ensureProjectDirectory, fileExists, safeRemoveFileIfExists, safeRenameFile } from "./files.js";
import { resolveDotagentRoot } from "./paths.js";
import type { CliContext } from "../models/command.js";
import { CliUsageError, DotagentError } from "../utils/errors.js";

export type SessionMaintenanceMode = "archive" | "cleanup";

interface SessionStateEntry {
  absolutePath: string;
  relativePath: string;
  fileName: string;
  mtimeMs: number;
}

interface SessionMaintenanceTarget {
  sourcePath: string;
  relativePath: string;
  destinationPath?: string;
}

export interface SessionMaintenancePlan {
  projectRoot: string;
  mode: SessionMaintenanceMode;
  days: number;
  cutoffIso: string;
  targets: readonly SessionMaintenanceTarget[];
}

export function planArchiveSessions(
  context: CliContext,
  days: number,
  nowMs = Date.now()
): SessionMaintenancePlan {
  const { sessionsRoot, archiveRoot } = resolveSessionDirectories(context.projectRoot);
  const cutoffMs = toCutoffMs(days, nowMs);
  const activeEntries = listSessionStateEntries(context.projectRoot, sessionsRoot);
  const targets = activeEntries
    .filter((entry) => entry.mtimeMs < cutoffMs)
    .map((entry) => {
      const destinationPath = path.join(archiveRoot, entry.fileName);
      if (fileExists(destinationPath)) {
        throw new DotagentError(
          `Archive target already exists for ${entry.fileName}: ${toProjectRelativePath(context.projectRoot, destinationPath)}`
        );
      }

      return {
        sourcePath: entry.absolutePath,
        relativePath: entry.relativePath,
        destinationPath
      };
    });

  return {
    projectRoot: context.projectRoot,
    mode: "archive",
    days,
    cutoffIso: new Date(cutoffMs).toISOString(),
    targets
  };
}

export function planCleanupSessions(
  context: CliContext,
  days: number,
  nowMs = Date.now()
): SessionMaintenancePlan {
  const { sessionsRoot, archiveRoot } = resolveSessionDirectories(context.projectRoot);
  const cutoffMs = toCutoffMs(days, nowMs);
  const targets = [...listSessionStateEntries(context.projectRoot, sessionsRoot), ...listSessionStateEntries(context.projectRoot, archiveRoot)]
    .filter((entry) => entry.mtimeMs < cutoffMs)
    .map((entry) => ({
      sourcePath: entry.absolutePath,
      relativePath: entry.relativePath
    }));

  return {
    projectRoot: context.projectRoot,
    mode: "cleanup",
    days,
    cutoffIso: new Date(cutoffMs).toISOString(),
    targets
  };
}

export function applySessionMaintenancePlan(context: CliContext, plan: SessionMaintenancePlan): SessionMaintenancePlan {
  const { sessionsRoot, archiveRoot } = resolveSessionDirectories(context.projectRoot);
  ensureProjectDirectory(context.projectRoot, sessionsRoot, "Session states directory");
  ensureProjectDirectory(context.projectRoot, archiveRoot, "Session archive directory");

  for (const target of plan.targets) {
    switch (plan.mode) {
      case "archive":
        if (!target.destinationPath) {
          throw new DotagentError(`Archive plan target is missing a destination path: ${target.relativePath}`);
        }
        safeRenameFile(context.projectRoot, target.sourcePath, target.destinationPath, "Session archive move");
        break;
      case "cleanup":
        safeRemoveFileIfExists(context.projectRoot, target.sourcePath, "Session cleanup remove");
        break;
      default:
        assertNever(plan.mode);
    }
  }

  return plan;
}

export function renderSessionMaintenancePlan(plan: SessionMaintenancePlan): string {
  const header =
    plan.mode === "archive" ? "dotagent archive-sessions" : "dotagent cleanup-sessions";
  const lines = [
    header,
    "",
    `project_root: ${plan.projectRoot}`,
    `days: ${plan.days}`,
    `cutoff_before: ${plan.cutoffIso}`,
    `matches: ${plan.targets.length}`
  ];

  if (plan.targets.length > 0) {
    lines.push("targets:");
    for (const target of plan.targets) {
      if (plan.mode === "archive" && target.destinationPath) {
        lines.push(
          `- ${target.relativePath} -> ${toProjectRelativePath(plan.projectRoot, target.destinationPath)}`
        );
        continue;
      }

      lines.push(`- ${target.relativePath}`);
    }
  }

  return lines.join("\n");
}

function resolveSessionDirectories(projectRoot: string): { sessionsRoot: string; archiveRoot: string } {
  const dotagentRoot = resolveDotagentRoot(projectRoot);
  const sessionsRoot = path.join(dotagentRoot, "state", "sessions");
  const archiveRoot = path.join(sessionsRoot, "archive");
  return { sessionsRoot, archiveRoot };
}

function listSessionStateEntries(projectRoot: string, directoryPath: string): SessionStateEntry[] {
  if (!fileExists(directoryPath)) {
    return [];
  }

  const entries: SessionStateEntry[] = [];
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    if (!entry.isFile() || !/^state_[A-Za-z0-9-]+\.md$/.test(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directoryPath, entry.name);
    const stats = lstatSync(absolutePath);
    if (!stats.isFile()) {
      continue;
    }

    entries.push({
      absolutePath,
      relativePath: toProjectRelativePath(projectRoot, absolutePath),
      fileName: entry.name,
      mtimeMs: stats.mtimeMs
    });
  }

  return entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function toCutoffMs(days: number, nowMs: number): number {
  if (!Number.isInteger(days) || days < 0) {
    throw new CliUsageError(`Session maintenance age must be a non-negative integer number of days. Received: ${days}`);
  }

  return nowMs - days * 24 * 60 * 60 * 1000;
}

function toProjectRelativePath(projectRoot: string, absolutePath: string): string {
  return path.relative(projectRoot, absolutePath).split(path.sep).join("/");
}

function assertNever(value: never): never {
  throw new DotagentError(`Unhandled session maintenance mode: ${JSON.stringify(value)}`);
}
