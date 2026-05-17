import { cp, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { execFile } from "../src/exec.js";

export async function makeFixtureRepo(): Promise<string> {
  const repo = await mkdtemp(path.join(os.tmpdir(), "reviewbundle-fixture-"));
  await cp(path.resolve("fixtures/basic-repo"), repo, { recursive: true });
  await execFile("git", ["init", "-b", "main"], repo);
  await execFile("git", ["config", "user.email", "fixture@example.com"], repo);
  await execFile("git", ["config", "user.name", "Fixture User"], repo);
  await execFile("git", ["add", "."], repo);
  await execFile("git", ["commit", "-m", "initial"], repo);
  return repo;
}

export async function addWorkingTreeChange(repo: string): Promise<void> {
  await writeFile(path.join(repo, "src/app.js"), "export function greet(name) {\n  return \"hello, \" + name;\n}\n");
  await writeFile(path.join(repo, "src/new-file.js"), "export const added = true;\n");
}
