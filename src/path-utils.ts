import path from "node:path";

import { ReviewBundleError } from "./errors.js";

export function resolveInside(root: string, relativePath: string): string {
  const canonicalRoot = path.resolve(root);
  const resolved = path.resolve(canonicalRoot, relativePath);
  const rootWithSep = canonicalRoot.endsWith(path.sep) ? canonicalRoot : canonicalRoot + path.sep;
  if (resolved !== canonicalRoot && !resolved.startsWith(rootWithSep)) {
    throw new ReviewBundleError("Refusing path outside repository: " + relativePath);
  }
  return resolved;
}

export function snapshotPathFor(gitPath: string): string {
  return path.join("changed-files", gitPath.split("/").map(sanitizeSegment).join(path.sep));
}

function sanitizeSegment(segment: string): string {
  if (segment === ".." || segment === "." || segment.length === 0) {
    return "_";
  }
  return segment;
}
