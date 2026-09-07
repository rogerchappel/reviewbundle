import assert from "node:assert/strict";
import { readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createBundle } from "../src/bundle.js";
import { addWorkingTreeChange, makeFixtureRepo } from "./helpers.js";

test("createBundle writes deterministic review artifacts", async () => {
  const repo = await makeFixtureRepo();
  await addWorkingTreeChange(repo);
  const outputDir = path.join(os.tmpdir(), "reviewbundle-test-" + Date.now());

  const result = await createBundle({
    repoPath: repo,
    outputDir,
    mode: "all",
    base: "main",
    json: false,
    check: false,
    allowSecretPaths: false,
    maxFileBytes: 1024 * 1024,
    force: false
  });

  assert.equal(result.filesIncluded, 2);
  await stat(path.join(outputDir, "manifest.json"));
  await stat(path.join(outputDir, "summary.md"));
  await stat(path.join(outputDir, "diff.patch"));
  await stat(path.join(outputDir, "changed-files/src/app.js"));
  const manifest = JSON.parse(await readFile(path.join(outputDir, "manifest.json"), "utf8"));
  assert.equal(manifest.createdAt, "1970-01-01T00:00:00.000Z");
});

test("createBundle snapshots a POSIX filename containing a literal backslash", { skip: process.platform === "win32" }, async () => {
  const repo = await makeFixtureRepo();
  const gitPath = "literal\\backslash.txt";
  await writeFile(path.join(repo, gitPath), "backslash content\n");
  const outputDir = path.join(os.tmpdir(), "reviewbundle-backslash-test-" + Date.now());

  const result = await createBundle({
    repoPath: repo,
    outputDir,
    mode: "all",
    base: "main",
    json: false,
    check: false,
    allowSecretPaths: false,
    maxFileBytes: 1024 * 1024,
    force: false
  });

  assert.equal(result.manifest?.files[0]?.path, gitPath);
  assert.equal(result.manifest?.files[0]?.snapshot, "changed-files/" + gitPath);
  assert.equal(await readFile(path.join(outputDir, "changed-files", gitPath), "utf8"), "backslash content\n");
  assert.match(await readFile(path.join(outputDir, "summary.md"), "utf8"), /literal\\backslash\.txt/);
  assert.match(await readFile(path.join(outputDir, "diff.patch"), "utf8"), /literal\\\\backslash\.txt/);
});
