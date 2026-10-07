# PTSite

PTSite stands for Poker Tournament Site. It is the core of a poker home-game league website: a Laravel API and
a React single-page app. Several leagues can use it, each through its own site repository.

These are the rules for anyone working in this repository, people and coding assistants alike. Claude Code
reads them through `CLAUDE.md` and Gemini CLI through `GEMINI.md`; both files only import this one. Other
assistants that read `AGENTS.md` pick it up directly. Change the rules here, never in those two files.

## Core and sites

This repository is the shared core. A league uses it by making its own **site repository**. That repository:

- pins this one as a git submodule;
- sets the league's name, logo, language, money, time zone and main color in one file, `site/site.json`
  (settings: [`site/README.md`](site/README.md)), which both the backend and the frontend read;
- has a thin Laravel app that requires `backend/` here as the Composer package `rrgmc/ptsite`;
- holds the league's data, its deploy target and its history;
- holds any importer for data from an older site.

[`examples/site`](examples/site/) is the smallest site, and CI builds it. **To create a new site, follow
[`docs/new-site.md`](docs/new-site.md).** Claude Code has it as the skill `new-site` and Gemini CLI as the
command `/new-site`; both only point to that file.

`backend/` and `frontend/` here also run alone, as the demo site of the `site/` folder at the top. Code must
never depend on that: a setting a site needs goes in `site.json` or `backend/config/ptsite.php`
([`docs/architecture/backend-layers.md`](docs/architecture/backend-layers.md), "A package and an app in one
folder").

Nothing site-specific may be committed here: no real league, host or deploy target, and no member of a real
league (not even in an example). Worked examples use invented names and the invented domains
`ligademo.example`, `inventado.example`, `semdominio.example` and `example.com`.

`php deploy/check-forbidden.php --list <file>` checks it. **The words to refuse are not in this repository**:
writing them here would put them here. Each site keeps its own list, with its name, its host and its players,
and runs the check on the core with it. Here, CI runs the check without a list, which only refuses an image
that `deploy/forbidden-allow.txt` does not name.

The demo league's players are named after champions of the World Series of Poker Main Event. The names are
public; the results are invented. Write nothing about them but public facts.

## Status

- The stack and way of working are chosen but not yet proven. Every decision is an ADR with status
  **Proposed**: see `docs/decisions/README.md`, which also lists what is not decided yet.
- In short: a Laravel API-only backend (`backend/`), a React + TypeScript single-page app, mobile first
  (`frontend/`), one repository, and shared hosting.
- The code covers: login, the password link by email ("Esqueci minha senha"), standings, results, running nights
  (schedule, edit, open, finish, correct, quick add, partial result), attendance (ALL IN / FOLD), the season
  planner (a calendar) with its holiday table, the season calendar, the simulator, the statistics, the players'
  pages with their statistics and memo, the admin section and the audit log.
- The development data is an invented demo league (`backend/database/seeders/DemoLeagueSeeder.php`).
- Tables keep a `legacy_id` column, and login upgrades old MD5 password hashes, to support data imported from an
  older site. The importer itself is not part of the core.
- A mobile app wrapper is not part of the core.
- How to run it and the tests: `README.md`.

Do not re-argue a Proposed decision without a new reason. To change one, write a new ADR that supersedes it.

## Branches

- `master` is the default branch. Make every branch from it.
- **Use a git worktree for every piece of work.** Several people and coding assistants often work here at the
  same time, and in one shared checkout they overwrite each other's files and switch each other's branch. Make
  the branch in a folder of its own (`git worktree add -b <name> <dir>`; Claude Code: `EnterWorktree`, which
  uses `.claude/worktrees/`) before the first edit, and leave the main checkout on `master`. Then run
  `task worktree:init` in the new worktree. It copies the ignored files a worktree lacks (`local/keys.md`,
  `local/deploy.env`, `CLAUDE.local.md`, `backend/.env`), gives the worktree its own ports in `local/ports.env` and its own
  database, and runs `task setup`. With offset 100, Laravel is on `:8100`, Vite on `:5273` and the database is
  `ptsite_100`; `frontend/ports.ts` lists the ports.
- **Never push to `master`.** Every change reaches it through a pull request (PR), with no exception for
  admins. Push your branch, open the PR with `gh pr create`, and merge it with
  `gh pr merge --merge --delete-branch --subject "Merge <what changed> into master"`.
- The `pre-push` hook in `.githooks/` refuses a push to `master`. `task setup` turns it on, and
  `task hooks:install` does only that. Never skip it with `git push --no-verify`. GitHub itself does not block
  the push: branch protection is not available for a private repository on a free account.
- **CI tests a change once, on its pull request.** Wait for the checks to pass before merging: `master` does not
  run them again. If `master` moved after the checks ran, bring the branch
  up to date first. A change that touches only `docs/` or `.md` files runs no checks. CI minutes are limited
  (GitHub's free plan), so push a branch when it is ready, not after every commit. Details:
  `docs/architecture/deployment.md` ("Build (CI)").
- **A release is a git tag on `master`, and the tag is the version.** No file holds the version number, so a
  release makes no commit: `task release -- 2.1.0` pushes the tag only, and a workflow builds the package and the
  GitHub release. The footer of every page shows the version. Steps and rules: `RELEASE.md`.

## Data

- `php artisan migrate:fresh --seed` in `backend/` seeds the demo league (`DemoLeagueSeeder`: invented seasons,
  players and places) and creates the development logins `dev-admin`, `dev-keeper` and `dev-player` (password
  `password`). The default database is `ptsite`, `ptsite_<offset>` in a worktree and `ptsite_test` in the tests.
- **The database is MySQL 5.7**, the shared host's version, in development and tests too. It runs in Docker
  (`compose.yaml`, project `ptsite`), one server for every checkout, with its data in memory: it is lost when the
  container stops. The same file runs Mailpit, which catches the mail sent in development
  (http://127.0.0.1:8025). `task db:up` starts it and seeds the development database again; `task dev` and the
  test tasks start it themselves. The tests use databases of their own. Details:
  `docs/architecture/overview.md` ("Development database").

## Docs layout

| Folder | What goes there | Changes? |
|---|---|---|
| `docs/decisions/` | Architecture decision records, one per decision | Only the status changes |
| `docs/architecture/` | How the system is built now | Kept up to date with the code |
| `docs/specs/` | Plain-language rules of the site, owned by the designer/PM | Kept up to date with the code |

Screenshots of the demo league go in `docs/screens/`. **When a screen changes, regenerate them** with
`npm run screenshots` in `frontend/` and keep the README in sync.

When a change affects a rule, update the spec, the tests and the code in the same change. Each worked example
in a spec should have a matching test.

## Code conventions

Details and examples are in `docs/architecture/backend-layers.md` (including the steps to add a feature),
`docs/architecture/api.md` and `docs/architecture/frontend.md`.

- **Rules and calculations** go in plain PHP classes in `backend/src/Domain` (`PTSite\Domain`). They must not
  use Laravel (`Illuminate`) or `PTSite\App\` classes.
- **Every change** (create, update, open, finish, import…) goes through an **action class** in
  `backend/app/Actions`. Actions check the policy, call the domain classes, save with Eloquent and write the
  audit log.
- **Models** hold columns, relationships and casts only. **Controllers** call one action or query and return a
  resource. No save hooks with side effects.
- **The API is complete.** Every feature the website offers has an endpoint under `/api/v1`. Permissions are
  enforced by policies in the API, never only in the website.
- **Business rule errors** are `RuleViolation` codes in the domain; their Brazilian Portuguese messages live in
  `backend/lang/pt_BR/rules.php`.
- **The website** uses only the API, through the client generated from the OpenAPI spec. After changing the
  API, run `php artisan scramble:export --path=../frontend/openapi.json` in `backend/` and `npm run api:types`
  in `frontend/`; CI fails if they are out of date.
- **Screens** use components on React Aria and design tokens only (`frontend/src/tokens/tokens.css`), never raw
  colors or sizes. Design at phone width first. Add a Storybook story for every new component or screen state.
- **Before pushing:** `vendor/bin/pint` and `vendor/bin/pest` in `backend/`; `npm run lint`, `npx tsc -b`,
  `npm test` and `npm run build` in `frontend/`. Run the end-to-end tests for screen changes.
- **Task.** `Taskfile.yml` gives the common commands short names ([go-task](https://taskfile.dev)): `task check`
  runs the "before pushing" list, `task api` the two API commands above, and `task --list` shows the rest. When
  a command here changes, change its task too.
- **Texts.** No screen writes a text of its own: every text is in `frontend/src/i18n`, in **Brazilian
  Portuguese and English**, and the API's messages are in `backend/lang/pt_BR` and `backend/lang/en`. Add a
  text to both languages in the same change (`docs/architecture/frontend.md`, "Texts"). `npm run lint` fails on
  a text written in a component. The Portuguese is Brazilian, not European: Brazilian vocabulary and spelling
  (`celular`, not `telemóvel`). Dates, numbers and money are never written by hand: they come from
  `frontend/src/lib/format.ts`, in the site's language, money and time zone.
- **Code is in English:** class, method, variable, table, column, endpoint and JSON field names, website URL
  paths (`/nights/42`, not `/eventos/42`), plus comments and docs.
- **Name.** Write `PTSite` in code namespaces (`PTSite\Domain`) and in prose. Write `ptsite` in lowercase where
  the name must be lowercase: package names, artisan commands and file names (`ptsite-frontend`,
  `ptsite:verify`).


## Glossary

The demo site's screens are in Brazilian Portuguese, and the specs quote them. Code uses English. Use this table
to map one to the other. The English texts of the screens are in `frontend/src/i18n/en`.

| Brazilian Portuguese (screens) | English (code and docs) | Meaning |
|---|---|---|
| Torneio | Season | A series of game nights with its own standings |
| Evento, "Liga - date" | Game night (`Night`) | One evening of poker |
| Main Event, "ME" | Main Event | A special final game; not built yet |
| Local | Place | Where a night happens |
| Pote | Pot | The total money played for on a night |
| Pote ME | Main Event pot (`main_event_pot`) | The money set aside on a night for the Main Event; gives no points |
| Time chip | Time chip (`time_chip`) | The money set aside on a night for the year party: paid with every rebuy and by late arrivals |
| Pontuação | Percentage table | Each scoring position's share of the pot |
| Pessoas pontuam por evento | Scoring positions | How many places earn points (6 so far) |
| Pontos | Points | A player's share of the pot for a night |
| Classificação | Standings | The season ranking by total points |
| Posições | Finishing positions | How often each player finished in each place |
| Simulação | Ranking simulator | "What if" standings for the next night |
| Estatísticas | Statistics | Top ten lists and charts, for one season ("Temporada") or every season ("Geral") |
| Planejar datas | Season planner (`SeasonPlanner`) | Lists a season's regular nights, leaving out holidays |
| Feriado | Holiday | A day with no night; from the holiday table plus changes for one year |
| Emenda | Bridge (`bridge`) | The day after a holiday, a long weekend; no night |
| Calendário | Season calendar | A season's nights and the Fridays left out, on month grids |
| Rodadas | Rounds (`rounds`) | How many nights a season has, usually 26 |
| Frequência, "a cada N semanas" | `every_weeks` | How many weeks apart a season's regular nights are |
| ALL IN / FOLD | Attendance answer (`all_in` / `fold`) | Coming / not coming to a night |
| Confirmados | Confirmed players | Players who answered ALL IN |
| Jogador | Player | A league member |
| Página do jogador | Player's page | One player's profile, memo and statistics, at `/players/<id>` |
| Memo | Memo (`memo`) | A free text about a player, written by admins and shown on the player's page and in the detailed players list |
| Esqueci minha senha, "Nova senha" | Password reset (`PasswordReset`) | A link sent by email to set a new password; it works for 60 minutes and once |
| Ativo / Inativo | Active / inactive player | Currently playing or taking a break |
| Arquivado | Archived player | Hidden everywhere; for mistakes and duplicates |
| Administração | Admin section | Where admins manage seasons, players, places and accounts |
| Abrir / Finalizar | Open / finish a night | Night lifecycle actions |
| Resultado parcial | Partial result (`NightPartialResult`) | The amounts and positions known so far on an open night, filled by active players; the results form starts from it |
| Remarcar / Cancelar | Reschedule / cancel a night | Move a scheduled night to another date and time, or archive it |
| Editar evento | Edit a night (`UpdateNight`) | Change a night's place and description, at `/nights/<id>/edit`; admins only once it is open or finished |
| Responsável | Results keeper | Role that can run nights and enter results |
