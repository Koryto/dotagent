import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { listBundledPlaybooks } from "../../src/core/playbooks.js";
import { BundledAssetsError } from "../../src/utils/errors.js";

test("listBundledPlaybooks returns bundled playbooks with PLAYBOOK.md", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbooks-"));
  const playbooksRoot = path.join(root, "playbooks", "the-test-playbook");
  mkdirSync(playbooksRoot, { recursive: true });
  writeFileSync(path.join(playbooksRoot, "PLAYBOOK.md"), "# Test\n", "utf8");

  const playbooks = listBundledPlaybooks(root);

  assert.equal(playbooks.length, 1);
  assert.equal(playbooks[0]?.name, "the-test-playbook");
});

test("listBundledPlaybooks throws when the bundled playbooks directory is missing", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbooks-missing-"));

  assert.throws(() => listBundledPlaybooks(root), BundledAssetsError);
});

test("listBundledPlaybooks throws when a bundled playbook is missing PLAYBOOK.md", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbooks-invalid-"));
  mkdirSync(path.join(root, "playbooks", "the-test-playbook"), { recursive: true });

  assert.throws(() => listBundledPlaybooks(root), BundledAssetsError);
});
