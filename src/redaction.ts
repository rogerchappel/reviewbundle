import type { ChangedFile, RedactionFinding } from "./types.js";

const BLOCKED_PATH_PATTERNS: Array<{ name: string; pattern: RegExp; message: string }> = [
  { name: "env-file", pattern: /(^|\/)\.env(\.|$|\/)/i, message: "Environment files often contain secrets." },
  { name: "private-key", pattern: /(^|\/)(id_rsa|id_dsa|id_ecdsa|id_ed25519|.*\.(pem|p12|pfx|key))$/i, message: "Private key material is blocked by default." },
  { name: "secret-name", pattern: /(^|\/)(secrets?|credentials?|tokens?)(\.|\/|$)/i, message: "Secret-looking paths are blocked by default." },
  { name: "cloud-credentials", pattern: /(^|\/)(\.aws|\.gcloud|\.azure)(\/|$)/i, message: "Cloud credential directories are blocked by default." },
  { name: "ssh-config", pattern: /(^|\/)\.ssh(\/|$)/i, message: "SSH material is blocked by default." }
];

const GENERATED_PATH_PATTERNS: Array<{ name: string; pattern: RegExp; message: string }> = [
  { name: "git-dir", pattern: /(^|\/)\.git(\/|$)/i, message: "Git internals are never bundled." },
  { name: "dependency-dir", pattern: /(^|\/)(node_modules|vendor)(\/|$)/i, message: "Dependency directories are omitted." },
  { name: "build-output", pattern: /(^|\/)(dist|build|coverage|\.next|\.turbo)(\/|$)/i, message: "Generated output directories are omitted." }
];

export function scanPaths(files: ChangedFile[], allowSecretPaths: boolean): RedactionFinding[] {
  const findings: RedactionFinding[] = [];

  for (const file of files) {
    for (const rule of GENERATED_PATH_PATTERNS) {
      if (rule.pattern.test(file.path)) {
        findings.push({ path: file.path, rule: rule.name, severity: "block", message: rule.message });
      }
    }

    if (!allowSecretPaths) {
      for (const rule of BLOCKED_PATH_PATTERNS) {
        if (rule.pattern.test(file.path)) {
          findings.push({ path: file.path, rule: rule.name, severity: "block", message: rule.message });
        }
      }
    }
  }

  return findings.sort((left, right) => left.path.localeCompare(right.path) || left.rule.localeCompare(right.rule));
}

export function isBlockedPath(path: string, findings: RedactionFinding[]): boolean {
  return findings.some((finding) => finding.path === path && finding.severity === "block");
}
