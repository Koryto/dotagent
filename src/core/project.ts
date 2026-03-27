import { existsSync } from "node:fs";
import path from "node:path";

import { resolveDotagentRoot, resolveManifestPath } from "./paths.js";
import type { ProjectState } from "../models/project.js";

export function resolveProjectRoot(startDirectory: string): string {
  return path.resolve(startDirectory);
}

export function resolveExistingProjectRoot(startDirectory: string): string {
  const requestedRoot = path.resolve(startDirectory);
  let current = requestedRoot;

  while (true) {
    if (existsSync(resolveDotagentRoot(current)) || existsSync(resolveManifestPath(current))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return requestedRoot;
    }

    current = parent;
  }
}

export function detectProjectState(projectRoot: string): ProjectState {
  return {
    hasFramework: existsSync(resolveDotagentRoot(projectRoot)),
    hasManifest: existsSync(resolveManifestPath(projectRoot)),
    hasGitRoot: existsSync(path.join(projectRoot, ".git")),
    dotagentRoot: resolveDotagentRoot(projectRoot)
  };
}
