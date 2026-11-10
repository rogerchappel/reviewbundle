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

const CONTENT_TOKEN_PATTERNS: Array<{ name: string; pattern: RegExp; message: string }> = [
  { name: "github-token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{30,255}\b/g, message: "GitHub token-like content is redacted." },
  { name: "github-fine-grained-token", pattern: /\bgithub_pat_[A-Za-z0-9_]{40,255}\b/g, message: "GitHub token-like content is redacted." },
  { name: "aws-access-key", pattern: /\bAKIA[0-9A-Z]{16}\b/g, message: "AWS access-key-like content is redacted." }
];

/** Return high-confidence credential-like spans without exposing matched values. */
export function redactContent(content: string): { content: string; findings: Array<{ rule: string; message: string }> } {
  const findings: Array<{ rule: string; message: string }> = [];
  let redacted = content;
  for (const rule of CONTENT_TOKEN_PATTERNS) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(redacted)) {
      findings.push({ rule: rule.name, message: rule.message });
      rule.pattern.lastIndex = 0;
      redacted = redacted.replace(rule.pattern, "[REDACTED]");
    }
  }
  return { content: redacted, findings };
}

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
