import type { ClaimStateCommand, CliContext } from "../models/command.js";
import { applyClaimStatePlan, planClaimState, renderClaimStatePlan } from "../core/claim-state.js";

export async function handleClaimState(command: ClaimStateCommand, context: CliContext): Promise<number> {
  const plan = planClaimState(context, command.sessionId, command.stateToPickup);
  context.logger.info(renderClaimStatePlan(plan));

  if (context.flags.dryRun) {
    return 0;
  }

  applyClaimStatePlan(context, plan);
  context.logger.info(["", "Session state claimed.", `active_state: ${plan.activeStatePath}`].join("\n"));
  return 0;
}
