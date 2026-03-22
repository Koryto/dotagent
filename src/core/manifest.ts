import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import type { DotagentManifest } from "../models/manifest.js";
import { normalizeRelativeSubpath, resolveDotagentRoot, resolveManifestPath } from "./paths.js";
import { safeWriteUtf8File } from "./files.js";
import { ManifestCorruptionError } from "../utils/errors.js";

export function createInitialManifest(frameworkRef: string, bundledPlaybooks: string[]): DotagentManifest {
  return {
    manifestVersion: 1,
    frameworkRef,
    bundledPlaybooks: [...bundledPlaybooks],
    installedAdapters: [],
    ownedFiles: []
  };
}

export function loadManifest(projectRoot: string): DotagentManifest | null {
  const manifestPath = resolveManifestPath(projectRoot);
  if (!existsSync(manifestPath)) {
    return null;
  }

  try {
    const raw = readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return validateManifest(parsed, manifestPath);
  } catch (error) {
    if (error instanceof ManifestCorruptionError) {
      throw error;
    }

    throw new ManifestCorruptionError(`Manifest is unreadable or invalid JSON: ${manifestPath}`);
  }
}

export function saveManifest(projectRoot: string, manifest: DotagentManifest): void {
  const dotagentRoot = resolveDotagentRoot(projectRoot);
  mkdirSync(dotagentRoot, { recursive: true });
  safeWriteUtf8File(
    projectRoot,
    resolveManifestPath(projectRoot),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "Manifest write"
  );
}

function validateManifest(candidate: unknown, manifestPath: string): DotagentManifest {
  if (!isNonNullObject(candidate)) {
    throw new ManifestCorruptionError(`Manifest has an invalid top-level shape: ${manifestPath}`);
  }

  if (candidate.manifestVersion !== 1) {
    throw new ManifestCorruptionError(`Manifest version is unsupported: ${manifestPath}`);
  }

  if (typeof candidate.frameworkRef !== "string") {
    throw new ManifestCorruptionError(`Manifest frameworkRef must be a string: ${manifestPath}`);
  }

  if (!isStringArray(candidate.bundledPlaybooks)) {
    throw new ManifestCorruptionError(`Manifest bundledPlaybooks must be a string array: ${manifestPath}`);
  }

  if (!isInstalledAdapterArray(candidate.installedAdapters)) {
    throw new ManifestCorruptionError(`Manifest installedAdapters has an invalid shape: ${manifestPath}`);
  }

  if (!isOwnedFilesArray(candidate.ownedFiles)) {
    throw new ManifestCorruptionError(`Manifest ownedFiles has an invalid shape: ${manifestPath}`);
  }

  return {
    manifestVersion: candidate.manifestVersion,
    frameworkRef: candidate.frameworkRef,
    bundledPlaybooks: [...candidate.bundledPlaybooks],
    installedAdapters: candidate.installedAdapters.map((entry) => ({ runtime: entry.runtime })),
    ownedFiles: [...candidate.ownedFiles]
  };
}

function isNonNullObject(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null;
}

function isStringArray(candidate: unknown): candidate is string[] {
  return Array.isArray(candidate) && candidate.every((entry) => typeof entry === "string");
}

function isInstalledAdapterArray(candidate: unknown): candidate is DotagentManifest["installedAdapters"] {
  return (
    Array.isArray(candidate) &&
    candidate.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.runtime === "string"
    )
  );
}

function isOwnedFilesArray(candidate: unknown): candidate is DotagentManifest["ownedFiles"] {
  return (
    Array.isArray(candidate) &&
    candidate.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.path === "string" &&
        isSafeManifestPath(entry.path) &&
        (entry.owner === "framework" || entry.owner === "playbook" || entry.owner === "adapter") &&
        (entry.contentHash === undefined || typeof entry.contentHash === "string")
    )
  );
}

function isSafeManifestPath(candidate: string): boolean {
  try {
    normalizeRelativeSubpath(candidate, "Manifest path");
    return true;
  } catch {
    return false;
  }
}
