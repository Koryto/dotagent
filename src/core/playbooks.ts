import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import type { BundledPlaybook, PlaybookContract } from "../models/playbook.js";
import { readUtf8File } from "./files.js";
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
  const contractPath = path.join(projectRoot, ".agent", "playbooks", normalizedPlaybookName, "playbook.json");

  if (!existsSync(contractPath)) {
    throw new PlaybookContractError(`Playbook contract is missing: ${contractPath}`);
  }

  try {
    const parsed = JSON.parse(readUtf8File(contractPath)) as unknown;
    return validatePlaybookContract(parsed, contractPath);
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

  if (typeof record.defaultTransport !== "string" || record.defaultTransport.length === 0) {
    throw new PlaybookContractError(`Playbook contract defaultTransport must be a non-empty string: ${contractPath}`);
  }

  if (typeof record.transports !== "object" || record.transports === null) {
    throw new PlaybookContractError(`Playbook contract transports must be an object: ${contractPath}`);
  }

  const transports = record.transports as Record<string, unknown>;
  for (const [transportName, transportValue] of Object.entries(transports)) {
    if (typeof transportValue !== "object" || transportValue === null) {
      throw new PlaybookContractError(`Playbook transport ${transportName} must be an object: ${contractPath}`);
    }

    const transportRecord = transportValue as Record<string, unknown>;
    if (typeof transportRecord.runtimeRoot !== "string" || transportRecord.runtimeRoot.length === 0) {
      throw new PlaybookContractError(
        `Playbook transport ${transportName} runtimeRoot must be a non-empty string: ${contractPath}`
      );
    }

    const runtimeRoot = normalizeContractPath(
      transportRecord.runtimeRoot,
      `Playbook transport ${transportName} runtimeRoot`,
      contractPath
    );

    if (typeof transportRecord.templateDir !== "string" || transportRecord.templateDir.length === 0) {
      throw new PlaybookContractError(
        `Playbook transport ${transportName} templateDir must be a non-empty string: ${contractPath}`
      );
    }

    const templateDir = normalizeContractPath(
      transportRecord.templateDir,
      `Playbook transport ${transportName} templateDir`,
      contractPath
    );

    if (
      transportRecord.gitignoreEntry !== undefined &&
      typeof transportRecord.gitignoreEntry !== "string"
    ) {
      throw new PlaybookContractError(
        `Playbook transport ${transportName} gitignoreEntry must be a string when present: ${contractPath}`
      );
    }

    if (transportRecord.taskScoped !== undefined && typeof transportRecord.taskScoped !== "boolean") {
      throw new PlaybookContractError(
        `Playbook transport ${transportName} taskScoped must be a boolean when present: ${contractPath}`
      );
    }

    if (transportRecord.initialRound !== undefined && typeof transportRecord.initialRound !== "string") {
      throw new PlaybookContractError(
        `Playbook transport ${transportName} initialRound must be a string when present: ${contractPath}`
      );
    }

    transportRecord.runtimeRoot = runtimeRoot;
    transportRecord.templateDir = templateDir;
    let initialRound: string | undefined;
    if (typeof transportRecord.initialRound === "string") {
      initialRound = normalizeContractPath(
        transportRecord.initialRound,
        `Playbook transport ${transportName} initialRound`,
        contractPath
      );
    }
    if (initialRound !== undefined) {
      transportRecord.initialRound = initialRound;
    }
  }

  if (!(record.defaultTransport in transports)) {
    throw new PlaybookContractError(`Playbook contract defaultTransport is not defined in transports: ${contractPath}`);
  }

  return {
    name: playbookName,
    version: record.version,
    defaultTransport: record.defaultTransport,
    transports: transports as PlaybookContract["transports"]
  };
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
