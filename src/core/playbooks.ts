import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import type { BundledPlaybook } from "../models/playbook.js";
import { BundledAssetsError } from "../utils/errors.js";

export function listBundledPlaybooks(bundledAgentRoot: string): BundledPlaybook[] {
  const playbooksRoot = path.join(bundledAgentRoot, "playbooks");
  if (!existsSync(playbooksRoot)) {
    throw new BundledAssetsError(`Bundled playbooks directory is missing: ${playbooksRoot}`);
  }

  try {
    const playbooks: BundledPlaybook[] = [];

    for (const entry of readdirSync(playbooksRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const rootPath = path.join(playbooksRoot, entry.name);
      const playbookPath = path.join(rootPath, "PLAYBOOK.md");

      try {
        if (!statSync(playbookPath).isFile()) {
          throw new BundledAssetsError(`Bundled playbook path is not a file: ${playbookPath}`);
        }
      } catch (error) {
        if (error instanceof BundledAssetsError) {
          throw error;
        }

        throw new BundledAssetsError(`Bundled playbook is missing PLAYBOOK.md: ${playbookPath}`);
      }

      playbooks.push({
        name: entry.name,
        rootPath,
        playbookPath
      });
    }

    return playbooks.sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    if (error instanceof BundledAssetsError) {
      throw error;
    }

    throw new BundledAssetsError(`Bundled playbooks are unreadable: ${playbooksRoot}`);
  }
}
