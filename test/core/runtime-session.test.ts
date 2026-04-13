import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { detectRuntimeSessionId } from "../../src/core/runtime-session.js";
import { CliUsageError } from "../../src/utils/errors.js";

test("detectRuntimeSessionId uses CODEX_THREAD_ID when available", () => {
  const detected = detectRuntimeSessionId({
    env: {
      CODEX_THREAD_ID: "019cf1cb-41ad-72d2-943c-b8a83e24641d"
    }
  });

  assert.deepEqual(detected, {
    sessionId: "019cf1cb-41ad-72d2-943c-b8a83e24641d",
    source: "codex-env"
  });
});

test("detectRuntimeSessionId resolves a single active Claude session for the project", () => {
  const home = mkdtempSync(path.join(os.tmpdir(), "dotagent-runtime-session-home-"));
  const projectRoot = path.join(home, "project");
  const sessionsRoot = path.join(home, ".claude", "sessions");
  mkdirSync(sessionsRoot, { recursive: true });

  writeFileSync(
    path.join(sessionsRoot, "100.json"),
    JSON.stringify({
      pid: 100,
      sessionId: "claude-session-100",
      cwd: projectRoot
    }),
    "utf8"
  );
  writeFileSync(
    path.join(sessionsRoot, "200.json"),
    JSON.stringify({
      pid: 200,
      sessionId: "other-project-session",
      cwd: path.join(home, "other-project")
    }),
    "utf8"
  );

  const detected = detectRuntimeSessionId({
    env: {},
    homeDir: home,
    projectRoot,
    isProcessAlive: (pid) => pid === 100
  });

  assert.deepEqual(detected, {
    sessionId: "claude-session-100",
    source: "claude-session-file"
  });
});

test("detectRuntimeSessionId refuses ambiguous Claude sessions for the same project", () => {
  const home = mkdtempSync(path.join(os.tmpdir(), "dotagent-runtime-session-ambiguous-home-"));
  const projectRoot = path.join(home, "project");
  const sessionsRoot = path.join(home, ".claude", "sessions");
  mkdirSync(sessionsRoot, { recursive: true });

  for (const pid of [100, 200]) {
    writeFileSync(
      path.join(sessionsRoot, `${pid}.json`),
      JSON.stringify({
        pid,
        sessionId: `claude-session-${pid}`,
        cwd: projectRoot
      }),
      "utf8"
    );
  }

  assert.throws(
    () =>
      detectRuntimeSessionId({
        env: {},
        homeDir: home,
        projectRoot,
        isProcessAlive: () => true
      }),
    CliUsageError
  );
});

test("detectRuntimeSessionId returns null when no runtime id is available", () => {
  const home = mkdtempSync(path.join(os.tmpdir(), "dotagent-runtime-session-empty-home-"));

  assert.equal(
    detectRuntimeSessionId({
      env: {},
      homeDir: home,
      projectRoot: path.join(home, "project")
    }),
    null
  );
});
