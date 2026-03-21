import type { CliContext } from "../models/command.js";
import { readFrameworkRef } from "../core/framework.js";
import { applyInitPlan, planInit, renderInitPlan } from "../core/init.js";
import { confirmProceed, resolveInitRuntimes } from "../core/prompts.js";

export async function handleInit(context: CliContext): Promise<number> {
  const runtimes = await resolveInitRuntimes(context);
  const frameworkRef = readFrameworkRef(context.packageRoot);
  const plan = planInit(context, frameworkRef, runtimes);

  context.logger.info(renderInitPlan(plan));

  if (context.flags.dryRun) {
    return 0;
  }

  const approved = await confirmProceed(context, "Proceed with dotagent initialization?");
  if (!approved) {
    context.logger.warn("Initialization cancelled.");
    return 0;
  }

  const result = applyInitPlan(plan);
  context.logger.info(
    [
      "",
      "Initialization complete.",
      `manifest: ${result.manifestPath}`
    ].join("\n")
  );
  return 0;
}
