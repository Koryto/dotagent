import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { mkdtempSync, writeFileSync } from "node:fs";
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

test("dotagent doctor reports invalid installed playbook contracts", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-doctor-contract-"));

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
    "{ invalid json\n",
    "utf8"
  );

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
  assert.match(stdout.buffer, /issues: 1|issues: 2|issues: 3/);
  assert.match(stdout.buffer, /Playbook contract is unreadable or invalid JSON/);
});

test("dotagent doctor reports traversal-capable playbook contracts", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-doctor-contract-paths-"));

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
    argv: ["doctor", "--cwd", root],
    cwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    stderr
  });

  assert.equal(exitCode, 1);
  assert.equal(stderr.buffer, "");
  assert.match(stdout.buffer, /issues: 1|issues: 2|issues: 3/);
  assert.match(stdout.buffer, /runtimeRoot must not contain path traversal|runtimeRoot must be relative/i);
});

test("dotagent doctor reports playbook contract name mismatches", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-doctor-contract-name-mismatch-"));

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
        name: "other-playbook",
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
  assert.match(stdout.buffer, /name mismatch/i);
});
