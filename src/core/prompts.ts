import { createInterface } from "node:readline/promises";

import type { SupportedRuntime } from "./adapters.js";
import { parseRuntimeSelection, SUPPORTED_RUNTIMES } from "./adapters.js";
import type { CliContext } from "../models/command.js";
import { CliUsageError } from "../utils/errors.js";

export async function resolveInitRuntimes(context: CliContext): Promise<SupportedRuntime[]> {
  if (context.flags.runtimes && context.flags.runtimes.length > 0) {
    return parseRuntimeSelection(context.flags.runtimes);
  }

  if (context.flags.yes) {
    return [];
  }

  if (!canPrompt(context)) {
    throw new CliUsageError(
      "Interactive runtime selection is unavailable. Re-run with `--runtimes codex,claude` or similar."
    );
  }

  const prompt = createInterface({
    input: context.stdin,
    output: context.stdout
  });

  try {
    const answer = await prompt.question(
      `Select runtimes for this project (comma-separated, blank for none): ${SUPPORTED_RUNTIMES.join(", ")} `
    );

    const trimmed = answer.trim();
    if (trimmed.length === 0) {
      return [];
    }

    return parseRuntimeSelection(trimmed.split(",").map((entry) => entry.trim()));
  } finally {
    prompt.close();
  }
}

export async function confirmProceed(context: CliContext, message: string): Promise<boolean> {
  if (context.flags.yes) {
    return true;
  }

  if (!canPrompt(context)) {
    throw new CliUsageError(
      "Interactive confirmation is unavailable. Re-run with `--yes` to proceed non-interactively."
    );
  }

  const prompt = createInterface({
    input: context.stdin,
    output: context.stdout
  });

  try {
    const answer = await prompt.question(`${message} [y/N] `);
    const normalized = answer.trim().toLowerCase();
    return normalized === "y" || normalized === "yes";
  } finally {
    prompt.close();
  }
}

export async function resolvePlaybookTask(context: CliContext, playbookName: string): Promise<string> {
  if (context.flags.task && context.flags.task.trim().length > 0) {
    return validateTaskName(context.flags.task);
  }

  if (context.flags.yes) {
    throw new CliUsageError(
      `Non-interactive playbook initialization requires --task <name> for ${playbookName}.`
    );
  }

  if (!canPrompt(context)) {
    throw new CliUsageError(
      `Interactive playbook task selection is unavailable. Re-run with --task <name> for ${playbookName}.`
    );
  }

  const prompt = createInterface({
    input: context.stdin,
    output: context.stdout
  });

  try {
    const answer = await prompt.question(`Enter a task name for ${playbookName}: `);
    return validateTaskName(answer);
  } finally {
    prompt.close();
  }
}

function validateTaskName(candidate: string): string {
  const normalized = candidate.trim();
  if (normalized.length === 0) {
    throw new CliUsageError("Task name must not be empty.");
  }

  if (normalized === "." || normalized === "..") {
    throw new CliUsageError("Task name must not be `.` or `..`.");
  }

  if (normalized.includes("/") || normalized.includes("\\")) {
    throw new CliUsageError("Task name must not contain path separators.");
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalized)) {
    throw new CliUsageError(
      "Task name must start with an alphanumeric character and contain only letters, numbers, dots, underscores, or hyphens."
    );
  }

  return normalized;
}

function canPrompt(context: CliContext): boolean {
  const input = context.stdin as { isTTY?: boolean };
  const output = context.stdout as { isTTY?: boolean };
  return input.isTTY === true && output.isTTY === true;
}
