import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runCli } from "../../src/cli.js";
import { applyClaimStatePlan, planClaimState } from "../../src/core/claim-state.js";
import { detectProjectState } from "../../src/core/project.js";
import { resolveBundledAgentRoot, resolvePackageRoot } from "../../src/core/paths.js";
import type { CliContext } from "../../src/models/command.js";
import { createLogger } from "../../src/utils/logger.js";

class MemoryWritable extends Writable {
  public buffer = "";

  public override _write(
    chunk: string | Uint8Array,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.buffer += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
    callback();
  }
}

test("dotagent claim-state creates a new session state from the template", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-create-"));
  const today = new Date().toISOString().slice(0, 10);
  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["claim-state", "019cf1cb-41ad-72d2-943c-b8a83e24641d", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  const targetPath = path.join(root, ".agent", "state", "sessions", "state_019cf1cb-41ad-72d2-943c-b8a83e24641d.md");
  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(existsSync(targetPath), true);
  assert.match(stdout.buffer, /action: create/);
  assert.match(stdout.buffer, /pickup_status: not-provided/);
  assert.match(readFileSync(targetPath, "utf8"), /owned_by: 019cf1cb-41ad-72d2-943c-b8a83e24641d/);
  assert.match(readFileSync(targetPath, "utf8"), new RegExp(`last_updated: ${today}`));
  assert.match(readFileSync(targetPath, "utf8"), /# Session State/);
  assert.match(readFileSync(targetPath, "utf8"), /<!-- SESSION_VERSION: 3\.0 \| STATUS: active -->/);
  assert.match(readFileSync(targetPath, "utf8"), /This is the control file for one live session/);
  assert.doesNotMatch(readFileSync(targetPath, "utf8"), /# Session State Template/);
  assert.doesNotMatch(readFileSync(targetPath, "utf8"), /STATUS: template/);
  assert.doesNotMatch(readFileSync(targetPath, "utf8"), /This live session file belongs under:/);
  assert.doesNotMatch(readFileSync(targetPath, "utf8"), /state\/sessions\/state_019cf1cb-41ad-72d2-943c-b8a83e24641d\.md/);
  assert.doesNotMatch(readFileSync(targetPath, "utf8"), /template for live per-session control files/);
  assert.doesNotMatch(readFileSync(targetPath, "utf8"), /Do not treat this template as the active session register/);
});

test("dotagent claim-state keeps the current session file when it already exists", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-existing-"));
  const today = new Date().toISOString().slice(0, 10);
  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const sessionsRoot = path.join(root, ".agent", "state", "sessions");
  mkdirSync(sessionsRoot, { recursive: true });
  writeFileSync(
    path.join(sessionsRoot, "state_019cf1cb-41ad-72d2-943c-b8a83e24641d.md"),
    "# Active\n```yaml\nowned_by: old\nstatus: IDLE\n```\n",
    "utf8"
  );
  writeFileSync(
    path.join(sessionsRoot, "state_other.md"),
    "# Other\n```yaml\nowned_by: other\nstatus: IDLE\n```\n",
    "utf8"
  );

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["claim-state", "019cf1cb-41ad-72d2-943c-b8a83e24641d", "state_other.md", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  const activePath = path.join(sessionsRoot, "state_019cf1cb-41ad-72d2-943c-b8a83e24641d.md");
  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /action: claim-existing/);
  assert.match(stdout.buffer, /pickup_status: ignored-existing-session/);
  assert.match(readFileSync(activePath, "utf8"), /owned_by: 019cf1cb-41ad-72d2-943c-b8a83e24641d/);
  assert.match(readFileSync(activePath, "utf8"), new RegExp(`last_updated: ${today}`));
  assert.equal(existsSync(path.join(sessionsRoot, "state_other.md")), true);
});

test("dotagent claim-state binds an existing session file even when the template is missing", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-existing-no-template-"));
  const today = new Date().toISOString().slice(0, 10);
  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const sessionsRoot = path.join(root, ".agent", "state", "sessions");
  mkdirSync(sessionsRoot, { recursive: true });
  const activePath = path.join(sessionsRoot, "state_019cf1cb-41ad-72d2-943c-b8a83e24641d.md");
  writeFileSync(activePath, "# Active\n```yaml\nowned_by: old\nstatus: IDLE\n```\n", "utf8");
  rmSync(path.join(root, ".agent", "state", "session_state_template.md"));

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["claim-state", "019cf1cb-41ad-72d2-943c-b8a83e24641d", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /action: claim-existing/);
  assert.match(readFileSync(activePath, "utf8"), /owned_by: 019cf1cb-41ad-72d2-943c-b8a83e24641d/);
  assert.match(readFileSync(activePath, "utf8"), new RegExp(`last_updated: ${today}`));
});

