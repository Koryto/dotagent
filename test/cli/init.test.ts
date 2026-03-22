import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runCli } from "../../src/cli.js";
import { hashUtf8 } from "../../src/core/files.js";
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
  assert.equal(existsSync(path.join(root, ".codex", "dotagent.json")), true);
  assert.equal(existsSync(path.join(root, ".claude", "dotagent.json")), true);
  assert.equal(existsSync(path.join(root, ".codex", "skills", "dotagent-init", "SKILL.md")), true);
  assert.equal(existsSync(path.join(root, ".codex", "skills", "dotagent-closeout", "SKILL.md")), true);
  assert.equal(existsSync(path.join(root, ".codex", "skills", "dotagent-code-review", "SKILL.md")), true);
  assert.match(readFileSync(path.join(root, ".codex", "skills", "dotagent-init", "SKILL.md"), "utf8"), /^---\r?\nname: dotagent-init\r?\ndescription: /);
  assert.equal(existsSync(path.join(root, ".claude", "commands", "dotagent", "init.md")), true);
  assert.equal(existsSync(path.join(root, ".claude", "commands", "dotagent", "closeout.md")), true);
  assert.equal(existsSync(path.join(root, ".claude", "commands", "dotagent", "code-review.md")), true);
  assert.match(readFileSync(path.join(root, ".claude", "commands", "dotagent", "init.md"), "utf8"), /^---\r?\nname: dotagent:init\r?\ndescription: /);
  assert.match(readFileSync(path.join(root, ".claude", "commands", "dotagent", "init.md"), "utf8"), /allowed-tools:\r?\n  - Read\r?\n  - Write\r?\n  - Bash/);
  assert.equal(existsSync(path.join(root, "AGENTS.md")), false);
  assert.equal(existsSync(path.join(root, "CLAUDE.md")), false);
  assert.match(readFileSync(path.join(root, ".gitignore"), "utf8"), /\.agent\//);

  const manifest = loadManifest(root);
  assert.ok(manifest);
  assert.deepEqual(manifest.installedAdapters.map((entry) => entry.runtime), ["claude", "codex"]);
  assert.match(stdout.buffer, /Initialization complete/);
});

test("dotagent init installs the copilot adapter under .github", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-copilot-"));
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "copilot", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(existsSync(path.join(root, ".github", "dotagent.json")), true);
  assert.equal(existsSync(path.join(root, ".github", "skills", "dotagent-init", "SKILL.md")), true);
  assert.equal(existsSync(path.join(root, ".github", "skills", "dotagent-closeout", "SKILL.md")), true);
  assert.equal(existsSync(path.join(root, ".github", "skills", "dotagent-code-review", "SKILL.md")), true);
  assert.match(readFileSync(path.join(root, ".github", "skills", "dotagent-init", "SKILL.md"), "utf8"), /^---\r?\nname: dotagent-init\r?\ndescription: /);
  assert.match(readFileSync(path.join(root, ".github", "skills", "dotagent-init", "SKILL.md"), "utf8"), /allowed-tools: Read, Write, Bash/);

  const manifest = loadManifest(root);
  assert.ok(manifest);
  assert.deepEqual(manifest.installedAdapters, [
    {
      runtime: "copilot"
    }
  ]);
  assert.match(stdout.buffer, /Initialization complete/);
});

test("dotagent init installs opencode runtime commands", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-opencode-"));
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "opencode", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(existsSync(path.join(root, ".opencode", "dotagent.json")), true);
  assert.equal(existsSync(path.join(root, ".opencode", "commands", "dotagent-init.md")), true);
  assert.equal(existsSync(path.join(root, ".opencode", "commands", "dotagent-closeout.md")), true);
  assert.equal(existsSync(path.join(root, ".opencode", "commands", "dotagent-code-review.md")), true);
  assert.match(readFileSync(path.join(root, ".opencode", "commands", "dotagent-init.md"), "utf8"), /^---\r?\ndescription: /);
  assert.match(readFileSync(path.join(root, ".opencode", "commands", "dotagent-init.md"), "utf8"), /tools:\r?\n  read: true\r?\n  write: true\r?\n  bash: true/);

  const manifest = loadManifest(root);
  assert.ok(manifest);
  assert.deepEqual(manifest.installedAdapters, [
    {
      runtime: "opencode"
    }
  ]);
  assert.match(stdout.buffer, /Initialization complete/);
});

test("dotagent init supports framework-only initialization with --yes and no runtimes", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-framework-only-"));
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["init", "--cwd", root, "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(existsSync(path.join(root, ".agent", "BOOTSTRAP.md")), true);
  assert.equal(existsSync(path.join(root, "AGENTS.md")), false);
  assert.equal(existsSync(path.join(root, "CLAUDE.md")), false);
  assert.equal(existsSync(path.join(root, ".codex")), false);

  const manifest = loadManifest(root);
  assert.ok(manifest);
  assert.deepEqual(manifest.installedAdapters, []);
  assert.match(stdout.buffer, /runtimes: \(none\)/);
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
  assert.equal(manifest.ownedFiles.some((entry) => entry.path === ".agent/BOOTSTRAP.md"), true);
  assert.match(stdout.buffer, /Initialization complete/);
});

