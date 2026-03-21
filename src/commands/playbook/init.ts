import type { CliContext, PlaybookInitCommand } from "../../models/command.js";
import { loadInstalledPlaybookContract } from "../../core/playbooks.js";
import { applyPlaybookInitPlan, planPlaybookInit, renderPlaybookInitPlan, resolvePlaybookTransport } from "../../core/playbook-init.js";
import { confirmProceed, resolvePlaybookTask } from "../../core/prompts.js";
import { DotagentError } from "../../utils/errors.js";

export async function handlePlaybookInit(command: PlaybookInitCommand, context: CliContext): Promise<number> {
  if (!context.projectState.hasFramework) {
    throw new DotagentError(`No .agent framework found in target project: ${context.projectRoot}`);
  }

  const contract = loadInstalledPlaybookContract(context.projectRoot, command.name);
  const { transport } = resolvePlaybookTransport(context, contract);
  const taskName = transport.taskScoped ? await resolvePlaybookTask(context, command.name) : "default";
  const plan = planPlaybookInit(context, command.name, taskName);
  context.logger.info(renderPlaybookInitPlan(plan));

  if (context.flags.dryRun) {
    return 0;
  }

  const writableChanges = plan.files.filter((entry) => entry.action === "create");
  const skippedFiles = plan.files.filter((entry) => entry.action === "skip");
  const shouldWriteGitignore = plan.gitignore?.action === "create" || plan.gitignore?.action === "append";
  if (writableChanges.length === 0 && !shouldWriteGitignore) {
    if (skippedFiles.length > 0) {
      context.logger.info(`\nNo writable playbook runtime changes required. Preserved divergent files: ${skippedFiles.length}.`);
      return 0;
    }

    context.logger.info("\nNo playbook runtime changes required.");
    return 0;
  }

  const approved = await confirmProceed(context, `Proceed with ${command.name} initialization?`);
  if (!approved) {
    context.logger.warn("Playbook initialization cancelled.");
    return 0;
  }

  const result = applyPlaybookInitPlan(plan);
  context.logger.info(
    [
      "",
      "Playbook initialization complete.",
      `created_files: ${result.writtenFiles.length}`,
      `preserved_divergent_files: ${result.skippedFiles.length}`
    ].join("\n")
  );
  return 0;
}
