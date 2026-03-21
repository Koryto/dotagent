export interface InstalledAdapterRecord {
  runtime: string;
  path: string;
}

export interface FileOwnershipRecord {
  path: string;
  owner: "framework" | "playbook";
}

export interface DotagentManifest {
  manifestVersion: 1;
  frameworkRef: string;
  bundledPlaybooks: string[];
  installedAdapters: InstalledAdapterRecord[];
  ownedFiles: FileOwnershipRecord[];
}
