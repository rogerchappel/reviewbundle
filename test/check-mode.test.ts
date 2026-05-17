import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { createBundle } from "../src/bundle.js";
import { makeFixtureRepo } from "./helpers.js";

test("check mode reports blocked paths without writing a bundle", async () => {
  const repo = await makeFixtureRepo();
  await writeFile(path.join(repo, ".env.local"), "TOKEN=secret\n");

  const result = await createBundle({
    repoPath: repo,
    outputDir: path.join(repo, "bundle"),
    mode: "all",
    base: "main",
    json: false,
    check: true,
    allowSecretPaths: false,
    maxFileBytes: 1024 * 1024,
    force: false
  });

  assert.equal(result.blocked.length, 1);
  assert.equal(result.blocked[0]?.path, ".env.local");
});
