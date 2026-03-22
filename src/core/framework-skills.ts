import path from "node:path";
import { readdirSync, statSync } from "node:fs";

import { fileExists } from "./files.js";
import { BundledAssetsError } from "../utils/errors.js";

export interface BundledFrameworkSkill {
  skillName: string;
  bundledRelativePath: string;
  sourcePath: string;
}

export function listBundledFrameworkSkills(bundledAgentRoot: string): BundledFrameworkSkill[] {
  const skillsRoot = path.join(bundledAgentRoot, "skills");
  if (!fileExists(skillsRoot)) {
    return [];
  }
  const results: BundledFrameworkSkill[] = [];

  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillPath = path.join(skillsRoot, entry.name, "SKILL.md");

    try {
      if (!statSync(skillPath).isFile()) {
        throw new BundledAssetsError(`Bundled skill is missing SKILL.md: ${skillPath}`);
      }
    } catch (error) {
      if (error instanceof BundledAssetsError) {
        throw error;
      }

      const errno = error as NodeJS.ErrnoException;
      if (errno.code === "ENOENT") {
        throw new BundledAssetsError(`Bundled skill is missing SKILL.md: ${skillPath}`);
      }

      throw error;
    }

    results.push({
      skillName: entry.name,
      bundledRelativePath: `skills/${entry.name}/SKILL.md`,
      sourcePath: `.agent/skills/${entry.name}/SKILL.md`
    });
  }

  return results.sort((left, right) => left.skillName.localeCompare(right.skillName));
}

export function assertBundledFrameworkSkillsAvailable(
  bundledAgentRoot: string,
  bundledSkills: readonly BundledFrameworkSkill[]
): void {
  if (bundledSkills.length === 0) {
    throw new BundledAssetsError(`No bundled framework skills found: ${path.join(bundledAgentRoot, "skills")}`);
  }

  for (const skill of bundledSkills) {
    const sourcePath = path.join(bundledAgentRoot, ...skill.bundledRelativePath.split("/"));
    if (!fileExists(sourcePath) || !statSync(sourcePath).isFile()) {
      throw new BundledAssetsError(`Bundled skill source is missing: ${sourcePath}`);
    }
  }
}
