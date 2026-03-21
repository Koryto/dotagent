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
