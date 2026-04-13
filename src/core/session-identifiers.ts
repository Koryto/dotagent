import { CliUsageError } from "../utils/errors.js";

export const AUTO_SESSION_ID = "auto";

export function isAutoSessionId(value: string): boolean {
  return value.trim().toLowerCase() === AUTO_SESSION_ID;
}

export function normalizeSessionId(value: string): string {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9-]+$/.test(trimmed)) {
    throw new CliUsageError(`Invalid session id: ${value}.`);
  }

  return trimmed;
}

export function toSessionStateFilename(sessionId: string): string {
  return `state_${normalizeSessionId(sessionId)}.md`;
}

export function looksLikeSessionStateFilename(value: string): boolean {
  return /^state_.*\.md$/.test(value.trim());
}

export function normalizeSessionStateFilename(value: string): string {
  const trimmed = value.trim();
  if (!/^state_[A-Za-z0-9-]+\.md$/.test(trimmed)) {
    throw new CliUsageError(`Invalid state file name: ${value}. Expected state_<session_id>.md.`);
  }

  return trimmed;
}
