# 18. Releases are git tags, and the tag is the version

- Status: Proposed
- Date: 2026-10-04

## Context

A deployed site needs to say which build it runs. Without tags and releases, and with `frontend/package.json`
holding the template's `0.0.0`, a problem report cannot name a version and a deploy cannot be traced to a
commit.

Two rules of this repository shape the choice. `master` changes only through a pull request (PR), and CI
minutes are limited, about 15 for each PR that touches code.

## Decision

- A release is an annotated git tag on `master`, named `vX.Y.Z`.
- The tag is the only place the version is written. The build reads it from git (`git describe --tags`), or
  from `APP_VERSION` where the tag is known but git is not asked, as in the release workflow.
- `task release -- X.Y.Z` checks the checkout and pushes the tag. The tag starts a workflow that builds the
  deploy package and publishes a GitHub release with the package attached.
- The site shows its version in the footer of every page and at `/version.txt`.
- The workflow never uploads to a site. A release is uploaded by hand, with `task deploy:release`, from a site
  repository or a checkout with `local/deploy.env`.

The steps are in [RELEASE.md](../../RELEASE.md).

## Consequences

- A release needs no commit, no PR and no test run, so it costs about 3 CI minutes.
- Every build has a version, also between releases: `v2.1.0-3-gabc1234` names the commit.
- The package of a release is built once, on GitHub, and kept with the release. The site can run exactly that
  file.
- The version cannot be read from the source tree alone. A build from a copy without git history shows `dev`
  unless `APP_VERSION` is set.
- The version is build information, so it has no API endpoint. A client of the API that needs it reads
  `/version.txt`.

## Alternatives considered

- **The version in `frontend/package.json`, raised by a commit.** The commit would need a PR and its 15
  minutes of tests for every release, and the file and the tag could disagree.
- **A calendar version, such as `2026.10.1`.** It says when, which the tag's date already says, and it does
  not tell a fix from a new feature.
- **The commit hash only.** It needs no process, but a hash is hard to say or compare, and gives no release
  notes.
- **The release made on a developer's machine.** No CI minutes, but the package would depend on that machine,
  and nothing would be attached to the release.
