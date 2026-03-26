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
  const results: BundledFrameworkSkill[] = [];
  const seenSkillNames = new Set<string>();

  const skillsRoot = path.join(bundledAgentRoot, "skills");
  if (fileExists(skillsRoot)) {
    collectSkillDirectories(skillsRoot, (skillName, skillPath) => {
      assertSkillFileExists(skillPath);
      pushUniqueSkill(results, seenSkillNames, {
        skillName,
        bundledRelativePath: `skills/${skillName}/SKILL.md`,
        sourcePath: `.agent/skills/${skillName}/SKILL.md`
      });
    });
  }

  const playbooksRoot = path.join(bundledAgentRoot, "playbooks");
  if (fileExists(playbooksRoot)) {
    for (const playbookEntry of readdirSync(playbooksRoot, { withFileTypes: true })) {
      if (!playbookEntry.isDirectory()) {
        continue;
      }

      const playbookSkillsRoot = path.join(playbooksRoot, playbookEntry.name, "skills");
      if (!fileExists(playbookSkillsRoot)) {
        continue;
      }

      collectSkillDirectories(playbookSkillsRoot, (skillName, skillPath) => {
        assertSkillFileExists(skillPath);
        pushUniqueSkill(results, seenSkillNames, {
          skillName,
          bundledRelativePath: `playbooks/${playbookEntry.name}/skills/${skillName}/SKILL.md`,
          sourcePath: `.agent/playbooks/${playbookEntry.name}/skills/${skillName}/SKILL.md`
        });
      });
    }
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

function collectSkillDirectories(
  rootPath: string,
  visit: (skillName: string, skillPath: string) => void
): void {
  for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    visit(entry.name, path.join(rootPath, entry.name, "SKILL.md"));
  }
}

function assertSkillFileExists(skillPath: string): void {
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
}

function pushUniqueSkill(
  results: BundledFrameworkSkill[],
  seenSkillNames: Set<string>,
  skill: BundledFrameworkSkill
): void {
  if (seenSkillNames.has(skill.skillName)) {
    throw new BundledAssetsError(`Bundled skill name is duplicated: ${skill.skillName}`);
  }

  seenSkillNames.add(skill.skillName);
  results.push(skill);
}
