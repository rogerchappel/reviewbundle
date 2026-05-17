# ReviewBundle Tasks

## MVP Complete

- [x] Initialize a TypeScript CLI package.
- [x] Collect staged, unstaged, all, and branch-vs-base git changes.
- [x] Write deterministic local bundle artifacts.
- [x] Block secret-looking paths and generated directories by default.
- [x] Support JSON output, check mode, and force overwrite.
- [x] Add fixture-backed unit and integration tests.
- [x] Add a real CLI smoke using a temporary fixture git repo.
- [x] Document safety behavior and local verification.

## Next

- [ ] Add content-pattern scanning for high-confidence token formats.
- [ ] Add configurable redaction rule files.
- [ ] Add optional archive output after bundle creation.
- [ ] Add CI once the public repository is live.
- [ ] Expand binary file reporting.

## Release Gate

Run:

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```
