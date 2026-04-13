import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { readUtf8File } from "./files.js";
import { isAutoSessionId, normalizeSessionId } from "./session-identifiers.js";
import { CliUsageError } from "../utils/errors.js";

export type RuntimeSessionSource = "explicit" | "codex-env" | "claude-session-file";

export interface RuntimeSessionResolution {
  sessionId: string;
  source: RuntimeSessionSource;
}

interface RuntimeSessionDetectionOptions {
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  projectRoot?: string;
  isProcessAlive?: (pid: number) => boolean;
}

interface ClaudeSessionFile {
  pid?: unknown;
  sessionId?: unknown;
  cwd?: unknown;
}

interface ClaudeSessionCandidate {
  sessionId: string;
}

export function resolveRuntimeSessionId(
  requestedSessionId: string | undefined,
  projectRoot: string
): RuntimeSessionResolution {
  if (typeof requestedSessionId === "string" && requestedSessionId.trim().length > 0 && !isAutoSessionId(requestedSessionId)) {
    return {
      sessionId: normalizeSessionId(requestedSessionId),
      source: "explicit"
    };
  }

  const detected = detectRuntimeSessionId({
    projectRoot
  });

  if (detected) {
    return detected;
  }

  throw new CliUsageError(
    [
      "Could not auto-detect the runtime session id.",
      "Pass it explicitly: dotagent claim-state <session_id> [state_<other_session_id>.md]."
    ].join(" ")
  );
}

export function detectRuntimeSessionId(options: RuntimeSessionDetectionOptions = {}): RuntimeSessionResolution | null {
  const env = options.env ?? process.env;
  const codexThreadId = env.CODEX_THREAD_ID;
  if (typeof codexThreadId === "string" && codexThreadId.trim().length > 0) {
    return {
      sessionId: normalizeSessionId(codexThreadId),
      source: "codex-env"
    };
  }

  return detectClaudeSessionId(options);
}

function detectClaudeSessionId(options: RuntimeSessionDetectionOptions): RuntimeSessionResolution | null {
  const homeDir = options.homeDir ?? os.homedir();
  const projectRoot = options.projectRoot ? path.resolve(options.projectRoot) : null;
  const sessionsDir = path.join(homeDir, ".claude", "sessions");
  if (!existsSync(sessionsDir) || !projectRoot) {
    return null;
  }

  const candidates: ClaudeSessionCandidate[] = [];
  for (const entry of readClaudeSessionDirectory(sessionsDir)) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const filePath = path.join(sessionsDir, entry.name);
    const parsed = readClaudeSessionFile(filePath);
    if (!parsed) {
      continue;
    }

    if (typeof parsed.cwd !== "string" || !isPathWithinOrSame(projectRoot, parsed.cwd)) {
      continue;
    }

    if (typeof parsed.pid === "number" && !resolveProcessAlive(options)(parsed.pid)) {
      continue;
    }

    candidates.push({
      sessionId: normalizeSessionId(parsed.sessionId)
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  if (candidates.length > 1) {
    throw new CliUsageError(
      [
        "Auto-detection found multiple Claude sessions for this project.",
        "Pass the session id explicitly instead of relying on auto-detection."
      ].join(" ")
    );
  }

  const candidate = candidates[0];
  if (!candidate) {
    return null;
  }

  return {
    sessionId: candidate.sessionId,
    source: "claude-session-file"
  };
}

function readClaudeSessionDirectory(sessionsDir: string) {
  try {
    return readdirSync(sessionsDir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function readClaudeSessionFile(filePath: string): { pid?: number; sessionId: string; cwd?: string } | null {
  try {
    const parsed = JSON.parse(readUtf8File(filePath)) as ClaudeSessionFile;
    if (typeof parsed.sessionId !== "string" || parsed.sessionId.trim().length === 0) {
      return null;
    }

    return {
      ...(typeof parsed.pid === "number" ? { pid: parsed.pid } : {}),
      sessionId: normalizeSessionId(parsed.sessionId),
      ...(typeof parsed.cwd === "string" ? { cwd: parsed.cwd } : {})
    };
  } catch {
    return null;
  }
}

function resolveProcessAlive(options: RuntimeSessionDetectionOptions): (pid: number) => boolean {
  return options.isProcessAlive ?? defaultIsProcessAlive;
}

function defaultIsProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    return errno.code === "EPERM";
  }
}

function isPathWithinOrSame(rootPath: string, candidatePath: string): boolean {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedCandidate = path.resolve(candidatePath);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
