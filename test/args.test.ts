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

test("parseArgs accepts a canonical positive max-file-bytes integer", () => {
  assert.equal(parseArgs(["--max-file-bytes", "4096"], "/work/repo").maxFileBytes, 4096);
  assert.equal(parseArgs(["--max-file-bytes=1"], "/work/repo").maxFileBytes, 1);
});

test("parseArgs rejects non-canonical max-file-bytes values", () => {
  for (const value of ["10junk", "1.5", "+1", "-1", "0", "01", "9007199254740992"]) {
    assert.throws(
      () => parseArgs(["--max-file-bytes=" + value], "/work/repo"),
      (error: unknown) => error instanceof ReviewBundleError && /positive integer/.test(error.message),
      value
    );
  }
});

test("parseArgs reports a missing max-file-bytes value", () => {
  assert.throws(
    () => parseArgs(["--max-file-bytes"], "/work/repo"),
    (error: unknown) => error instanceof ReviewBundleError && error.message === "--max-file-bytes requires a value."
  );
});
