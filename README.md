# PTSite

PTSite (Poker Tournament Site) is the core of a poker home-game league website: a Laravel API (`backend/`) and
a React single-page app (`frontend/`). It keeps seasons, game nights, results, standings and statistics.

A league does not fork this repository. It makes its own small **site repository** that pins this one as a git
submodule, and that holds the league's name, settings, data and deploy target. See "Core and sites" in
[AGENTS.md](AGENTS.md).

- **Start with [docs/](docs/)**: the decisions in [docs/decisions/](docs/decisions/README.md), how the system is
  built in [docs/architecture/](docs/architecture/overview.md), and the rules of the site in
  [docs/specs/](docs/specs/README.md).
- **Rules for contributors and coding assistants** are in [AGENTS.md](AGENTS.md). Claude Code and Gemini CLI
  load it automatically (through `CLAUDE.md` and `GEMINI.md`).

## Screenshots

The demo site in English, with the invented demo league. The demo site itself is in Brazilian Portuguese, and
so are the names in its data. Regenerate them with `npm run screenshots` in `frontend/` when a
screen changes (it needs bash and PHP on the path). Native date and time fields follow each device's settings;
the screenshot browser shows them in US format.

|  |  |  |
|---|---|---|
| <img src="docs/screens/01-standings.png" width="240" alt="Standings of a finished season"> | <img src="docs/screens/02-attendance.png" width="240" alt="Attendance: ALL IN / FOLD"> | <img src="docs/screens/03-night-dashboard.png" width="240" alt="The night dashboard: who paid what"> |
| Standings of a finished season | Attendance: ALL IN / FOLD | The night dashboard: who paid what |
| <img src="docs/screens/04-result-form.png" width="240" alt="Entering a result"> | <img src="docs/screens/05-night-finished.png" width="240" alt="A finished night"> | <img src="docs/screens/06-simulator.png" width="240" alt="Simulator"> |
| Entering a result | A finished night | Simulator |
| <img src="docs/screens/07-calendar.png" width="240" alt="Season calendar"> | <img src="docs/screens/08-main-event.png" width="240" alt="The Main Event of a season"> |  |
| Season calendar | The Main Event of a season |  |

## What is here

| Folder | What |
|---|---|
| `backend/` | Laravel 13 API at `/api/v1`, the league rules in `src/Domain`, the demo league seeder |
| `frontend/` | React + TypeScript single-page app, served by Laravel at `/app`, plus Storybook |
| `site/` | The demo site's folder: its name, logo, language, money, time zone and main color (`site.json`) |
| `examples/site/` | The smallest site built on this repository |
| `deploy/` | Scripts that build the deploy package and upload it to a cPanel shared host |
| `docs/` | Decisions, architecture and specs |

## Making your own site

A league does not fork this repository. It makes a small repository of its own, which pins this one as a git
submodule and holds the league's settings. The steps are in [`docs/new-site.md`](docs/new-site.md). A coding
assistant can do them: ask it to "create a new site".

## Installing on a phone

The site installs from the browser as an app: in Chrome on a phone, open the menu and choose "Adicionar à tela
inicial", then "Instalar". Details: `docs/architecture/frontend.md` ("Installing on a phone").

## Running it locally

Requirements: PHP 8.3+ with `pdo_mysql`, `gd` and `exif`, Composer, Node.js 24, and Docker for the MySQL server.

```sh
# The database: MySQL 5.7 in Docker, on 127.0.0.1:3306
docker compose up --detach --wait

# Backend, with the demo league and three development logins
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan ptsite:prepare-database  # creates the database named in .env
php artisan migrate:fresh --seed     # seeds the demo league and creates dev-admin, dev-keeper, dev-player
php artisan serve                    # http://127.0.0.1:8000

# Frontend, in another terminal
cd frontend
npm ci
npm run dev                          # http://localhost:5173/app/ (calls the backend on :8000)
```

Log in with `dev-admin`, `dev-keeper` (results keeper) or `dev-player`, password `password`. These logins exist
only in development.

The MySQL server keeps its data in memory, so the database is lost when its container stops. `task db:up` (or
the two `php artisan` lines above, with `migrate --seed`) makes it again. See
[Development database](docs/architecture/overview.md#development-database).

The same Docker file runs Mailpit, which catches the mail the site sends (the "Esqueci minha senha" link). Read
it at http://127.0.0.1:8025. See [Development mail](docs/architecture/overview.md#development-mail).

To see the site as it will be deployed, run `npm run build` in `frontend/` and open
http://127.0.0.1:8000/ (Laravel serves the built app).

### Shortcuts with Task

[Task](https://taskfile.dev) (go-task) is optional. [Taskfile.yml](Taskfile.yml) gives the commands on this page
short names that work from any folder of the repository, in PowerShell, Git Bash and Linux. `task --list` shows
them all.

| Command | What it does |
|---|---|
| `task setup` | The setup steps above, for the backend and the frontend |
| `task worktree:init` | In a new git worktree: copies the ignored files from the main checkout, picks ports and a database no other worktree uses, then runs `task setup` |
| `task hooks:install` | Turns on the git hooks in `.githooks`. `task setup` runs it. The `pre-push` hook refuses pushes to `master`, which only changes through a pull request (see [AGENTS.md](AGENTS.md), "Branches") |
| `task dev` | Starts MySQL, then runs the backend and the frontend dev server together |
| `task db:up`, `task db:reset`, `task db:stop` | Starts MySQL and Mailpit and seeds the database if it is missing; recreates the database; stops both |
| `task build` | Builds the frontend into `backend/public/app` |
| `task check` | Everything to run before pushing: style, types, unit tests, build |
| `task test`, `task test:e2e` | The unit tests; the end-to-end tests, phone and desktop at once (one file: `task test:e2e -- tests/admin.spec.ts`) |
| `task api` | Regenerates `frontend/openapi.json` and the API types |
| `task package`, `task deploy` | Builds the deploy package; uploads it to the site configured in `local/deploy.env` (see [deployment.md](docs/architecture/deployment.md)) |
| `task release -- 2.1.0` | Releases a version: tags `master` and pushes the tag, which builds the package and the GitHub release (see [RELEASE.md](RELEASE.md)) |
| `task deploy:release -- v2.1.0` | Uploads the package of a release to the configured site |
| `task deploy:release:ftp -- v2.1.0`, `task deploy:ftp:check` | The same over FTP, without the cPanel API token; checks the FTP account, changing nothing |
| `task deploy:mail` | Writes the mailbox settings into the `.env` on the configured site, so the site can send email |

## Tests

The backend and end-to-end tests need the MySQL server running; they create their own databases in it.

```sh
cd backend && vendor/bin/pest                 # domain rules, architecture, API, the demo league
cd frontend && npm test                        # unit tests
cd frontend && npm run build && npm run test:e2e              # Playwright, phone and desktop, with axe
cd frontend && npm run test:e2e:parallel       # the same tests, phone and desktop at the same time (CI runs this)
cd frontend && npm run build-storybook && npm run test:storybook   # every story, with axe
cd frontend && npm run storybook               # browse components and screens on :6006
```

CI runs them on every pull request ([.github/workflows/ci.yml](.github/workflows/ci.yml)). Nothing runs after
the merge into `master`: a pull request merges only when they passed on a branch that is up to date. CI builds the zip for shared hosting only when started by hand, and never uploads it. The reasons are in
[deployment.md](docs/architecture/deployment.md) ("Build (CI)").

## Author

Rangel Reale (<realerangel@gmail.com>)
