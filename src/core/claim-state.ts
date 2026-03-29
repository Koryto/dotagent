import { renameSync } from "node:fs";
import path from "node:path";

import { ensureProjectDirectory, fileExists, readUtf8File, safeWriteUtf8File } from "./files.js";
import { resolveDotagentRoot } from "./paths.js";
import type { CliContext } from "../models/command.js";
import { CliUsageError, DotagentError } from "../utils/errors.js";

export type ClaimStateAction = "claim-existing" | "claim-pickup" | "create";
export type PickupStatus = "not-provided" | "ignored-existing-session" | "claimed" | "missing-fallback-created";

export interface ClaimStatePlan {
  projectRoot: string;
  sessionId: string;
  stateToPickup?: string;
  action: ClaimStateAction;
  pickupStatus: PickupStatus;
  activeStatePath: string;
  message: string;
  sourceTemplatePath?: string;
  pickupSourcePath?: string;
}

export function planClaimState(
  context: CliContext,
  sessionId: string,
  stateToPickup?: string
): ClaimStatePlan {
  const dotagentRoot = resolveDotagentRoot(context.projectRoot);
  const sessionsRoot = path.join(dotagentRoot, "state", "sessions");
  const templatePath = path.join(dotagentRoot, "state", "session_state_template.md");
  const activeStatePath = path.join(sessionsRoot, toSessionStateFilename(sessionId));
  const normalizedPickup = typeof stateToPickup === "string" ? normalizeSessionStateFilename(stateToPickup) : undefined;
  const pickupSourcePath = normalizedPickup ? path.join(sessionsRoot, normalizedPickup) : undefined;

  if (!fileExists(templatePath)) {
    throw new DotagentError("Session state template is missing: .agent/state/session_state_template.md");
  }

  if (fileExists(activeStatePath)) {
    return {
      projectRoot: context.projectRoot,
      sessionId,
      action: "claim-existing",
      pickupStatus: normalizedPickup ? "ignored-existing-session" : "not-provided",
      activeStatePath,
      ...(normalizedPickup ? { stateToPickup: normalizedPickup } : {}),
      ...(pickupSourcePath ? { pickupSourcePath } : {}),
      message: normalizedPickup
        ? `Bound to existing session file state_${sessionId}.md. Pickup request ${normalizedPickup} was not applied because this session already owns a state file.`
        : `Bound to existing session file state_${sessionId}.md.`
    };
  }

  if (normalizedPickup && pickupSourcePath && fileExists(pickupSourcePath)) {
    return {
      projectRoot: context.projectRoot,
      sessionId,
      action: "claim-pickup",
      pickupStatus: "claimed",
      activeStatePath,
      ...(normalizedPickup ? { stateToPickup: normalizedPickup } : {}),
      ...(pickupSourcePath ? { pickupSourcePath } : {}),
      message: `Claimed ${normalizedPickup} and rebound it to state_${sessionId}.md.`
    };
  }

  return {
    projectRoot: context.projectRoot,
    sessionId,
    action: "create",
    pickupStatus: normalizedPickup ? "missing-fallback-created" : "not-provided",
    activeStatePath,
    ...(normalizedPickup ? { stateToPickup: normalizedPickup } : {}),
    ...(pickupSourcePath ? { pickupSourcePath } : {}),
    sourceTemplatePath: templatePath,
    message: normalizedPickup
      ? `${normalizedPickup} was not found. Created and bound a new session file at state_${sessionId}.md instead.`
      : `Created and bound a new session file at state_${sessionId}.md.`
  };
}

