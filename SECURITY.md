# Security Policy

## Supported Versions

ReviewBundle is pre-1.0. Security fixes target the latest release and the `main` branch until versioned support is formally defined.

## Reporting a Vulnerability

Please do not report suspected vulnerabilities in public issues, pull requests, or discussions.

Use GitHub private vulnerability reporting when it is available for the repository. If it is not enabled, ask maintainers for a private reporting path before sharing details. Do not include exploit details, secrets, personal data, or sensitive technical details in public messages.

## What to Include

When a private reporting path is available, include:

- A clear description of the issue.
- Affected versions, files, packages, workflows, or configuration.
- Steps to reproduce, proof of concept, or attack scenario when safe to share.
- Potential impact.
- Suggested mitigation, if known.

## Scope

In scope:

- Vulnerabilities in reviewbundle.
- Redaction bypasses that include blocked paths by default.
- Unsafe bundle output behavior, such as writing outside the requested directory.
- Insecure default configuration shipped by this project.
- CI, release, or dependency guidance maintained by this project.

Out of scope:

- General support requests.
- Requests for guaranteed maintenance timelines.
- Issues in unrelated downstream projects.

## Disclosure

Coordinate disclosure with maintainers before publishing vulnerability details.
