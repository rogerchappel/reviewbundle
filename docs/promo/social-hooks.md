# ReviewBundle Social Hooks

Grounded draft copy for public promotion. Pair these with
`examples/basic-review-demo.sh` so the post points to a reproducible artifact.

## Short Hooks

- ReviewBundle turns local git changes into a review folder with a patch,
  snapshots, manifest, summary, and redaction report.
- The demo creates a temporary repo, makes two changes, and writes the exact
  files a reviewer can inspect.
- Useful angle: hand off the shape of a change without sending an entire repo,
  build output, dependency directories, or known secret-looking paths.

## Video Brief

Run `bash examples/basic-review-demo.sh`, open the printed bundle directory, and
show `summary.md`, `diff.patch`, and `redaction-report.json`. Close by noting
that ReviewBundle is conservative and reviewers should inspect bundles before
sharing them.
