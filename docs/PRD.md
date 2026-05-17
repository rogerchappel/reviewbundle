# ReviewBundle PRD

Status: in-progress

## Summary

ReviewBundle packages the current git change into a local review folder with diffs, file snapshots, metadata, and optional redaction. It gives agents and maintainers a clean handoff artifact without pushing a branch or leaking private files.

## Problem

When work spans many files, reviewers need more than a raw diff but less than a full repo copy. Existing ad hoc zip commands can include secrets, node_modules, or unrelated files.

## Users

- Developers handing work to another agent or human.
- Maintainers preparing offline review artifacts.
- CI and support workflows that need a sanitized local bundle.

## V1

- Read git status and diff for staged, unstaged, or branch-vs-base changes.
- Create a deterministic bundle directory with summary.md, diff.patch, changed-files/, manifest.json, and redaction report.
- Denylist secret-looking paths and large generated folders by default.
- Support JSON output and --check mode.
- Include fixtures, tests, and a CLI smoke that builds a bundle from a sample repo.

## Non-goals

- Cloud uploads.
- Replacing git format-patch.
- Perfect secret detection.

## Safety

Local output only. Refuse to include ignored files or denylisted secret paths unless explicitly overridden.

## Attribution

Inspired by local agent handoffs and support bundles, reframed as a repo-native review artifact creator with conservative privacy defaults.
