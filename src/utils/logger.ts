import type { Writable } from "node:stream";

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export function createLogger(stdout: Writable, stderr: Writable): Logger {
  return {
    info(message: string): void {
      stdout.write(`${message}\n`);
    },
    warn(message: string): void {
      stderr.write(`WARN: ${message}\n`);
    },
    error(message: string): void {
      stderr.write(`ERROR: ${message}\n`);
    }
  };
}
