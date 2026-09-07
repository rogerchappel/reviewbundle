import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { execFile } from "../src/exec.js";
import { collectGitSnapshot } from "../src/git.js";
import { addWorkingTreeChange, makeFixtureRepo } from "./helpers.js";

test("collectGitSnapshot includes modified and untracked files for all mode", async () => {
  const repo = await makeFixtureRepo();
  await addWorkingTreeChange(repo);

  const snapshot = await collectGitSnapshot(repo, "all", "main");
  assert.deepEqual(snapshot.files.map((file) => file.path), ["src/app.js", "src/new-file.js"]);
  assert.match(snapshot.diff, /hello,/);
});

test("collectGitSnapshot limits unstaged mode to unstaged changes", async () => {
  const repo = await makeFixtureRepo();
  await addWorkingTreeChange(repo);

  const snapshot = await collectGitSnapshot(repo, "unstaged", "main");
  assert.equal(snapshot.files.some((file) => file.untracked), true);
});

test("collectGitSnapshot preserves literal backslashes in POSIX paths", { skip: process.platform === "win32" }, async () => {
  const repo = await makeFixtureRepo();
  const trackedPath = "tracked\\name.txt";
  const untrackedPath = "untracked\\name.txt";
  await writeFile(path.join(repo, trackedPath), "original\n");
  await execFile("git", ["add", trackedPath], repo);
  await execFile("git", ["commit", "-m", "add backslash path"], repo);
  await writeFile(path.join(repo, trackedPath), "changed\n");
  await writeFile(path.join(repo, untrackedPath), "new\n");

  const snapshot = await collectGitSnapshot(repo, "all", "main");
  assert.deepEqual(snapshot.files.map((file) => file.path), [trackedPath, untrackedPath]);
  assert.match(snapshot.diff, /tracked\\\\name\.txt/);
  assert.match(snapshot.diff, /untracked\\\\name\.txt/);
});
