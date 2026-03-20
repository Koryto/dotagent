import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import type { DotagentManifest } from "../models/manifest.js";
import { resolveDotagentRoot, resolveManifestPath } from "./paths.js";

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
  try {
    const raw = readFileSync(manifestPath, "utf8");
    return JSON.parse(raw) as DotagentManifest;
  } catch {
    return null;
  }
}

export function saveManifest(projectRoot: string, manifest: DotagentManifest): void {
  const dotagentRoot = resolveDotagentRoot(projectRoot);
  mkdirSync(dotagentRoot, { recursive: true });
  writeFileSync(resolveManifestPath(projectRoot), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}
