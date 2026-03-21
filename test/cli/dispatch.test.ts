import test from "node:test";
import assert from "node:assert/strict";
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
  assert.match(stdout.buffer, /the-extreme-cr-rig/);
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
