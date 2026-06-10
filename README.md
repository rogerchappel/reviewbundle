# reviewbundle

Turn local git changes into a deterministic review folder: patch, snapshots, manifest, summary, and a redaction report. It is for the moment when a reviewer needs the shape of the change without getting your whole repo, your build output, or your secrets.

Small tool. Sharp edges sanded down. No cloud account required.

## Install

```sh
npm install -g reviewbundle
```

From source:

```sh
npm install
npm run build
node dist/src/cli.js --help
```

## Use

Bundle the current repo changes:

```sh
reviewbundle --output ./reviewbundle-output
```

Check safety rules without writing files:

```sh
reviewbundle --check --json
```

Bundle only staged changes:

```sh
reviewbundle --mode staged --output ./reviewbundle-output --force
```

Compare a branch against `main`:

```sh
reviewbundle --mode branch --base main --output ./reviewbundle-output
```

## Output

- `summary.md`: review-friendly overview.
- `diff.patch`: tracked git diff.
- `changed-files/`: included working-tree snapshots.
- `manifest.json`: deterministic metadata for tools.
- `redaction-report.json`: safety findings.

## Safety

ReviewBundle refuses secret-looking paths such as `.env.local`, private keys, `secrets/`, cloud credential folders, `.ssh/`, `.git/`, `node_modules/`, `dist/`, `build/`, and `coverage/`. It also refuses to overwrite an existing output directory unless `--force` is set.

Use `--allow-secret-paths` only for private local workflows where the reviewer is allowed to see those files. ReviewBundle is conservative, not clairvoyant: inspect the bundle before sharing it.

## Verify

```sh
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

`npm run release:check` runs the TypeScript check, compiled test suite, fixture
smoke, and npm pack dry-run used to confirm the release-candidate surface.

## Package Contents

The npm package includes the compiled CLI, README, docs, license, changelog,
contributing guide, and security policy. Run `npm run package:smoke` to inspect
the exact tarball before publishing.

## License

MIT
