import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createBundle } from "../src/bundle.js";
import { makeFixtureRepo } from "./helpers.js";

test("createBundle omits snapshots larger than max-file-bytes", async () => {
  const repo = await makeFixtureRepo();
  await writeFile(path.join(repo, "large.txt"), "0123456789\n");
  const outputDir = path.join(os.tmpdir(), "reviewbundle-large-" + Date.now());

  const result = await createBundle({
    repoPath: repo,
    outputDir,
    mode: "all",
    base: "main",
    json: false,
    check: false,
    allowSecretPaths: false,
    maxFileBytes: 4,
    force: false
  });

  assert.equal(result.filesIncluded, 0);
  assert.equal(result.manifest?.files[0]?.omitted, "larger-than-max-file-bytes");
});
