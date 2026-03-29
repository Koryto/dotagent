import type { ArchiveSessionsCommand, CliContext } from "../models/command.js";
import {
  applySessionMaintenancePlan,
  planArchiveSessions,
  renderSessionMaintenancePlan
} from "../core/session-maintenance.js";

export async function handleArchiveSessions(command: ArchiveSessionsCommand, context: CliContext): Promise<number> {
  const plan = planArchiveSessions(context, command.days);
  context.logger.info(renderSessionMaintenancePlan(plan));

  if (context.flags.dryRun) {
    return 0;
  }

  applySessionMaintenancePlan(context, plan);
  context.logger.info(["", "Session archive complete.", `archived: ${plan.targets.length}`].join("\n"));
  return 0;
}
