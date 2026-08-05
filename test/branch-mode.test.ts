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

test("branch mode keeps name-status rename paths in source-to-destination order", async () => {
  const repo = await makeFixtureRepo();
  await execFile("git", ["checkout", "-b", "feature"], repo);
  await execFile("git", ["mv", "src/app.js", "src/renamed.js"], repo);
  await execFile("git", ["commit", "-m", "rename app"], repo);

  const snapshot = await collectGitSnapshot(repo, "branch", "main");
  assert.equal(snapshot.files[0]?.path, "src/renamed.js");
  assert.equal(snapshot.files[0]?.oldPath, "src/app.js");
  assert.equal(snapshot.files[0]?.status, "R100");
  assert.equal(snapshot.files[0]?.kind, "renamed");
});
