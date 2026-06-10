#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmpdir="$(mktemp -d)"
fixture_repo="$tmpdir/repo"
bundle_dir="$tmpdir/reviewbundle-output"

cp -R "$repo_root/fixtures/basic-repo" "$fixture_repo"
cd "$fixture_repo"
git init -b main >/dev/null
git config user.email demo@example.com
git config user.name "ReviewBundle Demo"
git add .
git commit -m initial >/dev/null

mkdir -p src
printf 'export function greet(name) {\n  return `hello, ${name}`;\n}\n' > src/greet.js
printf 'Review notes for the demo bundle.\n' > REVIEW_NOTES.md

cd "$repo_root"
npm run build >/dev/null
node dist/src/cli.js "$fixture_repo" --output "$bundle_dir" --json >"$tmpdir/result.json"

printf 'Bundle directory: %s\n' "$bundle_dir"
printf 'Result summary:\n'
cat "$tmpdir/result.json"
printf '\n\nBundle files:\n'
find "$bundle_dir" -maxdepth 2 -type f | sort
