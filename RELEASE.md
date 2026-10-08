# Releasing PTSite

A release is a version of the core with a number, such as `v2.1.0`. The reasons for the rules below are in
[ADR 0018](docs/decisions/0018-releases-and-versions.md).

## The tag is the version

- A release is an annotated git tag on `master`, named `vX.Y.Z`.
- **No file holds the version.** `frontend/package.json` says `0.0.0` and stays that way. A release makes no
  commit and needs no pull request (PR), and `master` is never pushed.
- The build reads the version from git (`git describe --tags`). The footer of every page shows it, and so does
  `/version.txt` on a deployed site.
- Between releases the version names the last tag, the number of commits since, and the commit:
  `v2.1.0-3-gabc1234`. `-dirty` at the end means the build had uncommitted changes.

## Which number

| Change since the last release | Raise | Example |
|---|---|---|
| Fixes only | Patch (Z) | `v2.1.0` to `v2.1.1` |
| A new feature or screen | Minor (Y), patch back to 0 | `v2.1.3` to `v2.2.0` |
| A change that needs work in site repositories | Major (X) | `v2.4.0` to `v3.0.0` |

The API has its own version, in its path (`/api/v1`). A site repository pins the core at a release tag.

## Steps

1. Merge everything the release needs into `master`, each change through its PR with the checks passed.
2. In a checkout that is on `master`, clean and up to date (`git pull`), run:

   ```
   task release -- 2.1.0 --dry-run
   task release -- 2.1.0
   ```

   [`deploy/release.php`](deploy/release.php) refuses when the checkout is not on `master`, has changes, or is
   not the `master` on GitHub, and when the number is not above the latest release. It then makes the tag and
   pushes the tag only. With `--dry-run` it checks and changes nothing.
3. The tag starts [`release.yml`](.github/workflows/release.yml). It builds the deploy package with the tag as
   its version and publishes the GitHub release, with notes made from the merged PRs and `ptsite-vX.Y.Z.zip`
   attached. Follow it with `gh run watch`, then look at `gh release view v2.1.0`.
4. To put the release on a site, set `local/deploy.env` and run `task deploy:release -- v2.1.0`. It downloads
   that zip and uploads it like `task deploy` (see [deployment.md](docs/architecture/deployment.md)).
   `task deploy:release:ftp -- v2.1.0` does the same over FTP, without the cPanel API token. The workflow never
   uploads to a site.
5. Check `https://example.com/version.txt` (the address of the site) and the footer.

## Rules

- Never move or delete a published tag. To correct a release, release the next patch version.
- Never tag a commit that is not on `master`. The workflow refuses such a tag.
- A release takes about 3 minutes of CI (see "Build (CI)" in deployment.md).
