import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { listBundledPlaybooks, loadInstalledPlaybookContract } from "../../src/core/playbooks.js";
import { BundledAssetsError, PlaybookContractError } from "../../src/utils/errors.js";

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

test("loadInstalledPlaybookContract rejects traversal-capable transport paths", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-contract-paths-"));
  const playbookRoot = path.join(root, ".agent", "playbooks", "the-test-playbook");
  mkdirSync(playbookRoot, { recursive: true });
  writeFileSync(path.join(playbookRoot, "PLAYBOOK.md"), "# Test\n", "utf8");
  writeFileSync(
    path.join(playbookRoot, "playbook.json"),
    `${JSON.stringify(
      {
        name: "the-test-playbook",
        version: "0.1.0",
        defaultTransport: "filesystem",
        transports: {
          filesystem: {
            runtimeRoot: "../outside",
            templateDir: "filesystem/round_template"
          }
        }
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  assert.throws(() => loadInstalledPlaybookContract(root, "the-test-playbook"), PlaybookContractError);
});

test("loadInstalledPlaybookContract rejects traversal-capable playbook names", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-contract-name-"));

  assert.throws(() => loadInstalledPlaybookContract(root, "..\\outside"), PlaybookContractError);
});

test("loadInstalledPlaybookContract rejects traversal-capable contract names", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-contract-invalid-name-"));
  const playbookRoot = path.join(root, ".agent", "playbooks", "the-test-playbook");
  mkdirSync(playbookRoot, { recursive: true });
  writeFileSync(path.join(playbookRoot, "PLAYBOOK.md"), "# Test\n", "utf8");
  writeFileSync(
    path.join(playbookRoot, "playbook.json"),
    `${JSON.stringify(
      {
        name: "../outside",
        version: "0.1.0",
        defaultTransport: "filesystem",
        transports: {
          filesystem: {
            runtimeRoot: ".ecrr",
            templateDir: "filesystem/round_template"
          }
        }
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  assert.throws(() => loadInstalledPlaybookContract(root, "the-test-playbook"), PlaybookContractError);
});
