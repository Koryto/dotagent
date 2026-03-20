import path from "node:path";
import { fileURLToPath } from "node:url";

export const FRAMEWORK_DIRNAME = ".agent";
export const MANIFEST_FILENAME = ".dotagent-manifest.json";

export function resolvePackageRoot(moduleUrl: string): string {
  const moduleDirectory = path.dirname(fileURLToPath(moduleUrl));
  const candidateRoot = path.resolve(moduleDirectory, "..");
  const candidateName = path.basename(candidateRoot);

  if (candidateName === "dist" || candidateName === ".test-dist") {
    return path.resolve(candidateRoot, "..");
  }

  return candidateRoot;
}

export function resolveBundledAgentRoot(packageRoot: string): string {
  return path.resolve(packageRoot, "..", FRAMEWORK_DIRNAME);
}

export function resolveDotagentRoot(projectRoot: string): string {
  return path.join(projectRoot, FRAMEWORK_DIRNAME);
}

export function resolveManifestPath(projectRoot: string): string {
  return path.join(resolveDotagentRoot(projectRoot), MANIFEST_FILENAME);
}
