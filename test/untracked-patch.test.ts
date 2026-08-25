import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createBundle } from "../src/bundle.js";
import type { BundleMode } from "../src/types.js";
import { addWorkingTreeChange, makeFixtureRepo } from "./helpers.js";

for (const mode of ["all", "unstaged"] as const satisfies readonly BundleMode[]) {
  test(mode + " mode represents untracked files in every review artifact", async () => {
    const repo = await makeFixtureRepo();
    await addWorkingTreeChange(repo);
    const outputDir = path.join(os.tmpdir(), "reviewbundle-untracked-" + mode + "-" + Date.now());

    const result = await createBundle({
      repoPath: repo,
      outputDir,
      mode,
      base: "main",
      json: false,
      check: false,
      allowSecretPaths: false,
      maxFileBytes: 1024 * 1024,
      force: false
    });

    const patch = await readFile(path.join(outputDir, "diff.patch"), "utf8");
    const manifest = JSON.parse(await readFile(path.join(outputDir, "manifest.json"), "utf8"));
    const summary = await readFile(path.join(outputDir, "summary.md"), "utf8");

    assert.match(patch, /diff --git a\/src\/new-file\.js b\/src\/new-file\.js/);
    assert.match(patch, /new file mode 100644/);
    assert.match(patch, /\+export const added = true;/);
    assert.deepEqual(manifest.files.map((file: { path: string }) => file.path), ["src/app.js", "src/new-file.js"]);
    assert.equal(manifest.files[1].snapshot, "changed-files/src/new-file.js");
    assert.equal(result.filesIncluded, 2);
    assert.match(summary, /Files included: 2/);
    assert.match(summary, /- src\/new-file\.js \(untracked\)/);
    assert.equal(await readFile(path.join(outputDir, "changed-files/src/new-file.js"), "utf8"), "export const added = true;\n");
  });
}
