import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

test("loadInstalledPlaybookContract rejects traversal-capable runtime paths", () => {
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
        runtimeRoot: "../outside",
        templateDir: "template"
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  assert.throws(() => loadInstalledPlaybookContract(root, "the-test-playbook"), PlaybookContractError);
});

test("loadInstalledPlaybookContract rejects traversal-capable template paths", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-contract-template-paths-"));
  const playbookRoot = path.join(root, ".agent", "playbooks", "the-test-playbook");
  mkdirSync(playbookRoot, { recursive: true });
  writeFileSync(path.join(playbookRoot, "PLAYBOOK.md"), "# Test\n", "utf8");
  writeFileSync(
    path.join(playbookRoot, "playbook.json"),
    `${JSON.stringify(
      {
        name: "the-test-playbook",
        version: "0.1.0",
        runtimeRoot: ".ecrr",
        templateDir: "../outside"
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
        runtimeRoot: ".ecrr",
        templateDir: "template"
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  assert.throws(() => loadInstalledPlaybookContract(root, "the-test-playbook"), PlaybookContractError);
});

test("loadInstalledPlaybookContract rejects multiline gitignore entries", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-contract-gitignore-"));
  const playbookRoot = path.join(root, ".agent", "playbooks", "the-test-playbook");
  mkdirSync(playbookRoot, { recursive: true });
  writeFileSync(path.join(playbookRoot, "PLAYBOOK.md"), "# Test\n", "utf8");
  writeFileSync(
    path.join(playbookRoot, "playbook.json"),
    `${JSON.stringify(
      {
        name: "the-test-playbook",
        version: "0.1.0",
        runtimeRoot: ".ecrr",
        templateDir: "template",
        gitignoreEntry: ".ecrr/\nsecret-dir/"
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  assert.throws(() => loadInstalledPlaybookContract(root, "the-test-playbook"), PlaybookContractError);
});

test("loadInstalledPlaybookContract rejects symlinked installed playbook roots", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-contract-symlink-root-"));
  const playbooksRoot = path.join(root, ".agent", "playbooks");
  const outside = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-contract-symlink-target-"));
  mkdirSync(playbooksRoot, { recursive: true });
  writeFileSync(path.join(outside, "PLAYBOOK.md"), "# Test\n", "utf8");
  writeFileSync(
    path.join(outside, "playbook.json"),
    `${JSON.stringify(
      {
        name: "the-test-playbook",
        version: "0.1.0",
        runtimeRoot: ".ecrr",
        templateDir: "template"
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  symlinkSync(outside, path.join(playbooksRoot, "the-test-playbook"), "junction");

  assert.throws(() => loadInstalledPlaybookContract(root, "the-test-playbook"), PlaybookContractError);

  rmSync(path.join(playbooksRoot, "the-test-playbook"), { recursive: true, force: true });
});

test("loadInstalledPlaybookContract rejects symlinked .agent ancestors", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-contract-symlink-agent-root-"));
  const outsideProject = mkdtempSync(path.join(os.tmpdir(), "dotagent-cli-playbook-contract-symlink-agent-target-"));
  const outsidePlaybookRoot = path.join(outsideProject, ".agent", "playbooks", "the-test-playbook");

  mkdirSync(outsidePlaybookRoot, { recursive: true });
  writeFileSync(path.join(outsidePlaybookRoot, "PLAYBOOK.md"), "# Outside\n", "utf8");
  writeFileSync(
    path.join(outsidePlaybookRoot, "playbook.json"),
    `${JSON.stringify(
      {
        name: "the-test-playbook",
        version: "0.1.0",
        runtimeRoot: ".ecrr",
        templateDir: "template"
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  symlinkSync(path.join(outsideProject, ".agent"), path.join(root, ".agent"), "junction");

  assert.throws(() => loadInstalledPlaybookContract(root, "the-test-playbook"), PlaybookContractError);

  rmSync(path.join(root, ".agent"), { recursive: true, force: true });
});
