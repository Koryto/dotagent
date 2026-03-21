import type { CliContext, PlaybookInitCommand } from "../../models/command.js";
import { NotImplementedCliError } from "../../utils/errors.js";

export async function handlePlaybookInit(command: PlaybookInitCommand, context: CliContext): Promise<number> {
  throw new NotImplementedCliError(
    `dotagent playbook init ${command.name} is not implemented yet. Project root resolved to: ${context.projectRoot}`
  );
}
