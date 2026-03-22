import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import type { BundledPlaybook, PlaybookContract } from "../models/playbook.js";
import { assertNonSymlinkedPathWithinRoot, readUtf8File } from "./files.js";
import { normalizeRelativeSubpath } from "./paths.js";
import { BundledAssetsError, DotagentError, PlaybookContractError } from "../utils/errors.js";

export function listBundledPlaybooks(bundledAgentRoot: string): BundledPlaybook[] {
  return listPlaybooksInAgentRoot(bundledAgentRoot, "Bundled");
}

export function listInstalledPlaybooks(dotagentRoot: string): BundledPlaybook[] {
  return listPlaybooksInAgentRoot(dotagentRoot, "Installed");
}

export function loadInstalledPlaybookContract(projectRoot: string, playbookName: string): PlaybookContract {
  const normalizedPlaybookName = normalizePlaybookIdentifier(playbookName, "Playbook name");
  const playbooksRoot = path.join(projectRoot, ".agent", "playbooks");
  const playbookRoot = assertInstalledPlaybookRoot(projectRoot, normalizedPlaybookName);
  const contractPath = path.join(playbookRoot, "playbook.json");

  if (!existsSync(contractPath)) {
    throw new PlaybookContractError(`Playbook contract is missing: ${contractPath}`);
  }

  try {
    const parsed = JSON.parse(readUtf8File(contractPath)) as unknown;
    const contract = validatePlaybookContract(parsed, contractPath);
    if (contract.name !== normalizedPlaybookName) {
      throw new PlaybookContractError(
        `Playbook contract name mismatch. Expected ${normalizedPlaybookName}, found ${contract.name}: ${contractPath}`
      );
    }
    return contract;
  } catch (error) {
    if (error instanceof PlaybookContractError) {
      throw error;
    }

    throw new PlaybookContractError(`Playbook contract is unreadable or invalid JSON: ${contractPath}`);
  }
}

function listPlaybooksInAgentRoot(agentRoot: string, label: string): BundledPlaybook[] {
  const playbooksRoot = path.join(agentRoot, "playbooks");
  if (!existsSync(playbooksRoot)) {
    throw new BundledAssetsError(`${label} playbooks directory is missing: ${playbooksRoot}`);
  }

  try {
    const playbooks: BundledPlaybook[] = [];

    for (const entry of readdirSync(playbooksRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const rootPath = path.join(playbooksRoot, entry.name);
      const playbookPath = path.join(rootPath, "PLAYBOOK.md");

      try {
        if (!statSync(playbookPath).isFile()) {
          throw new BundledAssetsError(`${label} playbook path is not a file: ${playbookPath}`);
        }
      } catch (error) {
        if (error instanceof BundledAssetsError) {
          throw error;
        }

        throw new BundledAssetsError(`${label} playbook is missing PLAYBOOK.md: ${playbookPath}`);
      }

      playbooks.push({
        name: entry.name,
        rootPath,
        playbookPath
      });
    }

    return playbooks.sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    if (error instanceof BundledAssetsError) {
      throw error;
    }

    throw new BundledAssetsError(`${label} playbooks are unreadable: ${playbooksRoot}`);
  }
}

function validatePlaybookContract(candidate: unknown, contractPath: string): PlaybookContract {
  if (typeof candidate !== "object" || candidate === null) {
    throw new PlaybookContractError(`Playbook contract has an invalid top-level shape: ${contractPath}`);
  }

  const record = candidate as Record<string, unknown>;
  if (typeof record.name !== "string" || record.name.length === 0) {
    throw new PlaybookContractError(`Playbook contract name must be a non-empty string: ${contractPath}`);
  }

  const playbookName = normalizePlaybookIdentifier(record.name, "Playbook contract name", contractPath);

  if (typeof record.version !== "string" || record.version.length === 0) {
    throw new PlaybookContractError(`Playbook contract version must be a non-empty string: ${contractPath}`);
  }

  if (typeof record.runtimeRoot !== "string" || record.runtimeRoot.length === 0) {
    throw new PlaybookContractError(`Playbook contract runtimeRoot must be a non-empty string: ${contractPath}`);
  }

  const runtimeRoot = normalizeContractPath(record.runtimeRoot, "Playbook contract runtimeRoot", contractPath);

  if (typeof record.templateDir !== "string" || record.templateDir.length === 0) {
    throw new PlaybookContractError(`Playbook contract templateDir must be a non-empty string: ${contractPath}`);
  }

  const templateDir = normalizeContractPath(record.templateDir, "Playbook contract templateDir", contractPath);

  if (record.gitignoreEntry !== undefined && typeof record.gitignoreEntry !== "string") {
    throw new PlaybookContractError(`Playbook contract gitignoreEntry must be a string when present: ${contractPath}`);
  }

  if (record.taskScoped !== undefined && typeof record.taskScoped !== "boolean") {
    throw new PlaybookContractError(`Playbook contract taskScoped must be a boolean when present: ${contractPath}`);
  }

  if (record.initialRound !== undefined && typeof record.initialRound !== "string") {
    throw new PlaybookContractError(`Playbook contract initialRound must be a string when present: ${contractPath}`);
  }

  let gitignoreEntry: string | undefined;
  if (typeof record.gitignoreEntry === "string") {
    gitignoreEntry = normalizeGitignoreEntry(record.gitignoreEntry, "Playbook contract gitignoreEntry", contractPath);
  }

  let initialRound: string | undefined;
  if (typeof record.initialRound === "string") {
    initialRound = normalizeContractPath(record.initialRound, "Playbook contract initialRound", contractPath);
  }

  return {
    name: playbookName,
    version: record.version,
    runtimeRoot,
    templateDir,
    ...(gitignoreEntry !== undefined ? { gitignoreEntry } : {}),
    ...(record.taskScoped !== undefined ? { taskScoped: record.taskScoped } : {}),
    ...(initialRound !== undefined ? { initialRound } : {})
  };
}

function assertInstalledPlaybookRoot(projectRoot: string, playbookName: string): string {
  const playbookRoot = path.join(projectRoot, ".agent", "playbooks", playbookName);

  try {
    return assertNonSymlinkedPathWithinRoot(
      projectRoot,
      playbookRoot,
      `Installed playbook root for ${playbookName}`
    );
  } catch (error) {
    if (error instanceof DotagentError) {
      throw new PlaybookContractError(error.message);
    }

    throw error;
  }
}

export function normalizePlaybookIdentifier(value: string, label: string, contractPath?: string): string {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(trimmed)) {
    const suffix = contractPath ? `: ${contractPath}` : "";
    throw new PlaybookContractError(`${label} must be a non-empty identifier without separators or traversal: ${value}${suffix}`);
  }

  return trimmed;
}

function normalizeContractPath(value: unknown, label: string, contractPath: string): string {
  if (typeof value !== "string") {
    throw new PlaybookContractError(`${label} must be a non-empty string: ${contractPath}`);
  }

  try {
    return normalizeRelativeSubpath(value, label);
  } catch (error) {
    if (error instanceof DotagentError) {
      throw new PlaybookContractError(`${error.message}: ${contractPath}`);
    }

    throw error;
  }
}

function normalizeGitignoreEntry(value: string, label: string, contractPath: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new PlaybookContractError(`${label} must be a non-empty single-line string: ${contractPath}`);
  }

  if (trimmed.includes("\r") || trimmed.includes("\n")) {
    throw new PlaybookContractError(`${label} must not contain line breaks: ${contractPath}`);
  }

  return trimmed;
}
