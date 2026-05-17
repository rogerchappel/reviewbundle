#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmpdir="$(mktemp -d)"
fixture_repo="$tmpdir/repo"
bundle_dir="$tmpdir/bundle"

cp -R "$repo_root/fixtures/basic-repo" "$fixture_repo"
cd "$fixture_repo"
git init -b main >/dev/null
git config user.email smoke@example.com
git config user.name "Smoke Test"
git add .
git commit -m initial >/dev/null

printf 'export function greet(name) {\n  return "hello, " + name;\n}\n' > src/app.js
printf 'export const smoke = true;\n' > src/smoke.js

cd "$repo_root"
npm run build >/dev/null
node dist/cli.js "$fixture_repo" --output "$bundle_dir" --json >/tmp/reviewbundle-smoke.json

test -f "$bundle_dir/manifest.json"
test -f "$bundle_dir/summary.md"
test -f "$bundle_dir/diff.patch"
test -f "$bundle_dir/changed-files/src/app.js"
test -f "$bundle_dir/changed-files/src/smoke.js"
node -e "const fs=require('node:fs'); const result=JSON.parse(fs.readFileSync('/tmp/reviewbundle-smoke.json','utf8')); if (result.filesIncluded !== 2) process.exit(1)"

printf 'Smoke bundle: %s\n' "$bundle_dir"
