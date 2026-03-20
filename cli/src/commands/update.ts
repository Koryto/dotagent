import type { CliContext } from "../models/command.js";
import { NotImplementedCliError } from "../utils/errors.js";

export async function handleUpdate(context: CliContext): Promise<number> {
  throw new NotImplementedCliError(
    `dotagent update is not implemented yet. Project root resolved to: ${context.projectRoot}`
  );
}
