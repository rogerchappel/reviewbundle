import path from "node:path";

import { ReviewBundleError } from "./errors.js";
import type { BundleMode, CliOptions } from "./types.js";

const MODES = new Set<BundleMode>(["all", "staged", "unstaged", "branch"]);

export function parseArgs(argv: string[], cwd = process.cwd()): CliOptions {
  const options: CliOptions = {
    repoPath: cwd,
    outputDir: path.join(cwd, "reviewbundle-output"),
    mode: "all",
    base: "main",
    json: false,
    check: false,
    allowSecretPaths: false,
    maxFileBytes: 1024 * 1024,
    force: false
  };

  const positionals: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? "";
    if (arg === "--help" || arg === "-h") {
      throw new ReviewBundleError(helpText(), 0);
    }
    if (arg === "--json") options.json = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--allow-secret-paths") options.allowSecretPaths = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--output" || arg === "-o") options.outputDir = requireValue(argv, ++index, arg);
    else if (arg === "--mode") options.mode = parseMode(requireValue(argv, ++index, arg));
    else if (arg === "--base") options.base = requireValue(argv, ++index, arg);
    else if (arg === "--max-file-bytes") options.maxFileBytes = parsePositiveInt(requireValue(argv, ++index, arg), arg);
    else if (arg.startsWith("--output=")) options.outputDir = arg.slice("--output=".length);
    else if (arg.startsWith("--mode=")) options.mode = parseMode(arg.slice("--mode=".length));
    else if (arg.startsWith("--base=")) options.base = arg.slice("--base=".length);
    else if (arg.startsWith("--max-file-bytes=")) options.maxFileBytes = parsePositiveInt(arg.slice("--max-file-bytes=".length), "--max-file-bytes");
    else if (arg.startsWith("-")) throw new ReviewBundleError("Unknown option: " + arg);
    else positionals.push(arg);
  }

  if (positionals.length > 1) {
    throw new ReviewBundleError("Expected at most one repository path.");
  }
  if (positionals[0]) {
    options.repoPath = path.resolve(cwd, positionals[0]);
    options.outputDir = path.resolve(cwd, options.outputDir);
  }

  return options;
}

export function helpText(): string {
  return [
    "Usage: reviewbundle [repo] [options]",
    "",
    "Options:",
    "  -o, --output <dir>          Bundle output directory",
    "      --mode <mode>           all, staged, unstaged, or branch",
    "      --base <ref>            Base ref for --mode branch (default: main)",
    "      --max-file-bytes <n>    Omit snapshots larger than n bytes",
    "      --allow-secret-paths    Include secret-looking paths",
    "      --check                 Report findings without writing a bundle",
    "      --force                 Replace output directory if it already exists",
    "      --json                  Print machine-readable result",
    "  -h, --help                  Show help"
  ].join("\n");
}

function parseMode(value: string): BundleMode {
  if (MODES.has(value as BundleMode)) {
    return value as BundleMode;
  }
  throw new ReviewBundleError("Invalid mode: " + value);
}

function parsePositiveInt(value: string, option: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ReviewBundleError(option + " must be a positive integer.");
  }
  return parsed;
}

function requireValue(argv: string[], index: number, option: string): string {
  const value = argv[index];
  if (!value || value.startsWith("-")) {
    throw new ReviewBundleError(option + " requires a value.");
  }
  return value;
}
