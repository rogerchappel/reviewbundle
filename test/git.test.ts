import assert from "node:assert/strict";
import test from "node:test";

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
