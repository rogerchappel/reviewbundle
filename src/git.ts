import path from "node:path";

import { ReviewBundleError } from "./errors.js";
import { execFile } from "./exec.js";
import type { BundleMode, ChangedFile, ChangeKind } from "./types.js";

export interface GitSnapshot {
  root: string;
  branch: string;
  head: string;
  base?: string;
  diff: string;
  files: ChangedFile[];
}

export async function resolveGitRoot(repoPath: string): Promise<string> {
  const result = await execFile("git", ["rev-parse", "--show-toplevel"], repoPath);
  return path.resolve(repoPath, result.stdout.trim());
}

export async function collectGitSnapshot(repoPath: string, mode: BundleMode, base: string): Promise<GitSnapshot> {
  const root = await resolveGitRoot(repoPath);
  const [branch, head] = await Promise.all([
    gitOutput(root, ["branch", "--show-current"]),
    gitOutput(root, ["rev-parse", "--verify", "HEAD"])
  ]);

  if (mode === "branch") {
    const mergeBase = (await gitOutput(root, ["merge-base", base, "HEAD"])).trim();
    const range = mergeBase + "...HEAD";
    const [diff, names] = await Promise.all([
      gitOutput(root, ["diff", "--binary", range]),
      gitOutput(root, ["diff", "--name-status", "-z", range])
    ]);
    return { root, branch: branch.trim(), head: head.trim(), base, diff, files: parseNameStatus(names) };
  }

  const args = diffArgsForMode(mode);
  const [diff, status] = await Promise.all([
    gitOutput(root, ["diff", "--binary", ...args]),
    gitOutput(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"])
  ]);

  const files = filterStatusForMode(parsePorcelainStatus(status), mode);
  return { root, branch: branch.trim(), head: head.trim(), diff, files };
}

async function gitOutput(root: string, args: string[]): Promise<string> {
  try {
    return (await execFile("git", args, root)).stdout;
  } catch (error) {
    if (error instanceof ReviewBundleError) {
      throw error;
    }
    throw new ReviewBundleError(error instanceof Error ? error.message : String(error));
  }
}

function diffArgsForMode(mode: BundleMode): string[] {
  if (mode === "staged") return ["--cached"];
  if (mode === "unstaged") return [];
  return ["HEAD"];
}

function parsePorcelainStatus(raw: string): ChangedFile[] {
  const entries = raw.split("\0").filter(Boolean);
  const files: ChangedFile[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index] ?? "";
    const x = entry[0] ?? " ";
    const y = entry[1] ?? " ";
    const rest = entry.slice(3);
    const renamed = x === "R" || y === "R" || x === "C" || y === "C";
    const oldPath = renamed ? rest : undefined;
    const filePath = renamed ? entries[++index] : rest;
    files.push(toChangedFile(filePath ?? "", x + y, oldPath));
  }

  return sortFiles(dedupeFiles(files));
}

function parseNameStatus(raw: string): ChangedFile[] {
  const entries = raw.split("\0").filter(Boolean);
  const files: ChangedFile[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const status = entries[index] ?? "";
    const oldPath = status.startsWith("R") || status.startsWith("C") ? entries[++index] : undefined;
    const filePath = entries[++index] ?? "";
    files.push(toChangedFile(filePath, status, oldPath));
  }

  return sortFiles(dedupeFiles(files));
}

function toChangedFile(filePath: string, status: string, oldPath?: string): ChangedFile {
  const untracked = status === "??";
  const deleted = status.includes("D");
  return {
    path: normalizeGitPath(filePath),
    oldPath: oldPath ? normalizeGitPath(oldPath) : undefined,
    status,
    kind: changeKind(status),
    staged: status[0] !== " " && status[0] !== "?" && status[0] !== undefined,
    unstaged: status[1] !== " " && status[1] !== undefined,
    untracked,
    deleted
  };
}

function changeKind(status: string): ChangeKind {
  if (status === "??") return "untracked";
  if (status.startsWith("A") || status.includes("A")) return "added";
  if (status.startsWith("D") || status.includes("D")) return "deleted";
  if (status.startsWith("R")) return "renamed";
  if (status.startsWith("C")) return "copied";
  if (status.includes("M")) return "modified";
  return "unknown";
}

function filterStatusForMode(files: ChangedFile[], mode: BundleMode): ChangedFile[] {
  if (mode === "all") return files;
  if (mode === "staged") return files.filter((file) => file.staged);
  if (mode === "unstaged") return files.filter((file) => file.unstaged || file.untracked);
  return files;
}

function dedupeFiles(files: ChangedFile[]): ChangedFile[] {
  const byPath = new Map<string, ChangedFile>();
  for (const file of files) {
    const existing = byPath.get(file.path);
    byPath.set(file.path, existing ? { ...existing, ...file, staged: existing.staged || file.staged, unstaged: existing.unstaged || file.unstaged } : file);
  }
  return [...byPath.values()];
}

function sortFiles(files: ChangedFile[]): ChangedFile[] {
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function normalizeGitPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}
