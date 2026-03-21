import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { detectProjectState, resolveProjectRoot } from "../../src/core/project.js";

test("resolveProjectRoot uses the provided start directory as the project root", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-project-"));
  mkdirSync(path.join(root, ".git"));
  const nested = path.join(root, "src", "feature");
  mkdirSync(nested, { recursive: true });

  const resolved = resolveProjectRoot(nested);

  assert.equal(resolved, nested);
});

test("resolveProjectRoot keeps the provided directory even when no marker exists", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-no-marker-"));
  const nested = path.join(root, "subdir");
  mkdirSync(nested, { recursive: true });

  const resolved = resolveProjectRoot(nested);

  assert.equal(resolved, nested);
});

test("detectProjectState reports framework and manifest presence", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-state-"));
  mkdirSync(path.join(root, ".agent"));
  writeFileSync(path.join(root, ".agent", ".dotagent-manifest.json"), "{}\n", "utf8");

  const state = detectProjectState(root);

  assert.equal(state.hasFramework, true);
  assert.equal(state.hasManifest, true);
  assert.equal(state.dotagentRoot, path.join(root, ".agent"));
});
