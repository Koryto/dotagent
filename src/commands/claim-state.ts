import type { ClaimStateCommand, CliContext } from "../models/command.js";
import { applyClaimStatePlan, planClaimState, renderClaimStatePlan } from "../core/claim-state.js";
import { resolveRuntimeSessionId } from "../core/runtime-session.js";

export async function handleClaimState(command: ClaimStateCommand, context: CliContext): Promise<number> {
  const sessionResolution = resolveRuntimeSessionId(command.sessionId, context.projectRoot);
  const plan = planClaimState(context, sessionResolution.sessionId, command.stateToPickup);
  context.logger.info(renderClaimStatePlan(plan, { sessionIdSource: sessionResolution.source }));

  if (context.flags.dryRun) {
    return 0;
  }

  applyClaimStatePlan(context, plan);
  context.logger.info(["", "Session state claimed.", `active_state: ${plan.activeStatePath}`].join("\n"));
  return 0;
}
