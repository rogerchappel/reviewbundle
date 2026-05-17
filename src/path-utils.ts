import path from "node:path";

import { ReviewBundleError } from "./errors.js";

export function resolveInside(root: string, relativePath: string): string {
  const resolved = path.resolve(root, relativePath);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
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
