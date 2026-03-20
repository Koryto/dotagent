import { existsSync } from "node:fs";
import path from "node:path";

import { resolveDotagentRoot, resolveManifestPath } from "./paths.js";
import type { ProjectState } from "../models/project.js";

const PROJECT_ROOT_MARKERS = [".agent", ".git"];

export function resolveProjectRoot(startDirectory: string): string {
  let current = path.resolve(startDirectory);

  while (true) {
    if (containsProjectMarker(current)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDirectory);
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

function containsProjectMarker(directory: string): boolean {
  return PROJECT_ROOT_MARKERS.some((marker) => existsSync(path.join(directory, marker)));
}
