import type { CliContext } from "../models/command.js";
import { applyUpdatePlan, planUpdate, renderUpdatePlan } from "../core/update.js";
import { confirmProceed } from "../core/prompts.js";

export async function handleUpdate(context: CliContext): Promise<number> {
  const plan = planUpdate(context);
  context.logger.info(renderUpdatePlan(plan, context.flags.verbose));

  const writableChanges = plan.files.filter(
    (entry) => entry.action === "create" || entry.action === "update" || entry.action === "remove"
  );

  if (context.flags.dryRun) {
    return 0;
  }

  if (writableChanges.length === 0) {
    context.logger.info("\nNo managed updates required.");
    return 0;
  }

  const approved = await confirmProceed(context, "Proceed with dotagent update?");
  if (!approved) {
    context.logger.warn("Update cancelled.");
    return 0;
  }

  const result = applyUpdatePlan(plan);
  context.logger.info(
    [
      "",
      "Update complete.",
      `updated_files: ${result.updatedFiles.length}`,
      `manifest: ${result.manifestPath}`
    ].join("\n")
  );
  return 0;
}
