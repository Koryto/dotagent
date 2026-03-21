import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

test("dotagent playbook init recreates missing empty template directories on rerun", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-dir-repair-"));

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

  const reviewersPath = path.join(root, ".ecrr", "default_ability_alignment", "round_001", "reviewers");
  rmSync(reviewersPath, { recursive: true, force: true });

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
  assert.equal(existsSync(reviewersPath), true);
  assert.match(stdout.buffer, /created_directories: 1/);
});

test("dotagent playbook init rejects traversal-capable installed playbook contracts", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-invalid-contract-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  writeFileSync(
    path.join(root, ".agent", "playbooks", "the-extreme-cr-rig", "playbook.json"),
    `${JSON.stringify(
      {
        name: "the-extreme-cr-rig",
        version: "0.1.0",
        runtimeRoot: "../outside",
        templateDir: "filesystem/round_template",
        taskScoped: true,
        initialRound: "round_001"
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["playbook", "init", "the-extreme-cr-rig", "--cwd", root, "--task", "default_ability_alignment", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 6);
  assert.match(stderr.buffer, /must not contain path traversal|must be relative/i);
});

test("dotagent playbook init rejects traversal-capable playbook names", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-invalid-name-"));

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
    argv: ["playbook", "init", "..\\outside", "--cwd", root, "--task", "default_ability_alignment", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 2);
  assert.match(stderr.buffer, /Invalid playbook name/i);
});

test("dotagent playbook init rejects symlinked template roots", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-symlink-root-"));
  const outside = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-symlink-outside-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  mkdirSync(path.join(outside, "lead"), { recursive: true });
  writeFileSync(path.join(outside, "00_round_context.md"), "outside round context\n", "utf8");
  const templateRoot = path.join(root, ".agent", "playbooks", "the-extreme-cr-rig", "filesystem", "round_template");
  rmSync(templateRoot, { recursive: true, force: true });
  symlinkSync(outside, templateRoot, "junction");

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["playbook", "init", "the-extreme-cr-rig", "--cwd", root, "--task", "default_ability_alignment", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 1);
  assert.match(stderr.buffer, /symlinked root|symlinked path component/i);
  assert.equal(existsSync(path.join(root, ".ecrr", "default_ability_alignment", "round_001", "00_round_context.md")), false);
});

test("dotagent playbook init rejects symlinked template subdirectories", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-symlink-entry-"));
  const outside = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-symlink-entry-outside-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  mkdirSync(outside, { recursive: true });
  writeFileSync(path.join(outside, "20_reviewer_feedback.md"), "outside lead content\n", "utf8");
  const leadTemplatePath = path.join(
    root,
    ".agent",
    "playbooks",
    "the-extreme-cr-rig",
    "filesystem",
    "round_template",
    "lead"
  );
  rmSync(leadTemplatePath, { recursive: true, force: true });
  symlinkSync(outside, leadTemplatePath, "junction");

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["playbook", "init", "the-extreme-cr-rig", "--cwd", root, "--task", "default_ability_alignment", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 1);
  assert.match(stderr.buffer, /symlinked path component/i);
  assert.equal(
    existsSync(path.join(root, ".ecrr", "default_ability_alignment", "round_001", "lead", "20_reviewer_feedback.md")),
    false
  );
});

test("dotagent playbook init rejects symlinked installed playbook roots", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-symlink-playbook-root-"));
  const outside = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-symlink-playbook-target-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  mkdirSync(path.join(outside, "filesystem", "round_template"), { recursive: true });
  writeFileSync(path.join(outside, "PLAYBOOK.md"), "# Outside\n", "utf8");
  writeFileSync(
    path.join(outside, "playbook.json"),
    `${JSON.stringify(
      {
        name: "the-extreme-cr-rig",
        version: "0.1.0",
        runtimeRoot: ".ecrr",
        templateDir: "filesystem/round_template",
        taskScoped: true,
        initialRound: "round_001",
        gitignoreEntry: ".ecrr/"
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  writeFileSync(path.join(outside, "filesystem", "round_template", "00_round_context.md"), "outside context\n", "utf8");

  const installedPlaybookRoot = path.join(root, ".agent", "playbooks", "the-extreme-cr-rig");
  rmSync(installedPlaybookRoot, { recursive: true, force: true });
  symlinkSync(outside, installedPlaybookRoot, "junction");

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["playbook", "init", "the-extreme-cr-rig", "--cwd", root, "--task", "default_ability_alignment", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 6);
  assert.match(stderr.buffer, /symlinked path component/i);
  assert.equal(existsSync(path.join(root, ".ecrr", "default_ability_alignment", "round_001", "00_round_context.md")), false);
});

test("dotagent playbook init rejects symlinked .agent ancestors", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-symlink-agent-root-"));
  const outsideProject = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-init-symlink-agent-target-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });
  assert.equal(exitCode, 0);

  mkdirSync(path.join(outsideProject, ".agent", "playbooks", "the-extreme-cr-rig", "filesystem", "round_template"), {
    recursive: true
  });
  writeFileSync(path.join(outsideProject, ".agent", "playbooks", "the-extreme-cr-rig", "PLAYBOOK.md"), "# Outside\n", "utf8");
  writeFileSync(
    path.join(outsideProject, ".agent", "playbooks", "the-extreme-cr-rig", "playbook.json"),
    `${JSON.stringify(
      {
        name: "the-extreme-cr-rig",
        version: "0.1.0",
        runtimeRoot: ".ecrr",
        templateDir: "filesystem/round_template",
        taskScoped: true,
        initialRound: "round_001",
        gitignoreEntry: ".ecrr/"
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  writeFileSync(
    path.join(outsideProject, ".agent", "playbooks", "the-extreme-cr-rig", "filesystem", "round_template", "00_round_context.md"),
    "outside context\n",
    "utf8"
  );

  rmSync(path.join(root, ".agent"), { recursive: true, force: true });
  symlinkSync(path.join(outsideProject, ".agent"), path.join(root, ".agent"), "junction");

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["playbook", "init", "the-extreme-cr-rig", "--cwd", root, "--task", "default_ability_alignment", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 6);
  assert.match(stderr.buffer, /symlinked root|symlinked path component/i);
  assert.equal(existsSync(path.join(root, ".ecrr", "default_ability_alignment", "round_001", "00_round_context.md")), false);
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
