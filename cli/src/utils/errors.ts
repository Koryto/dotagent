export class DotagentError extends Error {
  readonly exitCode: number;

  public constructor(message: string, exitCode = 1) {
    super(message);
    this.name = this.constructor.name;
    this.exitCode = exitCode;
  }
}

export class CliUsageError extends DotagentError {
  public constructor(message: string) {
    super(message, 2);
  }
}

export class NotImplementedCliError extends DotagentError {
  public constructor(message: string) {
    super(message, 3);
  }
}

export function toExitCode(error: DotagentError): number {
  return error.exitCode;
}
