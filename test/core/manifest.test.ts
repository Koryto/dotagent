import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { createInitialManifest, loadManifest, saveManifest } from "../../src/core/manifest.js";
import { ManifestCorruptionError } from "../../src/utils/errors.js";

test("createInitialManifest seeds framework ref and playbooks", () => {
  const manifest = createInitialManifest("local-dev", ["deep-co-planning", "deep-code-review"]);

  assert.equal(manifest.frameworkRef, "local-dev");
  assert.deepEqual(manifest.bundledPlaybooks, ["deep-co-planning", "deep-code-review"]);
  assert.equal(manifest.manifestVersion, 1);
});

test("saveManifest and loadManifest round-trip manifest data", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-manifest-"));
  const expected = createInitialManifest("local-dev", ["deep-co-planning", "deep-code-review"]);

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

test("loadManifest throws when a manifest path contains traversal", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-manifest-invalid-path-"));
  const dotagentRoot = path.join(root, ".agent");
  mkdirSync(dotagentRoot);
  writeFileSync(
    path.join(dotagentRoot, ".dotagent-manifest.json"),
    `${JSON.stringify(
      {
        manifestVersion: 1,
        frameworkRef: "local-dev",
        bundledPlaybooks: [],
        installedAdapters: [],
        ownedFiles: [
          {
            path: ".agent/workflows/../../../victim.txt",
            owner: "framework",
            contentHash: "deadbeef"
          }
        ]
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  assert.throws(() => loadManifest(root), ManifestCorruptionError);
});

test("saveManifest and loadManifest round-trip runtime-only adapter records", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-manifest-runtime-only-"));
  const expected = {
    manifestVersion: 1 as const,
    frameworkRef: "local-dev",
    bundledPlaybooks: ["deep-co-planning", "deep-code-review"],
    installedAdapters: [{ runtime: "codex" }],
    ownedFiles: []
  };

  saveManifest(root, expected);
  const loaded = loadManifest(root);

  assert.deepEqual(loaded, expected);
});

test("loadManifest normalizes legacy adapter path fields away", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-manifest-legacy-adapter-"));
  const dotagentRoot = path.join(root, ".agent");
  mkdirSync(dotagentRoot);
  writeFileSync(
    path.join(dotagentRoot, ".dotagent-manifest.json"),
    `${JSON.stringify(
      {
        manifestVersion: 1,
        frameworkRef: "local-dev",
        bundledPlaybooks: [],
        installedAdapters: [{ runtime: "codex", path: ".codex/skills/dotagent-init/SKILL.md" }],
        ownedFiles: []
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const loaded = loadManifest(root);

  assert.deepEqual(loaded?.installedAdapters, [{ runtime: "codex" }]);
});
