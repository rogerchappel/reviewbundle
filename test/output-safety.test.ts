import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
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
