# 13. MySQL 5.7 in development, tests and CI

- Status: Proposed
- Date: 2026-10-03

## Context

SQLite is the easy choice for development and tests, with MySQL only in production. The usual shared host offers
MySQL 5.7 ([0007](0007-shared-hosting.md)), and the real site will use it. The two databases differ:
MySQL compares text without regard to case or accents, checks column lengths and types strictly, and 5.7 lacks
features of newer versions. A difference found only on the host is found too late.

On a development machine where Docker runs on a slow disk, a MySQL seed with its data on that disk can take
minutes; SQLite takes a few seconds.

## Decision

- Use **MySQL 5.7** everywhere: development, the Pest tests, the end-to-end tests and CI. This replaces SQLite.
- Run it in **Docker**, from `compose.yaml` at the repository root. PHP and Node.js still run on the machine
  itself.
- Keep the server's data **in memory** (tmpfs). The development database holds only the demo league and the dev
  logins, so it can be made again at any time: `task db:up` creates and seeds it when it is missing.
- **One server for every checkout.** The compose project name is fixed, and each checkout has its own database:
  `ptsite` in the main checkout, `ptsite_<port offset>` in a git worktree. The tests add a suffix to that name:
  `_test` for Pest, `_e2e_phone`, `_e2e_desktop` and `_e2e_subpath` for the end-to-end servers.

## Consequences

- The tests run on the database the site will use.
- Docker must be running to develop and to run the backend and end-to-end tests.
- The Pest suite is slower than on in-memory SQLite, and the seed takes a few seconds.
- Everything in the development database is lost when the container stops, including data entered by hand.
- CI starts the same image as a service, also with its data in memory.
- Nothing runs on SQLite. The `sqlite` connection in `config/database.php` is Laravel's stock entry and is
  unused.

## Alternatives considered

- **Keep SQLite for the tests, MySQL only for development.** The fastest tests, but they would keep checking a
  database the site does not use.
- **MySQL installed on the machine.** No Docker needed, but each contributor would install and configure it by
  hand, and version 5.7 is no longer offered by the usual installers.
- **MySQL data on a Docker volume.** The development data would survive a restart, but on a slow disk every
  seed and test run takes minutes.
- **A newer MySQL, or MariaDB.** Would not match the host.
