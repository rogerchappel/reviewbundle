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

test("redactContent removes high-confidence token formats but preserves ordinary text", async () => {
  const { redactContent } = await import("../src/redaction.js");
  const token = `ghp_${"A".repeat(36)}`;
  const result = redactContent(`deploy with ${token}; ordinary words stay`);
  assert.equal(result.content, "deploy with [REDACTED]; ordinary words stay");
  assert.deepEqual(result.findings.map((finding) => finding.rule), ["github-token"]);
  assert.equal(result.content.includes(token), false);
  assert.deepEqual(redactContent("ordinary text only"), { content: "ordinary text only", findings: [] });
});

test("redactContent detects fine-grained GitHub and AWS access-key patterns", async () => {
  const { redactContent } = await import("../src/redaction.js");
  const { content, findings } = redactContent(`x github_pat_${"B".repeat(45)} y AKIA1234567890ABCDEF`);
  assert.equal(content, "x [REDACTED] y [REDACTED]");
  assert.deepEqual(findings.map((finding) => finding.rule), ["github-fine-grained-token", "aws-access-key"]);
});
