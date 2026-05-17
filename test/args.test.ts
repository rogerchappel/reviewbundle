import assert from "node:assert/strict";
import test from "node:test";

import { parseArgs } from "../src/args.js";
import { ReviewBundleError } from "../src/errors.js";

test("parseArgs uses conservative defaults", () => {
  const options = parseArgs([], "/work/repo");
  assert.equal(options.repoPath, "/work/repo");
  assert.equal(options.mode, "all");
  assert.equal(options.base, "main");
  assert.equal(options.check, false);
  assert.equal(options.allowSecretPaths, false);
});

test("parseArgs accepts explicit output and mode", () => {
  const options = parseArgs(["--output", "bundle", "--mode", "staged", "--json"], "/work/repo");
  assert.equal(options.outputDir, "bundle");
  assert.equal(options.mode, "staged");
  assert.equal(options.json, true);
});

test("parseArgs rejects unknown modes", () => {
  assert.throws(() => parseArgs(["--mode", "everything"], "/work/repo"), ReviewBundleError);
});
