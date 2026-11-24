import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createBundle } from "../src/bundle.js";
import { ReviewBundleError } from "../src/errors.js";
import { addWorkingTreeChange, makeFixtureRepo } from "./helpers.js";

test("createBundle refuses to overwrite existing output without force", async () => {
  const repo = await makeFixtureRepo();
  await addWorkingTreeChange(repo);
  const outputDir = path.join(os.tmpdir(), "reviewbundle-existing-" + Date.now());
  await mkdir(outputDir);

  await assert.rejects(
    () =>
      createBundle({
        repoPath: repo,
        outputDir,
        mode: "all",
        base: "main",
        json: false,
        check: false,
        allowSecretPaths: false,
        maxFileBytes: 1024 * 1024,
        force: false
      }),
    ReviewBundleError
  );
});

for (const outputName of ["reviewbundle-output", "custom/bundle"]) {
  test(`createBundle excludes in-repository output ${outputName} on repeated force runs`, async () => {
    const repo = await makeFixtureRepo();
    const outputDir = path.join(repo, outputName);
    await mkdir(path.dirname(outputDir), { recursive: true });
    await writeFile(path.join(repo, "genuine.txt"), "genuine change\n");
    const options = {
      repoPath: repo, outputDir, mode: "all" as const, base: "main", json: false,
      check: false, allowSecretPaths: false, maxFileBytes: 1024 * 1024, force: true
    };

    await createBundle(options);
    const result = await createBundle(options);
    const manifest = JSON.parse(await readFile(path.join(outputDir, "manifest.json"), "utf8"));
    const diff = await readFile(path.join(outputDir, "diff.patch"), "utf8");

    assert.deepEqual(manifest.files.map((file: { path: string }) => file.path), ["genuine.txt"]);
    assert.match(diff, /genuine\.txt/);
    assert.doesNotMatch(diff, /manifest\.json|diff\.patch|reviewbundle-output|custom\/bundle/);
    assert.equal(result.filesOmitted, 0);
  });
}

test("snapshotPathFor sanitizes exact dot segments and preserves ordinary segments", async () => {
  const { snapshotPathFor } = await import("../src/path-utils.js");

  assert.equal(snapshotPathFor("src/../secret.txt"), path.join("changed-files", "src", "_", "secret.txt"));
  assert.equal(snapshotPathFor("./src//file.txt"), path.join("changed-files", "_", "src", "_", "file.txt"));
  assert.equal(snapshotPathFor("src/..hidden/file..txt"), path.join("changed-files", "src", "..hidden", "file..txt"));
});

test("createBundle keeps POSIX backslash dot-segment names contained", { skip: process.platform === "win32" }, async () => {
  const repo = await makeFixtureRepo();
  const gitPath = "..\\secret.txt";
  await writeFile(path.join(repo, gitPath), "literal filename\n");
  const outputDir = path.join(os.tmpdir(), "reviewbundle-backslash-dot-test-" + Date.now());

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
  assert.equal(result.manifest?.files[0]?.snapshot, "changed-files/..\\secret.txt");
  assert.equal(await readFile(path.join(outputDir, "changed-files", gitPath), "utf8"), "literal filename\n");
});

test("resolveInside normalizes root spellings before checking containment", async () => {
  const { resolveInside } = await import("../src/path-utils.js");
  const root = path.join(os.tmpdir(), "reviewbundle-root");
  assert.equal(resolveInside(path.join(root, "nested", ".."), "file.txt"), path.join(root, "file.txt"));
  assert.throws(() => resolveInside(path.join(root, "nested", ".."), "../outside.txt"), ReviewBundleError);
});