test("dotagent init preserves last-known ownership for divergent managed files on rerun", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-preserve-ownership-"));

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

  exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });

  assert.equal(exitCode, 0);

  const manifest = loadManifest(root);
  assert.ok(manifest);
  const ownershipRecord = manifest.ownedFiles.find((entry) => entry.path === ".agent/BOOTSTRAP.md");
  assert.ok(ownershipRecord);
  assert.equal(typeof ownershipRecord.contentHash, "string");
});

test("dotagent init preserves installed adapter state when adapter files diverge", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-adapter-rerun-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });

  assert.equal(exitCode, 0);

  const adapterPath = path.join(root, ".codex", "skills", "dotagent-code-review", "SKILL.md");
  writeFileSync(adapterPath, "local custom codex adapter\n", "utf8");

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
  assert.equal(readFileSync(adapterPath, "utf8"), "local custom codex adapter\n");

  const manifest = loadManifest(root);
  assert.ok(manifest);
  assert.deepEqual(manifest.installedAdapters.map((entry) => entry.runtime), ["codex"]);
});

test("dotagent init removes obsolete manifest-owned runtime bridges for selected runtimes", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-obsolete-adapter-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });

  assert.equal(exitCode, 0);

  const obsoletePath = path.join(root, ".codex", "skills", "dotagent-obsolete", "SKILL.md");
  mkdirSync(path.dirname(obsoletePath), { recursive: true });
  writeFileSync(obsoletePath, "obsolete bridge\n", "utf8");

  const manifest = loadManifest(root);
  assert.ok(manifest);
  manifest.ownedFiles.push({
    path: ".codex/skills/dotagent-obsolete/SKILL.md",
    owner: "adapter",
    contentHash: hashUtf8("obsolete bridge\n")
  });
  writeFileSync(
    path.join(root, ".agent", ".dotagent-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes", "--verbose"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(existsSync(obsoletePath), false);
  assert.match(stdout.buffer, /- remove: \.codex\/skills\/dotagent-obsolete\/SKILL\.md/);

  const updatedManifest = loadManifest(root);
  assert.ok(updatedManifest);
  assert.equal(
    updatedManifest.ownedFiles.some((entry) => entry.path === ".codex/skills/dotagent-obsolete/SKILL.md"),
    false
  );
});

test("dotagent init preserves divergent obsolete manifest-owned runtime bridges", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-obsolete-diverged-"));

  let exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    stderr: new MemoryWritable()
  });

  assert.equal(exitCode, 0);

  const obsoletePath = path.join(root, ".codex", "skills", "dotagent-obsolete", "SKILL.md");
  mkdirSync(path.dirname(obsoletePath), { recursive: true });
  writeFileSync(obsoletePath, "local custom obsolete bridge\n", "utf8");

  const manifest = loadManifest(root);
  assert.ok(manifest);
  manifest.ownedFiles.push({
    path: ".codex/skills/dotagent-obsolete/SKILL.md",
    owner: "adapter",
    contentHash: "managed-obsolete-hash"
  });
  writeFileSync(
    path.join(root, ".agent", ".dotagent-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes", "--verbose"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.equal(readFileSync(obsoletePath, "utf8"), "local custom obsolete bridge\n");
  assert.match(stdout.buffer, /- skip: \.codex\/skills\/dotagent-obsolete\/SKILL\.md/);

  const updatedManifest = loadManifest(root);
  assert.ok(updatedManifest);
  assert.equal(
    updatedManifest.ownedFiles.some((entry) => entry.path === ".codex/skills/dotagent-obsolete/SKILL.md"),
    true
  );
});

test("dotagent init rejects symlinked adapter destinations outside the project", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-symlink-"));
  const outside = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-symlink-outside-"));
  const symlinkTarget = path.join(outside, "codex");

  mkdirSync(symlinkTarget, { recursive: true });
  symlinkSync(symlinkTarget, path.join(root, ".codex"), "junction");

  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  const exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--yes"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 1);
  assert.match(stderr.buffer, /symlinked path component/i);
  assert.equal(existsSync(path.join(symlinkTarget, "skills", "dotagent-init", "SKILL.md")), false);
  assert.equal(existsSync(path.join(root, ".agent", ".dotagent-manifest.json")), false);
});

test("dotagent init --verbose reports individual framework and adapter file actions", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-init-verbose-"));
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: ["init", "--cwd", root, "--runtimes", "codex", "--dry-run", "--verbose"],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /framework_file_actions:/);
  assert.match(stdout.buffer, /- create: \.agent\/BOOTSTRAP\.md/);
  assert.match(stdout.buffer, /adapter_file_actions:/);
  assert.match(stdout.buffer, /- create: \.codex\/dotagent\.json/);
  assert.match(stdout.buffer, /- create: \.codex\/skills\/dotagent-init\/SKILL\.md/);
});
