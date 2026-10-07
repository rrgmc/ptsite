# Architecture overview

> Describes the current code. The reasons behind each choice are in
> [docs/decisions](../decisions/README.md).

## Components

```
Phone or desktop browser                      Future phone app
  React SPA at /app (frontend/)                 (type not decided)
        │  HTTPS, JSON, session cookie                │  HTTPS, JSON, token
        └──────────────┬──────────────────────────────┘
                       ▼
            Laravel API at /api/v1 (backend/)
                       │
                       ▼
           MySQL 5.7, in production, development and tests
```

- **frontend/**: a React + TypeScript single-page app, mobile first, installable as a PWA. It talks to the
  backend only through the API. It is built into `backend/public/app` and served by Laravel at `/app`. See
  [frontend.md](frontend.md).
- **backend/**: a Laravel 13 app that serves the JSON API and the built SPA from the same domain. See
  [backend-layers.md](backend-layers.md) and [api.md](api.md).
- **Database**: MySQL 5.7, the shared host's version. In development and tests it runs in Docker, see
  [Development database](#development-database). It has foreign keys and unique constraints.
  The schema is in `backend/database/migrations`. Tables for imported data keep a `legacy_id` column; a site that
  migrates from an older site imports with its own importer. Development data comes from the demo league
  (`DemoLeagueSeeder`).

## Request flow

A change, such as a results keeper entering a night's results:

1. The SPA sends `POST /api/v1/nights/{id}/finish` with the pot, the Main Event pot, the time chip and the finishing order.
2. Sanctum identifies the user from the session cookie (or a token, for other clients).
3. A **Form Request** (`FinishNightRequest`) checks the shape of the input.
4. The **controller** calls the `FinishNight` **action**.
5. The action checks the **policy** (results keeper or admin), checks the lifecycle rule with the **domain**
   (`NightRules`), and calls `WriteNightResult`. That class checks the result rules and calculates the points
   (`PointsCalculator`), then saves with Eloquent.
6. The action writes an **audit log** entry with the night before and after, inside the same transaction.
7. The controller returns the night through an **API Resource** (`NightResource`).
8. A broken rule anywhere becomes a `RuleViolation`, rendered as `409` or `422` with a Brazilian Portuguese
   message (see [api.md](api.md)).

A read, such as the standings, goes controller → query class (`SeasonStandings`) → domain (`Standings`) →
resource.

## Development database

The reasons are in [0013](../decisions/0013-mysql-everywhere.md).

- [`compose.yaml`](../../compose.yaml) runs one MySQL 5.7 server in Docker, on `127.0.0.1:3306` (`PTSITE_DB_PORT`), user
  `root`, password `root`. The compose project is named `ptsite`. Every checkout and git worktree uses this same server.
- **Its data is in memory.** It is fast, and everything is lost when the container stops. `task db:up` starts
  the server and, when the development database is missing, creates it and runs the seed. `task dev` does this
  first.
- **Each checkout has its own database,** named in `DB_DATABASE` of `backend/.env`: `ptsite` in the main checkout,
  and `ptsite_<port offset>` in a worktree, set by `task worktree:init`.
- **The tests use databases of their own.** `DB_DATABASE_SUFFIX` is added to the name: `_test` for Pest
  (`phpunit.xml`), and `_e2e_phone`, `_e2e_desktop` and `_screenshots` for the servers the
  frontend scripts start. So tests never touch the development data.
- `php artisan ptsite:prepare-database` creates the configured database when the server lacks it. The tests and
  the frontend scripts call it themselves; they only need the server to be running (`task db:start`).

| Command | What it does |
|---|---|
| `task db:start` | Starts the server and waits until it answers |
| `task db:up` | `db:start`, then creates and seeds the development database if it is missing |
| `task db:reset` | Recreates the development database with the demo league and the dev logins |
| `task db:stop` | Stops the server; every database in it is lost |

## Development mail

`compose.yaml` also runs [Mailpit](https://mailpit.axllent.org), which catches the mail the site sends in
development, so nothing reaches a real mailbox. It starts and stops with MySQL.

- `backend/.env.example` sends mail to it: `MAIL_MAILER=smtp`, `127.0.0.1:1025` (`PTSITE_MAIL_PORT`; the web
  page is on `PTSITE_MAIL_UI_PORT`).
- Read the messages at http://127.0.0.1:8025. Every checkout and worktree shares this one inbox.
- The password link in a message is built from `APP_URL`, so it opens the built app on Laravel's port, not the
  Vite dev server. Run `npm run build` in `frontend/` first. `task worktree:init` puts the worktree's own port
  in `APP_URL`.
- Of the development logins, only `dev-admin` has an email, so only it can ask for a link.
- The tests use no mail server: Pest and the end-to-end servers set `MAIL_MAILER=array`.

## Hosting

Shared PHP hosting. CI builds a zip with everything needed, including `vendor/` and the built SPA. See
[deployment.md](deployment.md).