export function applyClaimStatePlan(context: CliContext, plan: ClaimStatePlan): ClaimStatePlan {
  const dotagentRoot = resolveDotagentRoot(context.projectRoot);
  const sessionsRoot = path.join(dotagentRoot, "state", "sessions");
  ensureProjectDirectory(context.projectRoot, sessionsRoot, "Session states directory");

  switch (plan.action) {
    case "claim-existing": {
      const updatedContent = bindSessionState(readUtf8File(plan.activeStatePath), plan.sessionId);
      safeWriteUtf8File(context.projectRoot, plan.activeStatePath, updatedContent, "Session state claim");
      return plan;
    }
    case "claim-pickup": {
      if (!plan.pickupSourcePath) {
        throw new DotagentError("Claim-state plan is missing the pickup source path.");
      }
      const reboundContent = bindSessionState(readUtf8File(plan.pickupSourcePath), plan.sessionId);
      safeWriteUtf8File(context.projectRoot, plan.pickupSourcePath, reboundContent, "Session pickup rewrite");
      renameSync(plan.pickupSourcePath, plan.activeStatePath);
      return plan;
    }
    case "create": {
      if (!plan.sourceTemplatePath) {
        throw new DotagentError("Claim-state plan is missing the session state template path.");
      }
      const createdContent = bindSessionState(readUtf8File(plan.sourceTemplatePath), plan.sessionId);
      safeWriteUtf8File(context.projectRoot, plan.activeStatePath, createdContent, "Session state create");
      return plan;
    }
    default:
      return assertNever(plan.action);
  }
}

export function renderClaimStatePlan(plan: ClaimStatePlan): string {
  return [
    "dotagent claim-state",
    "",
    `project_root: ${plan.projectRoot}`,
    `session_id: ${plan.sessionId}`,
    `state_to_pickup: ${plan.stateToPickup ?? "(none)"}`,
    `action: ${plan.action}`,
    `pickup_status: ${plan.pickupStatus}`,
    `active_state: ${toProjectRelativePath(plan.projectRoot, plan.activeStatePath)}`,
    `message: ${plan.message}`
  ].join("\n");
}

export function toSessionStateFilename(sessionId: string): string {
  return `state_${normalizeSessionId(sessionId)}.md`;
}

function normalizeSessionStateFilename(value: string): string {
  const trimmed = value.trim();
  if (!/^state_[A-Za-z0-9-]+\.md$/.test(trimmed)) {
    throw new CliUsageError(`Invalid state file name: ${value}. Expected state_<session_id>.md.`);
  }

  return trimmed;
}

function normalizeSessionId(value: string): string {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9-]+$/.test(trimmed)) {
    throw new CliUsageError(`Invalid session id: ${value}.`);
  }

  return trimmed;
}

function bindSessionState(content: string, sessionId: string): string {
  const lastUpdated = new Date().toISOString().slice(0, 10);
  const normalized = content
    .replace(
      "Keep this file small. This is the template for live per-session control files, not a narrative log.",
      "Keep this file small. This is the control file for one live session, not a narrative log."
    )
    .replace(/Live session files belong under:\r?\n\r?\n- `state\/sessions\/state_<session_id>\.md`\r?\n\r?\n/, "")
    .replace(
      "Do not treat this template as the active session register.",
      "Treat this file as the active control file for this session."
    )
    .replace(
      "- Copy this template into `state/sessions/state_<session_id>.md` when creating a new live session file.",
      "- This live session file was derived from `state/session_state_template.md`."
    )
    .replace(/^owned_by:\s*.*$/m, `owned_by: ${sessionId}`)
    .replace(/^last_updated:\s*.*$/m, `last_updated: ${lastUpdated}`)
    .replace(/<session_id>/g, sessionId);

  if (/^owned_by:\s*.*$/m.test(normalized) && /^last_updated:\s*.*$/m.test(normalized)) {
    return normalized;
  }

  const marker = "```yaml";
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) {
    return normalized;
  }

  const insertAt = markerIndex + marker.length;
  return `${normalized.slice(0, insertAt)}\nowned_by: ${sessionId}\nlast_updated: ${lastUpdated}${normalized.slice(insertAt)}`;
}

function toProjectRelativePath(projectRoot: string, absolutePath: string): string {
  return path.relative(projectRoot, absolutePath).split(path.sep).join("/");
}

function assertNever(value: never): never {
  throw new DotagentError(`Unhandled claim-state action: ${JSON.stringify(value)}`);
}
