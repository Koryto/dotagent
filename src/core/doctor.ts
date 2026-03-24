import path from "node:path";

import { fileExists } from "./files.js";
import { listBundledFrameworkSkills } from "./framework-skills.js";
import { loadManifest } from "./manifest.js";
import { listBundledPlaybooks, listInstalledPlaybooks, loadInstalledPlaybookContract } from "./playbooks.js";
import { getRuntimeBridgeRelativePath, getRuntimeManifestRelativePath, SUPPORTED_RUNTIMES } from "./adapters.js";
import { planUpdate } from "./update.js";
import { resolveDotagentRoot } from "./paths.js";
import type { CliContext } from "../models/command.js";
import type { SupportedRuntime } from "./adapters.js";
import { DotagentError, ManifestCorruptionError } from "../utils/errors.js";

type IssueSeverity = "error" | "warning";

interface DoctorIssue {
  severity: IssueSeverity;
  message: string;
}

interface DoctorUpdateSummary {
  create: number;
  update: number;
  remove: number;
  adopt: number;
  skip: number;
}

export interface DoctorReport {
  projectRoot: string;
  frameworkPresent: boolean;
  manifestPresent: boolean;
  gitRootPresent: boolean;
  bundledPlaybooks: string[];
  installedPlaybooks: string[];
  installedAdapters: SupportedRuntime[];
  drift: DoctorUpdateSummary | null;
  issues: DoctorIssue[];
}

const REQUIRED_FRAMEWORK_PATHS = [
  "workflows",
  "skills",
  "playbooks"
] as const;

const REQUIRED_STARTUP_FILES = [
  "state/session_state.md",
  "project/PROJECT.md",
  "project/project_progress.md",
  "workflows/standard.md"
] as const;

export function inspectDoctor(context: CliContext): DoctorReport {
  const issues: DoctorIssue[] = [];
  const bundledPlaybooks = listBundledPlaybooks(context.bundledAgentRoot).map((playbook) => playbook.name);
  const installedPlaybooks = inspectInstalledPlaybooks(context, issues);
  const manifest = inspectManifest(context, issues);
  const installedAdapters = inspectAdapters(context, manifest, issues);
  inspectFrameworkLayout(context, bundledPlaybooks, issues);
  const drift = inspectManagedDrift(context, issues);

  return {
    projectRoot: context.projectRoot,
    frameworkPresent: context.projectState.hasFramework,
    manifestPresent: context.projectState.hasManifest,
    gitRootPresent: context.projectState.hasGitRoot,
    bundledPlaybooks,
    installedPlaybooks,
    installedAdapters,
    drift,
    issues
  };
}

export function renderDoctorReport(report: DoctorReport): string {
  const lines = [
    "dotagent doctor",
    "",
    `project_root: ${report.projectRoot}`,
    `framework_present: ${String(report.frameworkPresent)}`,
    `manifest_present: ${String(report.manifestPresent)}`,
    `git_root_present: ${String(report.gitRootPresent)}`,
    `bundled_playbooks: ${report.bundledPlaybooks.length}`,
    formatListLine(report.bundledPlaybooks),
    `installed_playbooks: ${report.installedPlaybooks.length}`,
    formatListLine(report.installedPlaybooks),
    `installed_adapters: ${report.installedAdapters.length}`,
    formatListLine(report.installedAdapters)
  ];

  if (report.drift) {
    lines.push(
      `managed_drift: create=${report.drift.create}, update=${report.drift.update}, remove=${report.drift.remove}, adopt=${report.drift.adopt}, skip=${report.drift.skip}`
    );
  } else {
    lines.push("managed_drift: unavailable");
  }

  lines.push(`issues: ${report.issues.length}`);
  if (report.issues.length > 0) {
    for (const issue of report.issues) {
      lines.push(`- ${issue.severity}: ${issue.message}`);
    }
  }

  return lines.join("\n");
}

function inspectInstalledPlaybooks(context: CliContext, issues: DoctorIssue[]): string[] {
  if (!context.projectState.hasFramework) {
    issues.push({
      severity: "warning",
      message: "The target project is missing `.agent/`. Run `dotagent init` first."
    });
    return [];
  }

  try {
    return listInstalledPlaybooks(resolveDotagentRoot(context.projectRoot)).map((playbook) => playbook.name);
  } catch (error) {
    issues.push({
      severity: "error",
      message: toDoctorMessage(error, "Installed playbooks could not be inspected.")
    });
    return [];
  }
}

function inspectManifest(context: CliContext, issues: DoctorIssue[]) {
  if (!context.projectState.hasManifest) {
    issues.push({
      severity: "warning",
      message: "The target project is missing `.agent/.dotagent-manifest.json`."
    });
    return null;
  }

  try {
    return loadManifest(context.projectRoot);
  } catch (error) {
    issues.push({
      severity: "error",
      message: toDoctorMessage(error, "The manifest is unreadable.")
    });
    return null;
  }
}

