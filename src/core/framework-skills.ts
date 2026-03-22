import path from "node:path";
import { readdirSync, statSync } from "node:fs";

import { fileExists } from "./files.js";

export interface BundledFrameworkSkill {
  skillName: string;
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
        continue;
      }
    } catch {
      continue;
    }

    results.push({
      skillName: entry.name,
      sourcePath: `.agent/skills/${entry.name}/SKILL.md`
    });
  }

  return results.sort((left, right) => left.skillName.localeCompare(right.skillName));
}
