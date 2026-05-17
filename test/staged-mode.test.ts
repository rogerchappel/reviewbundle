import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { execFile } from "../src/exec.js";
import { collectGitSnapshot } from "../src/git.js";
import { makeFixtureRepo } from "./helpers.js";

test("staged mode includes only index changes", async () => {
  const repo = await makeFixtureRepo();
  await writeFile(path.join(repo, "staged.txt"), "staged\n");
  await writeFile(path.join(repo, "unstaged.txt"), "unstaged\n");
  await execFile("git", ["add", "staged.txt"], repo);

  const snapshot = await collectGitSnapshot(repo, "staged", "main");
  assert.deepEqual(snapshot.files.map((file) => file.path), ["staged.txt"]);
  assert.match(snapshot.diff, /staged/);
  assert.doesNotMatch(snapshot.diff, /unstaged/);
});
