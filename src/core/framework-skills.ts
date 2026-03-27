import path from "node:path";
import { readdirSync, statSync } from "node:fs";

import { fileExists, readUtf8File } from "./files.js";
import { BundledAssetsError } from "../utils/errors.js";

export interface FrameworkSkillInvocationArg {
  name: string;
  required: boolean;
}

export interface BundledFrameworkSkill {
  skillName: string;
  bundledRelativePath: string;
  sourcePath: string;
  invocationArgs: FrameworkSkillInvocationArg[];
}

export function listBundledFrameworkSkills(bundledAgentRoot: string): BundledFrameworkSkill[] {
  const results: BundledFrameworkSkill[] = [];
  const seenSkillNames = new Set<string>();

  const skillsRoot = path.join(bundledAgentRoot, "skills");
  if (fileExists(skillsRoot)) {
    collectSkillDirectories(skillsRoot, (skillName, skillPath) => {
      const skillContent = readBundledSkillContent(skillPath);
      pushUniqueSkill(results, seenSkillNames, {
        skillName,
        bundledRelativePath: `skills/${skillName}/SKILL.md`,
        sourcePath: `.agent/skills/${skillName}/SKILL.md`,
        invocationArgs: readSkillInvocationArgs(skillContent, skillPath)
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
        const skillContent = readBundledSkillContent(skillPath);
        pushUniqueSkill(results, seenSkillNames, {
          skillName,
          bundledRelativePath: `playbooks/${playbookEntry.name}/skills/${skillName}/SKILL.md`,
          sourcePath: `.agent/playbooks/${playbookEntry.name}/skills/${skillName}/SKILL.md`,
          invocationArgs: readSkillInvocationArgs(skillContent, skillPath)
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

function readBundledSkillContent(skillPath: string): string {
  try {
    if (!statSync(skillPath).isFile()) {
      throw new BundledAssetsError(`Bundled skill is missing SKILL.md: ${skillPath}`);
    }

    return readUtf8File(skillPath);
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

function readSkillInvocationArgs(skillContent: string, skillPath: string): FrameworkSkillInvocationArg[] {
  const frontmatter = extractFrontmatter(skillContent);
  if (!frontmatter) {
    return [];
  }

  return parseInvocationArgs(frontmatter, skillPath);
}

function extractFrontmatter(content: string): string | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  return match?.[1] ?? null;
}

function parseInvocationArgs(frontmatter: string, skillPath: string): FrameworkSkillInvocationArg[] {
  const lines = frontmatter.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const headerLine = lines[index];
    if (!headerLine || headerLine.trim() !== "invocation-args:") {
      continue;
    }

    const invocationArgs: FrameworkSkillInvocationArg[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];
      if (line === undefined) {
        break;
      }

      if (line.trim().length === 0) {
        continue;
      }

      if (!line.startsWith("  ")) {
        break;
      }

      const match = /^  ([A-Za-z0-9_-]+): (required|optional)\s*$/.exec(line);
      if (!match) {
        throw new BundledAssetsError(`Bundled skill has invalid invocation-args metadata: ${skillPath}`);
      }

      const name = match[1];
      const requirement = match[2];
      if (!name || !requirement) {
        throw new BundledAssetsError(`Bundled skill has invalid invocation-args metadata: ${skillPath}`);
      }

      invocationArgs.push({
        name,
        required: requirement === "required"
      });
    }

    return invocationArgs;
  }

  return [];
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
