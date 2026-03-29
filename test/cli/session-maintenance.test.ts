import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { existsSync, mkdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
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

test("dotagent archive-sessions dry-run reports old active session files without moving them", async () => {
  const root = mkdtemp("dotagent-cli-archive-sessions-dry-run-");
  await initFramework(root);
  const liveFile = path.join(root, ".agent", "state", "sessions", "state_old.md");
  writeFileSync(liveFile, "# old\n", "utf8");
  setFileAgeDays(liveFile, 10);

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  const exitCode = await runCli({
    argv: ["archive-sessions", "7", "--cwd", root, "--dry-run"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /matches: 1/);
  assert.match(stdout.buffer, /state\/sessions\/state_old\.md -> \.agent\/state\/sessions\/archive\/state_old\.md/);
  assert.equal(existsSync(liveFile), true);
  assert.equal(existsSync(path.join(root, ".agent", "state", "sessions", "archive", "state_old.md")), false);
});

test("dotagent archive-sessions moves only matching old live session files into archive", async () => {
  const root = mkdtemp("dotagent-cli-archive-sessions-apply-");
  await initFramework(root);
  const oldLive = path.join(root, ".agent", "state", "sessions", "state_old.md");
  const freshLive = path.join(root, ".agent", "state", "sessions", "state_fresh.md");
  writeFileSync(oldLive, "# old\n", "utf8");
  writeFileSync(freshLive, "# fresh\n", "utf8");
  setFileAgeDays(oldLive, 8);
  setFileAgeDays(freshLive, 1);

  const exitCode = await runCli({
    argv: ["archive-sessions", "7", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });

  assert.equal(exitCode, 0);
  assert.equal(existsSync(oldLive), false);
  assert.equal(existsSync(path.join(root, ".agent", "state", "sessions", "archive", "state_old.md")), true);
  assert.equal(existsSync(freshLive), true);
});

test("dotagent archive-sessions reports zero matches without moving fresh files", async () => {
  const root = mkdtemp("dotagent-cli-archive-sessions-no-match-");
  await initFramework(root);
  const freshLive = path.join(root, ".agent", "state", "sessions", "state_fresh.md");
  writeFileSync(freshLive, "# fresh\n", "utf8");
  setFileAgeDays(freshLive, 1);

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  const exitCode = await runCli({
    argv: ["archive-sessions", "7", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /matches: 0/);
  assert.equal(existsSync(freshLive), true);
  assert.equal(existsSync(path.join(root, ".agent", "state", "sessions", "archive", "state_fresh.md")), false);
});

test("dotagent cleanup-sessions deletes matching old session files from live and archive", async () => {
  const root = mkdtemp("dotagent-cli-cleanup-sessions-apply-");
  await initFramework(root);
  const oldLive = path.join(root, ".agent", "state", "sessions", "state_old-live.md");
  const oldArchive = path.join(root, ".agent", "state", "sessions", "archive", "state_old-archive.md");
  const freshArchive = path.join(root, ".agent", "state", "sessions", "archive", "state_fresh-archive.md");
  writeFileSync(oldLive, "# old live\n", "utf8");
  writeFileSync(oldArchive, "# old archive\n", "utf8");
  writeFileSync(freshArchive, "# fresh archive\n", "utf8");
  setFileAgeDays(oldLive, 30);
  setFileAgeDays(oldArchive, 30);
  setFileAgeDays(freshArchive, 1);

  const exitCode = await runCli({
    argv: ["cleanup-sessions", "7", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });

  assert.equal(exitCode, 0);
  assert.equal(existsSync(oldLive), false);
  assert.equal(existsSync(oldArchive), false);
  assert.equal(existsSync(freshArchive), true);
});

test("dotagent cleanup-sessions reports zero matches without deleting fresh files", async () => {
  const root = mkdtemp("dotagent-cli-cleanup-sessions-no-match-");
  await initFramework(root);
  const freshLive = path.join(root, ".agent", "state", "sessions", "state_fresh-live.md");
  const freshArchive = path.join(root, ".agent", "state", "sessions", "archive", "state_fresh-archive.md");
  writeFileSync(freshLive, "# fresh live\n", "utf8");
  writeFileSync(freshArchive, "# fresh archive\n", "utf8");
  setFileAgeDays(freshLive, 1);
  setFileAgeDays(freshArchive, 1);

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  const exitCode = await runCli({
    argv: ["cleanup-sessions", "7", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /matches: 0/);
  assert.equal(existsSync(freshLive), true);
  assert.equal(existsSync(freshArchive), true);
});

function mkdtemp(prefix: string): string {
  return path.join(os.tmpdir(), `${prefix}${Math.random().toString(16).slice(2, 10)}`);
}

async function initFramework(root: string): Promise<void> {
  mkdirSync(root, { recursive: true });
  const exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);
}

function setFileAgeDays(filePath: string, days: number): void {
  const timestamp = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  utimesSync(filePath, timestamp, timestamp);
}
