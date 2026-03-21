import test from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { planUpdate, applyUpdatePlan } from "../../src/core/update.js";
import { hashUtf8 } from "../../src/core/files.js";
import { createInitialManifest, loadManifest, saveManifest } from "../../src/core/manifest.js";
import type { CliContext } from "../../src/models/command.js";

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

test("planUpdate/applyUpdatePlan removes stale managed files that no longer exist in bundled sources", () => {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-update-remove-project-"));
  const packageRoot = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-update-remove-package-"));
  const bundledAgentRoot = path.join(packageRoot, ".agent");

  mkdirSync(path.join(bundledAgentRoot, "workflows"), { recursive: true });
  mkdirSync(path.join(bundledAgentRoot, "skills"), { recursive: true });
  mkdirSync(path.join(bundledAgentRoot, "playbooks"), { recursive: true });
  writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({ name: "@dotagent/cli", version: "0.1.0" }), "utf8");

  const staleTargetPath = path.join(projectRoot, ".agent", "workflows", "obsolete.md");
  mkdirSync(path.dirname(staleTargetPath), { recursive: true });
  const staleContent = "obsolete managed workflow\n";
  writeFileSync(staleTargetPath, staleContent, "utf8");

  const manifest = createInitialManifest("@dotagent/cli@0.0.0", []);
  manifest.ownedFiles = [
    {
      path: ".agent/workflows/obsolete.md",
      owner: "framework",
      contentHash: hashUtf8(staleContent)
    }
  ];
  saveManifest(projectRoot, manifest);

  const context: CliContext = {
    invocationCwd: projectRoot,
    stdin: Readable.from([]),
    stdout: new MemoryWritable(),
    projectRoot,
    packageRoot,
    bundledAgentRoot,
    projectState: {
      hasFramework: true,
      hasManifest: true,
      hasGitRoot: false,
      dotagentRoot: path.join(projectRoot, ".agent")
    },
    flags: {
      dryRun: false,
      yes: true,
      help: false
    },
    logger: {
      info(): void {},
      warn(): void {},
      error(): void {}
    }
  };

  const plan = planUpdate(context);
  const removal = plan.files.find((entry) => entry.relativePath === ".agent/workflows/obsolete.md");
  assert.ok(removal);
  assert.equal(removal.action, "remove");

  applyUpdatePlan(plan);

  assert.equal(readableExists(staleTargetPath), false);

  const updatedManifest = loadManifest(projectRoot);
  assert.ok(updatedManifest);
  assert.equal(updatedManifest.ownedFiles.some((entry) => entry.path === ".agent/workflows/obsolete.md"), false);
});

function readableExists(targetPath: string): boolean {
  try {
    readFileSync(targetPath);
    return true;
  } catch {
    return false;
  }
}
