export type BundleMode = "all" | "staged" | "unstaged" | "branch";

export type ChangeKind = "added" | "modified" | "deleted" | "renamed" | "copied" | "untracked" | "unknown";

export interface CliOptions {
  repoPath: string;
  outputDir: string;
  mode: BundleMode;
  base: string;
  json: boolean;
  check: boolean;
  allowSecretPaths: boolean;
  maxFileBytes: number;
  force: boolean;
}

export interface ChangedFile {
  path: string;
  oldPath?: string;
  status: string;
  kind: ChangeKind;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
  deleted: boolean;
}

export interface RedactionFinding {
  path: string;
  rule: string;
  severity: "block" | "warn";
  message: string;
}

export interface BundleManifest {
  tool: "reviewbundle";
  version: string;
  createdAt: string;
  repo: {
    root: string;
    head: string;
    branch: string;
    base?: string;
  };
  options: {
    mode: BundleMode;
    maxFileBytes: number;
    allowSecretPaths: boolean;
  };
  files: Array<{
    path: string;
    oldPath?: string;
    status: string;
    kind: ChangeKind;
    snapshot?: string;
    omitted?: string;
  }>;
  redactions: RedactionFinding[];
}

export interface BundleResult {
  outputDir: string;
  filesIncluded: number;
  filesOmitted: number;
  blocked: RedactionFinding[];
  warnings: RedactionFinding[];
  manifest?: BundleManifest;
}
