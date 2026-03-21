import type { Logger } from "../utils/logger.js";
import type { ProjectState } from "./project.js";
import type { Readable, Writable } from "node:stream";

export interface CommandFlags {
  cwd?: string;
  runtimes?: string[];
  task?: string;
  transport?: string;
  dryRun: boolean;
  yes: boolean;
  help: boolean;
}

export interface HelpCommand {
  kind: "help";
  flags: CommandFlags;
}

export interface InitCommand {
  kind: "init";
  flags: CommandFlags;
}

export interface UpdateCommand {
  kind: "update";
  flags: CommandFlags;
}

export interface DoctorCommand {
  kind: "doctor";
  flags: CommandFlags;
}

export interface PlaybookListCommand {
  kind: "playbook-list";
  flags: CommandFlags;
}

export interface PlaybookInitCommand {
  kind: "playbook-init";
  flags: CommandFlags;
  name: string;
}

export type ParsedCommand =
  | HelpCommand
  | InitCommand
  | UpdateCommand
  | DoctorCommand
  | PlaybookListCommand
  | PlaybookInitCommand;

export type CliCommand = Exclude<ParsedCommand, HelpCommand>;

export interface CliContext {
  invocationCwd: string;
  stdin: Readable;
  stdout: Writable;
  projectRoot: string;
  packageRoot: string;
  bundledAgentRoot: string;
  projectState: ProjectState;
  flags: CommandFlags;
  logger: Logger;
}
