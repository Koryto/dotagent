import {
  createHash,
} from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import path from "node:path";

export function ensureParentDirectory(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

export function writeUtf8File(filePath: string, content: string): void {
  ensureParentDirectory(filePath);
  writeFileSync(filePath, content, "utf8");
}

export function writeBinaryFile(filePath: string, content: Buffer): void {
  ensureParentDirectory(filePath);
  writeFileSync(filePath, content);
}

export function appendUtf8File(filePath: string, content: string): void {
  ensureParentDirectory(filePath);
  writeFileSync(filePath, content, { encoding: "utf8", flag: "a" });
}

export function readUtf8File(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

export function readBinaryFile(filePath: string): Buffer {
  return readFileSync(filePath);
}

export function hashBuffer(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export function hashUtf8(content: string): string {
  return hashBuffer(Buffer.from(content, "utf8"));
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

export function removeFileIfExists(filePath: string): void {
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

export function filesAreEqual(leftPath: string, rightPath: string): boolean {
  try {
    return readBinaryFile(leftPath).equals(readBinaryFile(rightPath));
  } catch {
    return false;
  }
}

export function collectFilePaths(rootDirectory: string): string[] {
  const results: string[] = [];
  walk(rootDirectory, results);
  return results.sort((left, right) => left.localeCompare(right));
}

export function collectDirectoryPaths(rootDirectory: string): string[] {
  const results: string[] = [];
  walkDirectories(rootDirectory, results);
  return results.sort((left, right) => left.localeCompare(right));
}

export function toRelativeManifestPath(projectRoot: string, targetPath: string): string {
  return path.relative(projectRoot, targetPath).split(path.sep).join("/");
}

function walk(directory: string, results: string[]): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath, results);
      continue;
    }

    if (entry.isFile() || statSync(absolutePath).isFile()) {
      results.push(absolutePath);
    }
  }
}

function walkDirectories(directory: string, results: string[]): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    results.push(absolutePath);
    walkDirectories(absolutePath, results);
  }
}
