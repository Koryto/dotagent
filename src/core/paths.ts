import path from "node:path";
import { fileURLToPath } from "node:url";
import { DotagentError } from "../utils/errors.js";

export const FRAMEWORK_DIRNAME = ".agent";
export const MANIFEST_FILENAME = ".dotagent-manifest.json";

export function resolvePackageRoot(moduleUrl: string): string {
  const moduleDirectory = path.dirname(fileURLToPath(moduleUrl));
  const candidateRoot = path.resolve(moduleDirectory, "..");
  const candidateName = path.basename(candidateRoot);

  if (candidateName === ".test-dist") {
    return path.resolve(candidateRoot, "..");
  }

  return candidateRoot;
}

export function resolveBundledAgentRoot(packageRoot: string): string {
  return path.resolve(packageRoot, FRAMEWORK_DIRNAME);
}

export function resolveDotagentRoot(projectRoot: string): string {
  return path.join(projectRoot, FRAMEWORK_DIRNAME);
}

export function resolveManifestPath(projectRoot: string): string {
  return path.join(resolveDotagentRoot(projectRoot), MANIFEST_FILENAME);
}

export function normalizeRelativeSubpath(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new DotagentError(`${label} must be a non-empty relative path.`);
  }

  if (path.isAbsolute(trimmed)) {
    throw new DotagentError(`${label} must be relative, not absolute: ${value}`);
  }

  const segments = trimmed.split(/[\\/]+/);
  if (
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    throw new DotagentError(`${label} must not contain path traversal or empty segments: ${value}`);
  }

  return segments.join("/");
}

export function assertPathWithinRoot(rootPath: string, targetPath: string, label: string): string {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);

  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return resolvedTarget;
  }

  throw new DotagentError(`${label} escapes the allowed root: ${targetPath}`);
}
