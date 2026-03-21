import {
  createHash,
} from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { assertPathWithinRoot } from "./paths.js";
import { DotagentError } from "../utils/errors.js";

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
  try {
    unlinkSync(filePath);
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code !== "ENOENT") {
      throw error;
    }
  }
}

export function ensureProjectDirectory(projectRoot: string, directoryPath: string, label: string): void {
  assertSafeProjectTarget(projectRoot, directoryPath, label);
  mkdirSync(directoryPath, { recursive: true });
}

export function safeWriteUtf8File(projectRoot: string, filePath: string, content: string, label: string): void {
  assertSafeProjectTarget(projectRoot, filePath, label);
  ensureParentDirectory(filePath);
  writeFileSync(filePath, content, "utf8");
}

export function safeWriteBinaryFile(projectRoot: string, filePath: string, content: Buffer, label: string): void {
  assertSafeProjectTarget(projectRoot, filePath, label);
  ensureParentDirectory(filePath);
  writeFileSync(filePath, content);
}

export function safeAppendUtf8File(projectRoot: string, filePath: string, content: string, label: string): void {
  assertSafeProjectTarget(projectRoot, filePath, label);
  ensureParentDirectory(filePath);
  writeFileSync(filePath, content, { encoding: "utf8", flag: "a" });
}

export function safeRemoveFileIfExists(projectRoot: string, filePath: string, label: string): void {
  assertSafeProjectTarget(projectRoot, filePath, label);

  try {
    unlinkSync(filePath);
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code !== "ENOENT") {
      throw error;
    }
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

function assertSafeProjectTarget(projectRoot: string, targetPath: string, label: string): void {
  const resolvedTarget = assertPathWithinRoot(projectRoot, targetPath, label);
  const resolvedRoot = path.resolve(projectRoot);

  if (existsSync(resolvedRoot) && lstatSync(resolvedRoot).isSymbolicLink()) {
    throw new DotagentError(`${label} uses a symlinked project root: ${resolvedRoot}`);
  }

  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.length === 0) {
    return;
  }

  let current = resolvedRoot;
  for (const segment of relative.split(path.sep)) {
    if (segment.length === 0) {
      continue;
    }

    current = path.join(current, segment);
    if (!existsSync(current)) {
      break;
    }

    if (lstatSync(current).isSymbolicLink()) {
      throw new DotagentError(`${label} uses a symlinked path component: ${current}`);
    }
  }
}
