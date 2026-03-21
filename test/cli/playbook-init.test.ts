import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

test("dotagent playbook init dry-run reports filesystem scaffolding without writing files", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-dry-run-"));

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
    argv: ["playbook", "init", "the-extreme-cr-rig", "--cwd", root, "--task", "default_ability_alignment", "--dry-run"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /template_directories: create=3, adopt=0/);
  assert.match(stdout.buffer, /transport: filesystem/);
  assert.match(stdout.buffer, /task: default_ability_alignment/);
  assert.equal(existsSync(path.join(root, ".ecrr")), false);
});

test("dotagent playbook init scaffolds the first filesystem round and ignores runtime state", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-apply-"));

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
    argv: ["playbook", "init", "the-extreme-cr-rig", "--cwd", root, "--task", "default_ability_alignment", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(
    existsSync(path.join(root, ".ecrr", "default_ability_alignment", "round_001", "00_round_context.md")),
    true
  );
  assert.equal(
    existsSync(path.join(root, ".ecrr", "default_ability_alignment", "round_001", "lead", "30_round_results.md")),
    true
  );
  assert.equal(
    existsSync(path.join(root, ".ecrr", "default_ability_alignment", "round_001", "reviewers")),
    true
  );
  assert.equal(
    existsSync(path.join(root, ".ecrr", "default_ability_alignment", "round_001", "verification")),
    true
  );
  assert.equal(
    existsSync(path.join(root, ".ecrr", "default_ability_alignment", "round_001", "reviewers", "reviewer_template.md")),
    false
  );
  assert.equal(
    existsSync(path.join(root, ".ecrr", "default_ability_alignment", "round_001", "verification", "batch_template.md")),
    false
  );
  assert.match(readFileSync(path.join(root, ".gitignore"), "utf8"), /\.ecrr\//);
  assert.match(stdout.buffer, /Playbook initialization complete/);
  assert.match(stdout.buffer, /created_directories: 3/);
});

test("dotagent playbook init preserves divergent round files on rerun", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-rerun-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  exitCode = await runCli({
    argv: ["playbook", "init", "the-extreme-cr-rig", "--cwd", root, "--task", "default_ability_alignment", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  const contextPath = path.join(root, ".ecrr", "default_ability_alignment", "round_001", "00_round_context.md");
  writeFileSync(contextPath, "local round context\n", "utf8");

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["playbook", "init", "the-extreme-cr-rig", "--cwd", root, "--task", "default_ability_alignment", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(readFileSync(contextPath, "utf8"), "local round context\n");
  assert.match(stdout.buffer, /Preserved divergent files: 1|preserved_divergent_files: 1/);
});

test("dotagent playbook init --verbose reports individual template file actions", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-verbose-"));

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
    argv: ["playbook", "init", "the-extreme-cr-rig", "--cwd", root, "--task", "default_ability_alignment", "--dry-run", "--verbose"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /template_directory_actions:/);
  assert.match(stdout.buffer, /- create: \.ecrr\/default_ability_alignment\/round_001\/reviewers/);
  assert.match(stdout.buffer, /template_file_actions:/);
  assert.match(stdout.buffer, /- create: \.ecrr\/default_ability_alignment\/round_001\/00_round_context\.md/);
});
