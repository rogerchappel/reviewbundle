import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createBundle } from "../src/bundle.js";
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

test("staged bundles snapshot indexed content instead of later working-tree edits", async () => {
  const repo = await makeFixtureRepo();
  const changedPath = path.join(repo, "src/app.js");
  await writeFile(changedPath, "staged version\n");
  await execFile("git", ["add", "src/app.js"], repo);
  await writeFile(changedPath, "unstaged version\n");

  const outputDir = path.join(os.tmpdir(), "reviewbundle-staged-mixed-" + Date.now());
  const result = await createBundle(bundleOptions(repo, outputDir));

  assert.equal(await readFile(path.join(outputDir, "changed-files/src/app.js"), "utf8"), "staged version\n");
  assert.match(await readFile(path.join(outputDir, "diff.patch"), "utf8"), /staged version/);
  assert.doesNotMatch(await readFile(path.join(outputDir, "diff.patch"), "utf8"), /unstaged version/);
  assert.deepEqual(result.manifest?.files[0], {
    path: "src/app.js",
    oldPath: undefined,
    status: "MM",
    kind: "modified",
    snapshot: "changed-files/src/app.js"
  });
});

test("staged bundles retain indexed additions deleted only from the working tree", async () => {
  const repo = await makeFixtureRepo();
  const changedPath = path.join(repo, "staged-then-deleted.txt");
  await writeFile(changedPath, "indexed content\n");
  await execFile("git", ["add", "staged-then-deleted.txt"], repo);
  await rm(changedPath);

  const outputDir = path.join(os.tmpdir(), "reviewbundle-staged-deleted-" + Date.now());
  const result = await createBundle(bundleOptions(repo, outputDir));

  assert.equal(await readFile(path.join(outputDir, "changed-files/staged-then-deleted.txt"), "utf8"), "indexed content\n");
  assert.deepEqual(result.manifest?.files[0], {
    path: "staged-then-deleted.txt",
    oldPath: undefined,
    status: "AD",
    kind: "added",
    snapshot: "changed-files/staged-then-deleted.txt"
  });
});

function bundleOptions(repoPath: string, outputDir: string) {
  return {
    repoPath,
    outputDir,
    mode: "staged" as const,
    base: "main",
    json: false,
    check: false,
    allowSecretPaths: false,
    maxFileBytes: 1024 * 1024,
    force: false
  };
}
