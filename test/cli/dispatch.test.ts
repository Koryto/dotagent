import test from "node:test";
import assert from "node:assert/strict";

import { runCli } from "../../src/cli.js";

class MemoryWritable {
  public buffer = "";

  public write(chunk: string): boolean {
    this.buffer += chunk;
    return true;
  }
}

test("runCli returns help when no command is provided", async () => {
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await runCli({
    argv: [],
    cwd: process.cwd(),
    stdout: stdout as never,
    stderr: stderr as never
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
    stdout: stdout as never,
    stderr: stderr as never
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
    stdout: stdout as never,
    stderr: stderr as never
  });

  assert.equal(exitCode, 2);
  assert.match(stderr.buffer, /Unknown command/);
  assert.equal(stdout.buffer, "");
});
