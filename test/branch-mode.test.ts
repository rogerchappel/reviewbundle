import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createBundle } from "../src/bundle.js";
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

test("branch mode snapshots committed HEAD content despite dirty working-tree edits", async () => {
  const repo = await makeFixtureRepo();
  await execFile("git", ["checkout", "-b", "feature"], repo);
  await writeFile(path.join(repo, "src/app.js"), "committed feature\n");
  await writeFile(path.join(repo, "added.txt"), "committed addition\n");
  await execFile("git", ["add", "src/app.js", "added.txt"], repo);
  await execFile("git", ["commit", "-m", "feature content"], repo);

  await writeFile(path.join(repo, "src/app.js"), "uncommitted local edit\n");
  await rm(path.join(repo, "added.txt"));

  const outputDir = path.join(os.tmpdir(), "reviewbundle-branch-dirty-" + Date.now());
  await createBundle({
    repoPath: repo,
    outputDir,
    mode: "branch",
    base: "main",
    json: false,
    check: false,
    allowSecretPaths: false,
    maxFileBytes: 1024 * 1024,
    force: false
  });

  assert.equal(await readFile(path.join(outputDir, "changed-files/src/app.js"), "utf8"), "committed feature\n");
  assert.equal(await readFile(path.join(outputDir, "changed-files/added.txt"), "utf8"), "committed addition\n");
  const diff = await readFile(path.join(outputDir, "diff.patch"), "utf8");
  assert.match(diff, /committed feature/);
  assert.doesNotMatch(diff, /uncommitted local edit/);
});
