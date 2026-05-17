# Safety Notes

ReviewBundle is local-first, but local files can still be sensitive. Treat every bundle as something to inspect before sharing.

## Blocked by Default

- `.env` files and variants.
- Private keys and certificate bundles.
- Paths named `secret`, `secrets`, `credential`, `credentials`, `token`, or `tokens`.
- Cloud credential folders such as `.aws`, `.gcloud`, and `.azure`.
- `.ssh`, `.git`, `node_modules`, `dist`, `build`, and `coverage`.

## Before Sharing

Run `reviewbundle --check --json` first. After creating a bundle, inspect `redaction-report.json`, `manifest.json`, and the `changed-files/` directory.

## Override

`--allow-secret-paths` disables secret-path blocking but still blocks generated folders and git internals. Use it only when the bundle stays in a trusted private workflow.
