export interface BundledPlaybook {
  name: string;
  rootPath: string;
  playbookPath: string;
}

export interface PlaybookContract {
  name: string;
  version: string;
  runtimeRoot: string;
  templateDir: string;
  gitignoreEntry?: string;
  taskScoped?: boolean;
  initialRound?: string;
}
