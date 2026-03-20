import type { CliContext } from "../models/command.js";
import { listBundledPlaybooks } from "../core/playbooks.js";
import { formatList } from "../utils/text.js";

export async function handleDoctor(context: CliContext): Promise<number> {
  const playbooks = listBundledPlaybooks(context.bundledAgentRoot).map((playbook) => playbook.name);

  const lines = [
    "dotagent doctor",
    "",
    `project_root: ${context.projectRoot}`,
    `framework_present: ${String(context.projectState.hasFramework)}`,
    `manifest_present: ${String(context.projectState.hasManifest)}`,
    `git_root_present: ${String(context.projectState.hasGitRoot)}`,
    `bundled_playbooks: ${playbooks.length}`
  ];

  if (playbooks.length > 0) {
    lines.push(formatList(playbooks));
  }

  context.logger.info(lines.join("\n"));
  return 0;
}
