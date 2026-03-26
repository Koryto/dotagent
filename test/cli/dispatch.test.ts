import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable, Writable } from "node:stream";

import { runCli } from "../../src/cli.js";

class MemoryWritable extends Writable {
  public buffer = "";

  public constructor() {
    super();
  }

  public override _write(
    chunk: string | Uint8Array,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.buffer += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
    callback();
  }
}

test("runCli returns help when no command is provided", async () => {
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: [],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.match(stdout.buffer, /dotagent/);
  assert.equal(stderr.buffer, "");
});

test("runCli prints the package version for --version", async () => {
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["--version"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.match(stdout.buffer, /^\d+\.\d+\.\d+\r?\n?$/);
  assert.equal(stderr.buffer, "");
});

test("runCli prints the package version for version subcommand", async () => {
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["version"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.match(stdout.buffer, /^\d+\.\d+\.\d+\r?\n?$/);
  assert.equal(stderr.buffer, "");
});

test("runCli lists bundled playbooks", async () => {
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["playbook", "list"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.match(stdout.buffer, /deep-co-planning/);
  assert.match(stdout.buffer, /deep-code-review/);
  assert.equal(stderr.buffer, "");
});

test("runCli reports an error for an unknown command", async () => {
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["unknown-command"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 2);
  assert.match(stderr.buffer, /Unknown command/);
  assert.equal(stdout.buffer, "");
});

test("runCli preserves everything after the first equals sign in --cwd=value", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-dispatch-cwd-equals-"));
  const projectRoot = path.join(root, "dir=name");
  mkdirSync(projectRoot, { recursive: true });
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: [`doctor`, `--cwd=${projectRoot}`],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.match(stdout.buffer, new RegExp(`project_root: ${escapeRegExp(projectRoot)}`));
  assert.equal(stderr.buffer, "");
});

test("runCli reports an unknown flag explicitly", async () => {
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["init", "--force"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 2);
  assert.match(stderr.buffer, /Unknown flag: --force/);
  assert.equal(stdout.buffer, "");
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
