# Basic Review Bundle Demo

This walkthrough creates a throwaway git repository, changes two files, and
uses ReviewBundle to produce a deterministic review folder.

## Run

```bash
npm install
bash examples/basic-review-demo.sh
```

The script builds the local CLI, creates a temporary fixture repo, and writes a
bundle containing:

- `summary.md`
- `diff.patch`
- `manifest.json`
- `redaction-report.json`
- `changed-files/`

## Review Flow

Open `summary.md` first for a human-sized overview, then inspect `diff.patch`
and the snapshots under `changed-files/`. `manifest.json` is the stable machine
entry point for tools that want deterministic file counts and paths.

Use this demo when explaining ReviewBundle as a handoff artifact: it packages
local changes for review without uploading a repository or including build
outputs, dependency folders, or known secret-looking paths.
