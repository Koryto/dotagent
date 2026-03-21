import type { CliContext } from "../../models/command.js";
import { listBundledPlaybooks } from "../../core/playbooks.js";
import { formatList } from "../../utils/text.js";

export async function handlePlaybookList(context: CliContext): Promise<number> {
  const playbooks = listBundledPlaybooks(context.bundledAgentRoot).map((playbook) => playbook.name);

  if (playbooks.length === 0) {
    context.logger.info("No bundled playbooks found.");
    return 0;
  }

  context.logger.info(formatList(playbooks));
  return 0;
}
