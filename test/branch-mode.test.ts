import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { execFile } from "../src/exec.js";
import { collectGitSnapshot } from "../src/git.js";
import { makeFixtureRepo } from "./helpers.js";

test("branch mode compares HEAD against the base ref", async () => {
  const repo = await makeFixtureRepo();
  await execFile("git", ["checkout", "-b", "feature"], repo);
  await writeFile(path.join(repo, "branch.txt"), "branch change\n");
  await execFile("git", ["add", "branch.txt"], repo);
  await execFile("git", ["commit", "-m", "feature change"], repo);

  const snapshot = await collectGitSnapshot(repo, "branch", "main");
  assert.deepEqual(snapshot.files.map((file) => file.path), ["branch.txt"]);
  assert.equal(snapshot.base, "main");
  assert.match(snapshot.diff, /branch change/);
});
