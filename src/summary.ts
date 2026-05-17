import type { BundleManifest } from "./types.js";

export function renderSummary(manifest: BundleManifest): string {
  const included = manifest.files.filter((file) => file.snapshot).length;
  const omitted = manifest.files.length - included;
  const blocked = manifest.redactions.filter((finding) => finding.severity === "block").length;

  return [
    "# ReviewBundle Summary",
    "",
    "Repository: " + manifest.repo.root,
    "Branch: " + (manifest.repo.branch || "(detached)"),
    "Head: " + manifest.repo.head,
    "Mode: " + manifest.options.mode,
    "Files included: " + String(included),
    "Files omitted: " + String(omitted),
    "Redaction findings: " + String(blocked),
    "",
    "## Changed Files",
    "",
    ...manifest.files.map((file) => "- " + file.path + " (" + file.kind + (file.omitted ? ", omitted: " + file.omitted : "") + ")"),
    "",
    "## Safety",
    "",
    blocked === 0
      ? "No blocking redaction findings were detected."
      : "One or more paths were blocked by redaction rules. Inspect redaction-report.json before sharing.",
    ""
  ].join("\n");
}
