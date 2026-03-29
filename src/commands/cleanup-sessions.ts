import type { CleanupSessionsCommand, CliContext } from "../models/command.js";
import {
  applySessionMaintenancePlan,
  planCleanupSessions,
  renderSessionMaintenancePlan
} from "../core/session-maintenance.js";

export async function handleCleanupSessions(command: CleanupSessionsCommand, context: CliContext): Promise<number> {
  const plan = planCleanupSessions(context, command.days);
  context.logger.info(renderSessionMaintenancePlan(plan));

  if (context.flags.dryRun) {
    return 0;
  }

  applySessionMaintenancePlan(context, plan);
  context.logger.info(["", "Session cleanup complete.", `deleted: ${plan.targets.length}`].join("\n"));
  return 0;
}
