# Creating a new site

These are the steps to make a league's own site from PTSite. They are written for a coding assistant (Claude
Code, Gemini CLI or another one) and work as well for a person. Follow them in order.

A **site** is a small repository of its own. It holds the league's name and settings, and pins this repository,
the **core**, as a git submodule. It holds no copy of the core's code. [`examples/site`](../examples/site/) is
the smallest one, and the starting point below.

## Rules

- **Never change files inside the core from a site.** A change to the product is made in the core's own
  repository, through a pull request there. The site then moves its submodule to the new version.
- **Never put a league's name, people or host into the core.** They belong to the site. The core's
  `php core/deploy/check-forbidden.php --list <the site's list>` fails on them: keep that list in the site's
  repository, one word per line, with `*` before a word that must match inside longer words too (the site's
  name, its host).
- **Ask before anything that leaves the machine:** creating a repository on GitHub, pushing, deploying.
- **Never run `migrate:fresh`, `db:wipe` or a seeder on a real site's database.** They are for development.

## 1. Ask the owner

Ask these before creating anything. Offer the default where there is one.

| Question | Goes to | Default |
|---|---|---|
| The site's name | `site.json`: `name` | none |
| A short form for the phone header, a few letters | `shortName` | the name |
| A line below the name on the login screen | `tagline` | none |
| The first word of a night's title ("Liga - 14/03/2026") | `nightTitlePrefix` | the short name |
| One character as the logo | `logo` | `♠` |
| The main color, as `#rrggbb`, dark enough for white text | `brandColor` | `#14532d` |
| The money, as an ISO 4217 code | `currency` | `BRL` |
| The time zone of the league | `timeZone` | `America/Sao_Paulo` |
| The site's own domain, if it has one | `siteDomain` | none |
| Does a night set money aside for a Main Event ("Pote ME")? | `features`: `mainEventPot` | yes |
| Does a night set money aside for a year party ("Time chip")? | `features`: `timeChip` | yes |
| Should admins plan a season's dates at once, leaving out holidays ("Planejar datas")? | `features`: `seasonPlanner` | yes |
| Does the league end each season with a Main Event, a final game with no points? | `features`: `mainEvent` | no |
| The holidays a new database starts with | `PTSITE_HOLIDAY_PRESET` in `.env` | `sao-paulo`; empty for none |
| A table prefix, when the database is shared with another site | `DB_TABLE_PREFIX` in `.env` | none |
| A short name for the deploy package, in lowercase | `packageName` | `ptsite` |
| The folder and name of the new repository | | the name in lowercase, with `-site` |
| The version of the core to pin | the submodule | the core's newest tag |

Also ask the language: `locale` is `pt-BR` for Brazilian Portuguese, or `en` (or `en-US`, `en-GB`) for English.

## 2. Make the repository

```
mkdir <site> && cd <site>
git init -b master
git submodule add <address of the core repository> core
git -C core checkout <tag>
```

Copy the example site out of the core, then leave the core alone:

```
cp -r core/examples/site/backend core/examples/site/site core/examples/site/Taskfile.yml .
rm -rf site/public/icons
```

Then change three things, all outside `core/`:

1. **`Taskfile.yml`:** set `CORE: 'core'`.
2. **`backend/composer.json`:** set the path repository's `url` to `../core/backend`, and `name` and
   `description` to the site's.
3. **`backend/.env.example`:** set `APP_NAME` (it names the session cookie), `DB_DATABASE`, `DB_TABLE_PREFIX`
   and `PTSITE_HOLIDAY_PRESET` from the answers.

Add a `.gitignore` at the top with `local/`, and a `README.md` that says which league this is and how to run
it (`task setup`, `task serve`).

## 3. Write the site folder

Write `site/site.json` from the answers. Every setting is explained in the core's
[`site/README.md`](../site/README.md).

Write the four features in `features` with the owner's answers, `true` or `false`, so the choice can be read in
the file: `"features": { "mainEventPot": true, "timeChip": false, "seasonPlanner": true, "mainEvent": false }`. The same README lists
what each one turns off.

Delete `site/theme.css` unless the owner wants to change a design token
other than the main color.

Then draw the app icons on the site's color:

```
task frontend:install
task icons
```

`task icons` needs Playwright's browser once: `npx playwright install chromium` in `core/frontend`. The build
stops with a plain message when a setting is wrong, for example a main color too light for the text on it.

## 4. Run it

MySQL must be running. The core's `compose.yaml` has one for development: `docker compose -f core/compose.yaml
up --detach --wait`.

```
task setup        # PHP packages, .env, frontend packages, database, first build
task db:demo      # optional: the invented demo league and the logins dev-admin, dev-keeper, dev-player
task serve        # http://127.0.0.1:8000/app/
```

The password of the three demo logins is `password`. A real site skips `task db:demo`: its first admin is made
once with `php artisan tinker`, and the league's data is entered on the site.

## 5. Check it

- `task verify` reports no problem.
- The login screen shows the site's name, tagline and logo, in its main color.
- The browser tab shows the site's name, and `http://127.0.0.1:8000/app/manifest.webmanifest` has the name and
  `theme_color`.
- With the demo league: log in as `dev-player` and open "Classificação" and a night. Money shows in the site's
  currency and dates in its time zone.

## 6. Commit

Commit everything except `backend/.env`, `backend/vendor`, `backend/public/app` and `local/`. Commit
`backend/composer.lock`: it fixes the versions the site runs. The submodule is committed as a pointer to the
core's version.

## Later

- **A new version of the core.** `git -C core fetch --tags && git -C core checkout <new tag>`, then
  `composer update rrgmc/ptsite --with-dependencies` in `backend/`, `task frontend:install`, `task db:up` and
  `task build`. Read the core's release notes first. Commit the submodule and `composer.lock` together.
- **Rewording a text of a screen.** Add `site/messages.json` with only the texts to change, in the shape of
  `core/frontend/src/i18n/pt-BR` (the core's `site/README.md`). Then `task build`.
- **Rewording a message of the API.** Add `backend/lang/pt_BR/rules.php` (or `auth.php`, `validation.php`)
  with only the lines to change. The site's own `lang` folder comes before the core's.
- **Site-only backend code.** Add a service provider under `backend/app/`, name it in
  `backend/bootstrap/providers.php` and add `"autoload": {"psr-4": {"App\\": "app/"}}` to
  `backend/composer.json`. Keep it small: what every league needs belongs in the core.
- **Deploying.** The core's scripts in `core/deploy/` upload a package to a cPanel shared host
  ([architecture/deployment.md](architecture/deployment.md)). They read the host's settings from
  `local/deploy.env` and secrets from `local/keys.md`, both ignored by git. `task package` builds the package
  from the site's repository into `local/build/<packageName>.zip`: the site's `backend/`, with the core copied
  into its `vendor/` folder and the frontend built for the site. `php core/deploy/upload.php
  local/build/<packageName>.zip --migrate` uploads it. Ask the owner before the first upload.
