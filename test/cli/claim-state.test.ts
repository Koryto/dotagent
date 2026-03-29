import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runCli } from "../../src/cli.js";

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
  assert.match(readFileSync(targetPath, "utf8"), /session_id: 019cf1cb-41ad-72d2-943c-b8a83e24641d/);
  assert.match(readFileSync(targetPath, "utf8"), /owned_by: 019cf1cb-41ad-72d2-943c-b8a83e24641d/);
});

test("dotagent claim-state keeps the current session file when it already exists", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-existing-"));
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
    "# Active\n```yaml\nsession_id: old\nowned_by: old\nstatus: IDLE\n```\n",
    "utf8"
  );
  writeFileSync(
    path.join(sessionsRoot, "state_other.md"),
    "# Other\n```yaml\nsession_id: other\nowned_by: other\nstatus: IDLE\n```\n",
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
  assert.match(readFileSync(activePath, "utf8"), /session_id: 019cf1cb-41ad-72d2-943c-b8a83e24641d/);
  assert.match(readFileSync(activePath, "utf8"), /owned_by: 019cf1cb-41ad-72d2-943c-b8a83e24641d/);
  assert.equal(existsSync(path.join(sessionsRoot, "state_other.md")), true);
});

test("dotagent claim-state adopts the requested pickup file when no current session file exists", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-pickup-"));
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
    "# Pickup\n```yaml\nsession_id: pickup\nowned_by: pickup\nstatus: IN_PROGRESS\n```\n",
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
  assert.match(readFileSync(activePath, "utf8"), /session_id: 019cf1cb-41ad-72d2-943c-b8a83e24641d/);
  assert.match(readFileSync(activePath, "utf8"), /owned_by: 019cf1cb-41ad-72d2-943c-b8a83e24641d/);
});

test("dotagent claim-state falls back to creating a new file when pickup is missing", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-claim-state-missing-pickup-"));
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
});
