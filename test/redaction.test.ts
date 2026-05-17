import assert from "node:assert/strict";
import test from "node:test";

import { scanPaths } from "../src/redaction.js";
import type { ChangedFile } from "../src/types.js";

function file(path: string): ChangedFile {
  return {
    path,
    status: "M ",
    kind: "modified",
    staged: true,
    unstaged: false,
    untracked: false,
    deleted: false
  };
}

test("scanPaths blocks secret-looking files", () => {
  const findings = scanPaths([file(".env.local"), file("src/app.ts")], false);
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.rule, "env-file");
  assert.equal(findings[0]?.severity, "block");
});

test("scanPaths always blocks generated dependency directories", () => {
  const findings = scanPaths([file("node_modules/pkg/index.js")], true);
  assert.equal(findings[0]?.rule, "dependency-dir");
});

test("scanPaths allows secret paths only when explicitly requested", () => {
  assert.equal(scanPaths([file("secrets/api-token.txt")], false).length, 1);
  assert.equal(scanPaths([file("secrets/api-token.txt")], true).length, 0);
});
