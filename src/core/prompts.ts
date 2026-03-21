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
    throw new CliUsageError("`dotagent init --yes` requires `--runtimes` or `--runtime`.");
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

function canPrompt(context: CliContext): boolean {
  const input = context.stdin as { isTTY?: boolean };
  const output = context.stdout as { isTTY?: boolean };
  return input.isTTY === true && output.isTTY === true;
}
