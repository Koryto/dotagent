import path from "node:path";

import { readUtf8File } from "./files.js";
import { DotagentError } from "../utils/errors.js";

interface PackageMetadata {
  name?: string;
  version?: string;
}

export function readFrameworkRef(packageRoot: string): string {
  const packageJsonPath = path.join(packageRoot, "package.json");

  try {
    const parsed = JSON.parse(readUtf8File(packageJsonPath)) as PackageMetadata;
    const name = parsed.name?.trim() || "dotagent";
    const version = parsed.version?.trim() || "0.0.0";
    return `${name}@${version}`;
  } catch (error) {
    throw new DotagentError(`Unable to read framework package metadata: ${packageJsonPath}`);
  }
}
