# The site folder

This folder says which site is built: its name, language, money, time zone and main color. The one here is the
demo site. A league's own repository has its own folder like this one, and points the build at it with
`PTSITE_SITE_DIR`.

| File | What it is for |
|---|---|
| `site.json` | The settings below. Required. |
| `theme.css` | Optional. CSS that changes any design token of `frontend/src/tokens/tokens.css`, such as `:root { --color-accent: #1d4ed8; }`. |
| `public/` | Optional. Files copied over the frontend's `public/` folder, such as the site's own `icons/`. |
| `messages.json` | Optional. The site's own wording for single texts of `frontend/src/i18n`, such as `{"nights": {"mainEventPot": "Pote ME"}}`. |

## `site.json`

| Setting | Example | Meaning |
|---|---|---|
| `name` | `Liga Demo` | The site's name: browser title, menu, login screen, footer, installed app, emails. |
| `shortName` | `Liga` | A short form for the header, where a phone has room for a few letters. Default: `name`. |
| `tagline` | `Liga de pôquer entre amigos` | A line below the name on the login screen and in the signature of emails. Optional. |
| `nightTitlePrefix` | `Liga` | The first word of a night's title: "Liga - 14/03/2026". Default: `shortName`. |
| `logo` | `♠` | One character shown next to the name. Default: `♠`. |
| `locale` | `pt-BR` | The language and the formats of dates and numbers. The texts exist in Brazilian Portuguese (`pt-…`) and English (anything else). |
| `currency` | `BRL` | The ISO 4217 code of the money. It must have two decimal places. |
| `timeZone` | `America/Sao_Paulo` | The time zone of the league. Dates and times are shown in it, whatever the visitor's own. |
| `brandColor` | `#14532d` | The main color, as `#rrggbb`. The hover and soft shades, the browser's theme color and the icon's background are made from it. It must be dark enough for light text on it: the build stops if it is not. |
| `siteDomain` | `example.com` | The site's own domain. An email address on it never gets a password link. Optional. |
| `packageName` | `liga` | The name of the deploy package, `liga.zip`: lowercase letters, digits and hyphens. Default: `ptsite`. |
| `features` | `{ "timeChip": false }` | The features the site turns on or off: see "Features" below. Optional. |

The backend reads the same file (`name`, `tagline`, `locale`, `timeZone`, `siteDomain`, `features`), so the two
ends cannot disagree. The frontend reads it when it is built, so a change needs a new build.

After changing `brandColor` or `logo`, run `npm run icons` in `frontend/`. It draws the app icons again into
`public/icons` of this folder.

## Features

A league that does not use a part of the site turns it off in `features`. Every feature is on unless the site
sets it to `false`, so a site that names none has them all:

```json
"features": { "mainEventPot": false, "timeChip": false }
```

| Feature | What it is | With `false` |
|---|---|---|
| `mainEventPot` | "Pote ME": the money a night sets aside for the Main Event. | The result forms, the night's result and the season totals have no "Pote ME". Finishing a night does not ask for it. |
| `timeChip` | "Time chip": the money a night sets aside for the year party. | The same, for "Time chip". |
| `seasonPlanner` | "Planejar datas": the calendar that schedules a season's regular nights at once. | "Administração" has no "Planejar datas". Nights are scheduled one at a time with "+ Agendar". The holiday table and the season calendar stay. |

The build stops on a name that is not in this table, or on a value that is not `true` or `false`.

Turning a feature off hides it and stops recording it. It deletes nothing: the amounts already recorded stay in
the database, and are shown again when the feature is turned back on.
