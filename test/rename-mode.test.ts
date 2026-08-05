import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createBundle } from "../src/bundle.js";
import { execFile } from "../src/exec.js";
import type { BundleMode } from "../src/types.js";
import { makeFixtureRepo } from "./helpers.js";

for (const mode of ["all", "staged"] as const) {
  test(mode + " mode records a staged rename and snapshots its indexed destination", async () => {
    const repo = await makeFixtureRepo();
    await execFile("git", ["mv", "src/app.js", "src/renamed.js"], repo);
    await writeFile(path.join(repo, "src/renamed.js"), "export function greet(name) {\n  return \"hello \" + name;\n}\n// indexed destination\n");
    await execFile("git", ["add", "src/renamed.js"], repo);
    await writeFile(path.join(repo, "src/renamed.js"), "export function greet(name) {\n  return \"hello \" + name;\n}\n// indexed destination\n// working-tree destination\n");

    const { outputDir, manifest } = await bundleRename(repo, mode);
    const expectedSuffix = mode === "staged" ? "// indexed destination\n" : "// working-tree destination\n";

    assert.ok((await readFile(path.join(outputDir, "changed-files/src/renamed.js"), "utf8")).endsWith(expectedSuffix));
    assert.deepEqual(manifest.files[0], {
      path: "src/renamed.js",
      oldPath: "src/app.js",
      status: "RM",
      kind: "renamed",
      snapshot: "changed-files/src/renamed.js"
    });
    assert.match(await readFile(path.join(outputDir, "diff.patch"), "utf8"), /src\/renamed\.js/);
    assert.match(await readFile(path.join(outputDir, "summary.md"), "utf8"), /src\/app\.js -> src\/renamed\.js \(renamed\)/);
  });
}

test("unstaged mode records a renamed destination with later working-tree edits", async () => {
  const repo = await makeFixtureRepo();
  await execFile("git", ["mv", "src/app.js", "src/renamed.js"], repo);
  await writeFile(path.join(repo, "src/renamed.js"), "export function greet(name) {\n  return \"hello \" + name;\n}\n// indexed destination\n");
  await execFile("git", ["add", "-A"], repo);
  await writeFile(path.join(repo, "src/renamed.js"), "export function greet(name) {\n  return \"hello \" + name;\n}\n// indexed destination\n// working-tree destination\n");

  const { outputDir, manifest } = await bundleRename(repo, "unstaged");

  assert.ok((await readFile(path.join(outputDir, "changed-files/src/renamed.js"), "utf8")).endsWith("// working-tree destination\n"));
  assert.deepEqual(manifest.files[0], {
    path: "src/renamed.js",
    oldPath: "src/app.js",
    status: "RM",
    kind: "renamed",
    snapshot: "changed-files/src/renamed.js"
  });
  assert.match(await readFile(path.join(outputDir, "diff.patch"), "utf8"), /working-tree destination/);
  assert.match(await readFile(path.join(outputDir, "summary.md"), "utf8"), /src\/app\.js -> src\/renamed\.js \(renamed\)/);
});

async function bundleRename(repoPath: string, mode: BundleMode) {
  const outputDir = path.join(os.tmpdir(), "reviewbundle-rename-" + mode + "-" + Date.now());
  const result = await createBundle({
    repoPath,
    outputDir,
    mode,
    base: "main",
    json: false,
    check: false,
    allowSecretPaths: false,
    maxFileBytes: 1024 * 1024,
    force: false
  });
  assert.ok(result.manifest);
  return { outputDir, manifest: result.manifest };
}
