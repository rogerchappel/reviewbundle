# Orchestration

ReviewBundle is designed for local-first agent handoffs. A worker can run it inside a dirty repository, inspect the redaction report, and hand the resulting folder to a reviewer without pushing a branch or copying the whole repo.

## Worker Flow

1. Make the code change in the target repo.
2. Run `reviewbundle --check` to catch blocked paths before writing artifacts.
3. Run `reviewbundle --output ./reviewbundle-output --force` when the check is clean.
4. Share the output directory, not the original repository.

## Artifact Contract

- `summary.md`: human-readable overview.
- `diff.patch`: git patch for tracked changes.
- `changed-files/`: working-tree snapshots for included files.
- `manifest.json`: deterministic machine-readable metadata.
- `redaction-report.json`: blocked or warning findings.

## Safety Defaults

Secret-looking paths, git internals, dependencies, and build output are blocked. Use `--allow-secret-paths` only for private local workflows where the reviewer is allowed to see those files.
