import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { ReviewBundleError } from "./errors.js";
import { collectGitSnapshot } from "./git.js";
import { stableJson } from "./json.js";
import { createManifest } from "./manifest.js";
import { resolveInside, snapshotPathFor } from "./path-utils.js";
import { scanPaths, isBlockedPath } from "./redaction.js";
import { renderSummary } from "./summary.js";
import type { BundleManifest, BundleResult, CliOptions } from "./types.js";

export async function createBundle(options: CliOptions): Promise<BundleResult> {
  const snapshot = await collectGitSnapshot(options.repoPath, options.mode, options.base);
  const redactions = scanPaths(snapshot.files, options.allowSecretPaths);
  const blocked = redactions.filter((finding) => finding.severity === "block");

  if (options.check) {
    return {
      outputDir: options.outputDir,
      filesIncluded: snapshot.files.length - blocked.length,
      filesOmitted: blocked.length,
      blocked,
      warnings: redactions.filter((finding) => finding.severity === "warn")
    };
  }

  if (blocked.length > 0) {
    throw new ReviewBundleError("Refusing to bundle blocked paths. Re-run with --check for details.");
  }

  const outputDir = path.resolve(options.outputDir);
  if (options.force) {
    await rm(outputDir, { recursive: true, force: true });
  }
  await mkdir(outputDir, { recursive: false });
  await mkdir(path.join(outputDir, "changed-files"), { recursive: true });

  const files = await writeSnapshots(snapshot.root, outputDir, snapshot.files, redactions, options.maxFileBytes);
  const manifest = createManifest(snapshot, options, redactions, files);

  await writeFile(path.join(outputDir, "diff.patch"), snapshot.diff, "utf8");
  await writeFile(path.join(outputDir, "manifest.json"), stableJson(manifest), "utf8");
  await writeFile(path.join(outputDir, "redaction-report.json"), stableJson({ findings: redactions }), "utf8");
  await writeFile(path.join(outputDir, "summary.md"), renderSummary(manifest), "utf8");

  return {
    outputDir,
    filesIncluded: files.filter((file) => file.snapshot).length,
    filesOmitted: files.filter((file) => file.omitted).length,
    blocked,
    warnings: redactions.filter((finding) => finding.severity === "warn"),
    manifest
  };
}

async function writeSnapshots(
  repoRoot: string,
  outputDir: string,
  changedFiles: BundleManifest["files"],
  redactions: ReturnType<typeof scanPaths>,
  maxFileBytes: number
): Promise<BundleManifest["files"]> {
  const files: BundleManifest["files"] = [];

  for (const file of changedFiles) {
    if (file.kind === "deleted") {
      files.push({ path: file.path, oldPath: file.oldPath, status: file.status, kind: file.kind, omitted: "deleted" });
      continue;
    }

    if (isBlockedPath(file.path, redactions)) {
      files.push({ path: file.path, oldPath: file.oldPath, status: file.status, kind: file.kind, omitted: "redacted" });
      continue;
    }

    const source = resolveInside(repoRoot, file.path);
    const sourceStat = await stat(source);
    if (!sourceStat.isFile()) {
      files.push({ path: file.path, oldPath: file.oldPath, status: file.status, kind: file.kind, omitted: "not-a-file" });
      continue;
    }

    if (sourceStat.size > maxFileBytes) {
      files.push({ path: file.path, oldPath: file.oldPath, status: file.status, kind: file.kind, omitted: "larger-than-max-file-bytes" });
      continue;
    }

    const relativeSnapshot = snapshotPathFor(file.path);
    const target = path.join(outputDir, relativeSnapshot);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await readFile(source));
    files.push({ path: file.path, oldPath: file.oldPath, status: file.status, kind: file.kind, snapshot: relativeSnapshot.replace(/\\/g, "/") });
  }

  return files;
}
