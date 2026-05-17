import type { GitSnapshot } from "./git.js";
import type { BundleManifest, CliOptions, RedactionFinding } from "./types.js";

export function createManifest(
  snapshot: GitSnapshot,
  options: CliOptions,
  redactions: RedactionFinding[],
  files: BundleManifest["files"]
): BundleManifest {
  return {
    tool: "reviewbundle",
    version: "0.1.0",
    createdAt: "1970-01-01T00:00:00.000Z",
    repo: {
      root: snapshot.root,
      head: snapshot.head,
      branch: snapshot.branch,
      ...(snapshot.base ? { base: snapshot.base } : {})
    },
    options: {
      mode: options.mode,
      maxFileBytes: options.maxFileBytes,
      allowSecretPaths: options.allowSecretPaths
    },
    files,
    redactions
  };
}
