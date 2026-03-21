import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runCli } from "../../src/cli.js";
import { loadManifest } from "../../src/core/manifest.js";

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

test("dotagent init dry-run reports planned work without writing files", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-dry-run-"));
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex,claude", "--dry-run"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.match(stdout.buffer, /dotagent init/);
  assert.equal(stderr.buffer, "");
  assert.equal(existsSync(path.join(root, ".agent")), false);
  assert.equal(existsSync(path.join(root, ".codex")), false);
  assert.equal(existsSync(path.join(root, ".claude")), false);
});

test("dotagent init scaffolds the framework, adapters, gitignore, and manifest", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-apply-"));
  writeFileSync(path.join(root, ".gitignore"), "dist/\n", "utf8");
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex,claude", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(existsSync(path.join(root, ".agent", "BOOTSTRAP.md")), true);
  assert.equal(existsSync(path.join(root, ".codex", "INDEX.md")), true);
  assert.equal(existsSync(path.join(root, ".claude", "INDEX.md")), true);
  assert.equal(existsSync(path.join(root, "AGENTS.md")), true);
  assert.match(readFileSync(path.join(root, ".gitignore"), "utf8"), /\.agent\//);

  const manifest = loadManifest(root);
  assert.ok(manifest);
  assert.deepEqual(manifest.installedAdapters.map((entry) => entry.runtime), ["claude", "codex"]);
  assert.match(stdout.buffer, /Initialization complete/);
});

test("dotagent init preserves divergent managed files on safe rerun", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-rerun-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });

  assert.equal(exitCode, 0);

  const bootstrapPath = path.join(root, ".agent", "BOOTSTRAP.md");
  writeFileSync(bootstrapPath, "custom local bootstrap\n", "utf8");

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(readFileSync(bootstrapPath, "utf8"), "custom local bootstrap\n");

  const manifest = loadManifest(root);
  assert.ok(manifest);
  assert.equal(manifest.ownedFiles.some((entry) => entry.path === ".agent/BOOTSTRAP.md"), false);
  assert.match(stdout.buffer, /Initialization complete/);
});
