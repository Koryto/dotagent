import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { createInitialManifest, loadManifest, saveManifest } from "../../src/core/manifest.js";

test("createInitialManifest seeds framework ref and playbooks", () => {
  const manifest = createInitialManifest("local-dev", ["the-extreme-cr-rig"]);

  assert.equal(manifest.frameworkRef, "local-dev");
  assert.deepEqual(manifest.bundledPlaybooks, ["the-extreme-cr-rig"]);
  assert.equal(manifest.manifestVersion, 1);
});

test("saveManifest and loadManifest round-trip manifest data", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-manifest-"));
  const expected = createInitialManifest("local-dev", ["the-extreme-cr-rig"]);

  saveManifest(root, expected);
  const loaded = loadManifest(root);

  assert.deepEqual(loaded, expected);
});