test("dotagent claim-state adopts the requested pickup file when no current session file exists", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-pickup-"));
  const today = new Date().toISOString().slice(0, 10);
  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const sessionsRoot = path.join(root, ".agent", "state", "sessions");
  mkdirSync(sessionsRoot, { recursive: true });
  writeFileSync(
    path.join(sessionsRoot, "state_pickup.md"),
    "# Pickup\n```yaml\nowned_by: pickup\nstatus: IN_PROGRESS\n```\n",
    "utf8"
  );

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["claim-state", "019cf1cb-41ad-72d2-943c-b8a83e24641d", "state_pickup.md", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  const activePath = path.join(sessionsRoot, "state_019cf1cb-41ad-72d2-943c-b8a83e24641d.md");
  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /action: claim-pickup/);
  assert.match(stdout.buffer, /pickup_status: claimed/);
  assert.equal(existsSync(path.join(sessionsRoot, "state_pickup.md")), false);
  assert.equal(existsSync(activePath), true);
  assert.match(readFileSync(activePath, "utf8"), /owned_by: 019cf1cb-41ad-72d2-943c-b8a83e24641d/);
  assert.match(readFileSync(activePath, "utf8"), new RegExp(`last_updated: ${today}`));
});

test("dotagent claim-state adopts the requested pickup file even when the template is missing", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-pickup-no-template-"));
  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const sessionsRoot = path.join(root, ".agent", "state", "sessions");
  mkdirSync(sessionsRoot, { recursive: true });
  writeFileSync(path.join(sessionsRoot, "state_pickup.md"), "# Pickup\n```yaml\nowned_by: pickup\nstatus: IN_PROGRESS\n```\n", "utf8");
  rmSync(path.join(root, ".agent", "state", "session_state_template.md"));

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["claim-state", "019cf1cb-41ad-72d2-943c-b8a83e24641d", "state_pickup.md", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  const activePath = path.join(sessionsRoot, "state_019cf1cb-41ad-72d2-943c-b8a83e24641d.md");
  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /action: claim-pickup/);
  assert.equal(existsSync(activePath), true);
});

test("dotagent claim-state falls back to creating a new file when pickup is missing", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-missing-pickup-"));
  const today = new Date().toISOString().slice(0, 10);
  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["claim-state", "019cf1cb-41ad-72d2-943c-b8a83e24641d", "state_missing.md", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  const activePath = path.join(root, ".agent", "state", "sessions", "state_019cf1cb-41ad-72d2-943c-b8a83e24641d.md");
  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /action: create/);
  assert.match(stdout.buffer, /pickup_status: missing-fallback-created/);
  assert.match(stdout.buffer, /state_missing\.md was not found/);
  assert.equal(existsSync(activePath), true);
  assert.match(readFileSync(activePath, "utf8"), new RegExp(`last_updated: ${today}`));
});

test("dotagent claim-state fails with a domain-specific error when the pickup file disappears before apply", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-pickup-race-"));
  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const sessionsRoot = path.join(root, ".agent", "state", "sessions");
  const pickupPath = path.join(sessionsRoot, "state_pickup.md");
  writeFileSync(pickupPath, "# Pickup\n```yaml\nowned_by: pickup\nstatus: IN_PROGRESS\n```\n", "utf8");
  const context = createCliContext(root);
  const plan = planClaimState(context, "019cf1cb-41ad-72d2-943c-b8a83e24641d", "state_pickup.md");
  rmSync(pickupPath);

  assert.throws(
    () => applyClaimStatePlan(context, plan),
    /Pickup session file state_pickup\.md is no longer available\. Another session likely claimed it first\./
  );
});

test("dotagent claim-state strips template-only blocks even when the template prose changes inside them", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-template-markers-"));
  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const templatePath = path.join(root, ".agent", "state", "session_state_template.md");
  writeFileSync(
    templatePath,
    readFileSync(templatePath, "utf8")
      .replace("Keep this file small. This is the template for live per-session control files, not a narrative log.", "Custom template intro.")
      .replace("- Copy this template into `state/sessions/state_<session_id>.md` when creating a new live session file.", "- Custom template note."),
    "utf8"
  );

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["claim-state", "019cf1cb-41ad-72d2-943c-b8a83e24641d", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  const activePath = path.join(root, ".agent", "state", "sessions", "state_019cf1cb-41ad-72d2-943c-b8a83e24641d.md");
  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.doesNotMatch(readFileSync(activePath, "utf8"), /Custom template intro\./);
  assert.doesNotMatch(readFileSync(activePath, "utf8"), /Custom template note\./);
  assert.match(readFileSync(activePath, "utf8"), /This live session file was derived from `state\/session_state_template\.md`\./);
});

function createCliContext(projectRoot: string): CliContext {
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  const packageRoot = resolvePackageRoot(import.meta.url);

  return {
    invocationCwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    projectRoot,
    packageRoot,
    bundledAgentRoot: resolveBundledAgentRoot(packageRoot),
    projectState: detectProjectState(projectRoot),
    flags: {
      dryRun: false,
      verbose: false,
      yes: false,
      help: false
    },
    logger: createLogger(stdout, stderr)
  };
}
