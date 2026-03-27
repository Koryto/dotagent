import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { mkdtempSync, rmSync } from "node:fs";
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

test("dotagent doctor reports missing framework state in an uninitialized project", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-doctor-empty-"));
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["doctor", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /framework_present: false/);
  assert.match(stdout.buffer, /manifest_present: false/);
  assert.match(stdout.buffer, /issues: 2/);
});

test("dotagent doctor reports installed adapters and zero managed drift for a healthy initialized project", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-doctor-initialized-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex,claude", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["doctor", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /installed_adapters: 2/);
  assert.match(stdout.buffer, /- claude/);
  assert.match(stdout.buffer, /- codex/);
  assert.match(stdout.buffer, /managed_drift: create=0, update=0, remove=0/);
});

test("dotagent doctor reports missing generated runtime skill bridges", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-doctor-missing-skill-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  rmSync(path.join(root, ".codex", "skills", "dotagent-closeout", "SKILL.md"));

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["doctor", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 1);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /issues: 1/);
  assert.match(stdout.buffer, /missing a generated runtime bridge/);
  assert.match(stdout.buffer, /\.codex\/skills\/dotagent-closeout\/SKILL\.md/);
});

test("dotagent doctor reports missing runtime adapter manifests", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-doctor-missing-runtime-manifest-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  rmSync(path.join(root, ".codex", "dotagent.json"));

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["doctor", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 1);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /missing its runtime manifest/);
  assert.match(stdout.buffer, /\.codex\/dotagent\.json/);
});

test("dotagent doctor reports missing required framework startup files", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-doctor-missing-startup-file-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  rmSync(path.join(root, ".agent", "state", "session_state.md"));

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["doctor", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 1);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /manual restoration|Required framework startup file is missing/);
  assert.match(stdout.buffer, /\.agent\/state\/session_state\.md/);
});

test("dotagent doctor resolves the project root from nested directories in initialized projects", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-doctor-nested-root-"));
  const nested = path.join(root, "src", "nested");

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  await import("node:fs").then(({ mkdirSync }) => mkdirSync(nested, { recursive: true }));

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["doctor", "--cwd", nested],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, new RegExp(`project_root: ${escapeRegExp(root)}`));
  assert.match(stdout.buffer, /framework_present: true/);
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
