export interface BundledPlaybook {
  name: string;
  rootPath: string;
  playbookPath: string;
}

export interface PlaybookTransportContract {
  runtimeRoot: string;
  templateDir: string;
  gitignoreEntry?: string;
  taskScoped?: boolean;
  initialRound?: string;
}

export interface PlaybookContract {
  name: string;
  version: string;
  defaultTransport: string;
  transports: Record<string, PlaybookTransportContract>;
}
