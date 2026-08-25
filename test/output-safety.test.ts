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
