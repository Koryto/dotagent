import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";

import { resolvePlaybookTask } from "../../src/core/prompts.js";
import type { CliContext } from "../../src/models/command.js";
import { createLogger } from "../../src/utils/logger.js";
import { CliUsageError } from "../../src/utils/errors.js";

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

test("resolvePlaybookTask rejects task names with path separators", async () => {
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();
  const context: CliContext = {
    invocationCwd: process.cwd(),
    stdin: Readable.from([]),
    stdout,
    projectRoot: process.cwd(),
    packageRoot: process.cwd(),
    bundledAgentRoot: `${process.cwd()}\\.agent`,
    projectState: {
      hasFramework: true,
      hasManifest: true,
      hasGitRoot: true,
      dotagentRoot: `${process.cwd()}\\.agent`
    },
    flags: {
      task: "foo/bar",
      dryRun: false,
      verbose: false,
      yes: true,
      help: false
    },
    logger: createLogger(stdout, stderr)
  };

  await assert.rejects(() => resolvePlaybookTask(context, "the-extreme-cr-rig"), CliUsageError);
});
