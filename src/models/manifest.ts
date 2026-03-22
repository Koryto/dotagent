export interface InstalledAdapterRecord {
  runtime: string;
}

export interface FileOwnershipRecord {
  path: string;
  owner: "framework" | "playbook" | "adapter";
  contentHash?: string;
}

export interface DotagentManifest {
  manifestVersion: 1;
  frameworkRef: string;
  bundledPlaybooks: string[];
  installedAdapters: InstalledAdapterRecord[];
  ownedFiles: FileOwnershipRecord[];
}
