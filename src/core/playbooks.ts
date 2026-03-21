import { readdirSync, statSync } from "node:fs";
import path from "node:path";

import type { BundledPlaybook } from "../models/playbook.js";

export function listBundledPlaybooks(bundledAgentRoot: string): BundledPlaybook[] {
  const playbooksRoot = path.join(bundledAgentRoot, "playbooks");
  try {
    return readdirSync(playbooksRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const rootPath = path.join(playbooksRoot, entry.name);
        return {
          name: entry.name,
          rootPath,
          playbookPath: path.join(rootPath, "PLAYBOOK.md")
        };
      })
      .filter((playbook) => {
        try {
          return statSync(playbook.playbookPath).isFile();
        } catch {
          return false;
        }
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    return [];
  }
}