function inspectAdapters(
  context: CliContext,
  manifest: ReturnType<typeof loadManifest>,
  issues: DoctorIssue[]
): SupportedRuntime[] {
  const installedAdapters: SupportedRuntime[] = [];
  const bundledSkills = listBundledFrameworkSkills(context.bundledAgentRoot);

  if (!manifest) {
    return installedAdapters;
  }

  for (const entry of manifest.installedAdapters) {
    if (!isSupportedRuntime(entry.runtime)) {
      issues.push({
        severity: "error",
        message: `Manifest declares an unsupported adapter runtime: ${entry.runtime}`
      });
      continue;
    }

    const runtimeManifestPath = path.join(context.projectRoot, ...getRuntimeManifestRelativePath(entry.runtime).split("/"));
    if (!fileExists(runtimeManifestPath)) {
      issues.push({
        severity: "error",
        message: `Adapter ${entry.runtime} is missing its runtime manifest: ${toProjectRelativePath(context.projectRoot, runtimeManifestPath)}`
      });
    }

    for (const skill of bundledSkills) {
      const wrapperPath = path.join(
        context.projectRoot,
        ...getRuntimeBridgeRelativePath(entry.runtime, skill.skillName).split("/")
      );

      if (!fileExists(wrapperPath)) {
        issues.push({
          severity: "error",
          message: `Adapter ${entry.runtime} is missing a generated runtime bridge: ${toProjectRelativePath(context.projectRoot, wrapperPath)}`
        });
      }
    }

    installedAdapters.push(entry.runtime);
  }

  for (const runtime of SUPPORTED_RUNTIMES) {
    const declared = manifest.installedAdapters.some((entry) => entry.runtime === runtime);
    if (declared) {
      continue;
    }

    for (const skill of bundledSkills) {
      const wrapperPath = path.join(context.projectRoot, ...getRuntimeBridgeRelativePath(runtime, skill.skillName).split("/"));
      if (fileExists(wrapperPath)) {
        issues.push({
          severity: "warning",
          message: `Found adapter file not tracked in the manifest: ${toProjectRelativePath(context.projectRoot, wrapperPath)}`
        });
      }
    }

    const runtimeManifestPath = path.join(context.projectRoot, ...getRuntimeManifestRelativePath(runtime).split("/"));
    if (fileExists(runtimeManifestPath)) {
      issues.push({
        severity: "warning",
        message: `Found adapter file not tracked in the manifest: ${toProjectRelativePath(context.projectRoot, runtimeManifestPath)}`
      });
    }
  }

  return installedAdapters.sort((left, right) => left.localeCompare(right));
}

function isSupportedRuntime(candidate: string): candidate is SupportedRuntime {
  return (SUPPORTED_RUNTIMES as readonly string[]).includes(candidate);
}

function inspectFrameworkLayout(context: CliContext, bundledPlaybooks: string[], issues: DoctorIssue[]): void {
  if (!context.projectState.hasFramework) {
    return;
  }

  const dotagentRoot = resolveDotagentRoot(context.projectRoot);
  for (const relativePath of REQUIRED_FRAMEWORK_PATHS) {
    const targetPath = path.join(dotagentRoot, relativePath);
    if (!fileExists(targetPath)) {
      issues.push({
        severity: "error",
        message: `Required framework path is missing: .agent/${relativePath}`
      });
    }
  }

  for (const relativePath of REQUIRED_STARTUP_FILES) {
    const targetPath = path.join(dotagentRoot, relativePath);
    if (!fileExists(targetPath)) {
      issues.push({
        severity: "error",
        message: `Required framework startup file is missing: .agent/${relativePath}`
      });
    }
  }

  for (const playbookName of bundledPlaybooks) {
    const playbookPath = path.join(dotagentRoot, "playbooks", playbookName, "PLAYBOOK.md");
    if (!fileExists(playbookPath)) {
      issues.push({
        severity: "error",
        message: `Bundled playbook is missing from the installed framework: .agent/playbooks/${playbookName}/PLAYBOOK.md`
      });
    }

    try {
      loadInstalledPlaybookContract(context.projectRoot, playbookName);
    } catch (error) {
      issues.push({
        severity: "error",
        message: toDoctorMessage(
          error,
          `Installed playbook contract is invalid: .agent/playbooks/${playbookName}/playbook.json`
        )
      });
    }
  }
}

function inspectManagedDrift(context: CliContext, issues: DoctorIssue[]): DoctorUpdateSummary | null {
  if (!context.projectState.hasFramework || !context.projectState.hasManifest) {
    return null;
  }

  try {
    const plan = planUpdate(context);
    return {
      create: plan.files.filter((entry) => entry.action === "create").length,
      update: plan.files.filter((entry) => entry.action === "update").length,
      remove: plan.files.filter((entry) => entry.action === "remove").length,
      adopt: plan.files.filter((entry) => entry.action === "adopt").length,
      skip: plan.files.filter((entry) => entry.action === "skip").length
    };
  } catch (error) {
    if (!(error instanceof ManifestCorruptionError)) {
      issues.push({
        severity: "error",
        message: toDoctorMessage(error, "Managed drift could not be inspected.")
      });
    }

    return null;
  }
}

function formatListLine(values: readonly string[]): string {
  return values.length > 0 ? `- ${values.join("\n- ")}` : "- (none)";
}

function toProjectRelativePath(projectRoot: string, absolutePath: string): string {
  return path.relative(projectRoot, absolutePath).split(path.sep).join("/");
}

function toDoctorMessage(error: unknown, fallback: string): string {
  if (error instanceof DotagentError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
