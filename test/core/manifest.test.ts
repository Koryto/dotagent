import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { createInitialManifest, loadManifest, saveManifest } from "../../src/core/manifest.js";
import { ManifestCorruptionError } from "../../src/utils/errors.js";

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

test("loadManifest returns null when the manifest does not exist", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-manifest-missing-"));

  const loaded = loadManifest(root);

  assert.equal(loaded, null);
});

test("loadManifest throws when the manifest contains invalid JSON", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-manifest-invalid-json-"));
  const dotagentRoot = path.join(root, ".agent");
  mkdirSync(dotagentRoot);
  writeFileSync(path.join(dotagentRoot, ".dotagent-manifest.json"), "{not json}\n", "utf8");

  assert.throws(() => loadManifest(root), ManifestCorruptionError);
});

test("loadManifest throws when the manifest shape is invalid", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-manifest-invalid-shape-"));
  const dotagentRoot = path.join(root, ".agent");
  mkdirSync(dotagentRoot);
  writeFileSync(
    path.join(dotagentRoot, ".dotagent-manifest.json"),
    `${JSON.stringify({ manifestVersion: 1, frameworkRef: "local-dev" }, null, 2)}\n`,
    "utf8"
  );

  assert.throws(() => loadManifest(root), ManifestCorruptionError);
});
