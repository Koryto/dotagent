import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runCli } from "../../src/cli.js";
import { hashUtf8 } from "../../src/core/files.js";
import { loadManifest, saveManifest } from "../../src/core/manifest.js";

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

test("dotagent update dry-run reports managed update work without writing files", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-update-dry-run-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const workflowPath = path.join(root, ".agent", "workflows", "standard.md");
  const oldContent = "outdated workflow\n";
  writeFileSync(workflowPath, oldContent, "utf8");

  const manifest = loadManifest(root);
  assert.ok(manifest);
  manifest.ownedFiles = manifest.ownedFiles.map((entry) =>
    entry.path === ".agent/workflows/standard.md" ? { ...entry, contentHash: hashUtf8(oldContent) } : entry
  );
  saveManifest(root, manifest);

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["update", "--cwd", root, "--dry-run"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(readFileSync(workflowPath, "utf8"), oldContent);
  assert.match(stdout.buffer, /dotagent update/);
});

test("dotagent update overwrites an unchanged managed file when the bundled source changed", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-update-apply-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const workflowPath = path.join(root, ".agent", "workflows", "standard.md");
  const bundledWorkflow = readFileSync(path.join(process.cwd(), ".agent", "workflows", "standard.md"), "utf8");
  const oldContent = "outdated workflow\n";
  writeFileSync(workflowPath, oldContent, "utf8");

  const manifest = loadManifest(root);
  assert.ok(manifest);
  manifest.ownedFiles = manifest.ownedFiles.map((entry) =>
    entry.path === ".agent/workflows/standard.md" ? { ...entry, contentHash: hashUtf8(oldContent) } : entry
  );
  saveManifest(root, manifest);

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["update", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(readFileSync(workflowPath, "utf8"), bundledWorkflow);
  assert.match(stdout.buffer, /Update complete/);
});

test("dotagent update exits cleanly without prompting when no managed changes are required", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-update-noop-"));

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
    argv: ["update", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /No managed updates required/);
});

test("dotagent update preserves divergent local changes and keeps historical ownership for skipped files", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-update-skip-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const workflowPath = path.join(root, ".agent", "workflows", "standard.md");
  const localContent = "local divergent workflow\n";
  writeFileSync(workflowPath, localContent, "utf8");

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["update", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(readFileSync(workflowPath, "utf8"), localContent);

  const manifest = loadManifest(root);
  assert.ok(manifest);
  const ownershipRecord = manifest.ownedFiles.find((entry) => entry.path === ".agent/workflows/standard.md");
  assert.ok(ownershipRecord);
  assert.equal(typeof ownershipRecord.contentHash, "string");
});
