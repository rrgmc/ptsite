# API

> Describes the current API. The reasons are in [0003](../decisions/0003-api-first.md). The exact request and
> response shapes are in the generated spec, [`frontend/openapi.json`](../../frontend/openapi.json).
> When the backend runs locally, the same spec is browsable at `/docs/api`.

## Basics

- **Base path:** `/api/v1`. A breaking change means a new version; additions don't.
- **Format:** JSON only. Field names in `snake_case`. Resource names in plural English.
- **Actions with rules** are explicit sub-resources, not generic updates (`/nights/{id}/open`, `/finish`).
- **Create and update** use separate request classes (`SavePlayerRequest` / `UpdatePlayerRequest`), so the spec
  shows which fields are required when creating and that all are optional when updating.

## Endpoints

| Method and path | Who | What |
|---|---|---|
| `POST /login` | anyone | Session login for the website. Body: `username`, `password`, `remember` |
| `POST /tokens` | anyone | Token login for other clients. Body adds `device_name`. Returns `token` |
| `POST /logout` | logged in | Ends the session |
| `GET /me` | logged in | The user, their player, role and `abilities` |
| `PUT /me/password` | logged in | Change the user's own password: `current_password`, `password` (8 characters or more). Answers 204. The user's other API tokens are deleted. Limited like the login |
| `POST /password-resets` | anyone | A forgotten password: sends a link by email. Body: `login` (the username or the email). Returns `email`, the address with most of its name hidden. 422 with a rule when no account matches or the account has no address that may get a link |
| `GET /password-resets/{token}` | anyone | The account behind a password link: `username`, `expires_at`. 422 when the link expired, was used or never existed |
| `POST /password-resets/{token}/complete` | anyone | Sets the new password: `password` (8 characters or more). Answers 204. The link stops working, and every session and API token of the account ends |
| `GET /seasons` | logged in | Seasons, newest first. `updated_since` |
| `GET /seasons/current` | logged in | Newest open, unfinished season (404 if none) |
| `GET /seasons/top-standings` | logged in | Every season that is not archived, newest first, each with the first ten of its standings: `season`, `rows` (as in the standings; empty before the first finished night) and `tied_not_shown` (players left out who have the same total as the last one shown) |
| `GET /seasons/{id}` | logged in | One season with its percentage table |
| `GET /seasons/{id}/standings` | logged in | Standings: `rank` (shared on ties), `player`, `points`, `nights_scored`, `wins` |
| `GET /seasons/{id}/nights` | logged in | Nights oldest first, with results. `status`, `updated_since` |
| `GET /seasons/{id}/night-suggestions` | logged in | Suggested dates for a new night: the next three regular weekdays at the regular time (`starts_at`), leaving out dates that already have a night |
| `GET /seasons/{id}/night-plan` | admin | The season planner: the regular nights from `from` to `to` (Y-m-d; with `count`, stopping at that many planned nights), carrying on the season's rhythm, each with `starts_at`, `included`, `taken` (with `night_id`: every existing night in the range, on any day) and `skip_reason` (`kind`: `holiday`, `bridge` or `carnival`; `holiday`). Saves nothing |
| `GET /seasons/{id}/calendar` | logged in | The season calendar in date order: `kind` `night` (with `night`: `id`, `status`, `place`, `winner`, `pot`, `all_in_count`, `my_answer`) or `no_night` (with `skip_reason`) |
| `POST /seasons/{id}/nights/batch` | admin | Schedule several nights at once, all or none: `starts_at` (a list). Refuses dates that already have a night |
| `POST /seasons/{id}/simulate` | logged in | Simulated standings for `pot` and `positions`. Saves nothing |
| `GET /statistics` | logged in | Statistics of the finished nights of one season (`season`: its id) or, without it, of every season that is not archived: `nights_count`, `pot_total`, `main_event_pot_total`, `time_chip_total`, the top ten lists `total_points`, `nights_scored`, `positions` (one per finishing position), `biggest_pots` and `places` (each with `rows` and `tied_not_shown`; a row has `rank`, shared on ties, a `player`, `night` or `place`, and a `count` or `amount`), `points_progress` (the eight leaders' running totals: `steps` per night, or per season without `season`, and `series`) and `wins_not_shown` |
| `POST /seasons/{id}/nights` | results keeper, admin | Schedule a night |
| `POST /seasons/{id}/nights/import` | results keeper, admin | Record a past night, saved as finished: `starts_at`, `place_id`, `pot`, `main_event_pot`, `time_chip`, `positions` |
| `POST /seasons` / `PATCH /seasons/{id}` | admin | Create or update a season, its `percentages` and its regular night (`schedule_weekday`, `schedule_time`, `schedule_every_weeks`) and `rounds`. Seasons also return `nights_planned` (nights that are not archived) |
| `GET /nights/{id}` | logged in | One night with results, `pot`, `main_event_pot` and `time_chip` (each null until recorded) |
| `PATCH /nights/{id}` | results keeper, admin; admin only once the night is open or finished | "Editar evento": `place_id` (may be `null`), `description` (only the fields sent). Any status; 403 for a cancelled night |
| `POST /nights/{id}/reschedule` | results keeper, admin | "Remarcar" a scheduled night: `starts_at`. 409 if not scheduled; 422 if the day already has a night |
| `POST /nights/{id}/cancel` | results keeper, admin | "Cancelar" a scheduled night: archives it. 409 if not scheduled |
| `POST /nights/{id}/open` | results keeper, admin | Open a scheduled night |
| `POST /nights/{id}/finish` | results keeper, admin | Enter or correct results: `pot`, `main_event_pot`, `time_chip` (decimal strings; the last two may be `"0"`), `positions` |
| `GET /nights/{id}/attendance` | logged in | Answers in the order given: `player`, `answer` (`all_in`/`fold`), `answered_at`, `answered_by` |
| `PUT /nights/{id}/attendance/{player}` | the player; results keeper, admin for anyone | Set an answer: `answer`. Repeating the same answer changes nothing. 422 unless the night is open (`attendance.not_open` while scheduled, `attendance.closed` once finished or archived) |
| `DELETE /nights/{id}/attendance/{player}` | the player; results keeper, admin for anyone | Remove the answer ("Não confirmado"). 422 unless the night is open |
| `GET /nights/{id}/partial-result` | logged in | The open night's partial result ("Resultado parcial"): `pot`, `main_event_pot`, `time_chip`, `positions` (only the ones filled, each with its `player`), `saved_by`, `saved_at`. Every field is empty when nobody saved one |
| `PUT /nights/{id}/partial-result` | active player; results keeper, admin | Save the partial result, replacing all of it: `pot`, `main_event_pot`, `time_chip` (decimal strings or `null`), `positions` (may be empty). 409 unless the night is open. Not audited. Finishing the night deletes it |
| `GET /players` | logged in | Active first, then inactive, each with the `memo`. `search`, `status`, `updated_since`, `archived=1` (admins) |
| `GET /players/{id}` | logged in | One player, with the `memo`. The players inside other answers leave the memo out |
| `GET /players/{id}/statistics` | logged in | One player's statistics over the finished nights of one season (`season`: its id) or, without it, of every season that is not archived: `rank` (by total points among everyone who scored; null if the player did not), `points`, `nights_scored`, `wins`, `positions` (a `count` for every scoring position, zeros included), `seasons` (the player's line in each season's standings, newest first), `results` (the nights scored, newest first) and `points_progress` (`steps` per night, or per season without `season`, and the player's `points` after each) |
| `GET /players/{id}/thumbnail` / `GET /players/{id}/photo` | logged in | The player's small or larger image, as an image file, not JSON. 404 if the player has none. See "Player images" |
| `POST /players/quick-add` | results keeper, admin | New active player by `nickname` |
| `POST /players/{id}/photo` | admin; the player themself | Set the photo and the thumbnail from one picture, replacing the ones there were. `multipart/form-data` with the file in `image`. Returns the player. See "Player images" |
| `DELETE /players/{id}/photo` | admin; the player themself | Remove the photo and the thumbnail. Returns the player |
| `POST /players` | admin | Create a player |
| `PATCH /players/{id}` | admin; the player themself for the profile | Update. The profile is `nickname`, `name`, `email` and `birth_date`. Only admins send `memo`, `status` or `archived`; from anyone else, a request with one of them is refused whole |
| `GET /places` / `POST` / `PATCH /places/{id}` | read: logged in; write: admin | Places, by name: `name`, `address`, `archived`. The list leaves archived places out, unless an admin adds `archived=1`. `PATCH` with `archived` archives or restores |
| `GET /holidays` / `POST` / `PATCH /holidays/{id}` | read: logged in; write: admin | The holiday table: `name`, `scope` (`national`, `state`, `city`), `month` and `day` or `easter_offset`, `first_year`, `last_year`, `archived`. The list leaves archived holidays out, unless an admin adds `archived=1`. `PATCH` with `archived` archives or restores |
| `GET /holiday-calendar/{year}` | logged in | That year's holidays in date order: `date`, `name`, `scope`, `holiday_id`, `cancelled`, `exception_id` |
| `POST /holiday-exceptions` / `DELETE /holiday-exceptions/{id}` | admin | A change for one year: `year` with `holiday_id` (cancel it) or `date` and `name` (an extra holiday); delete to undo |
| `GET /audit-log` | admin | Changes, newest first, 50 per page. `subject_type`, `subject_id` |

`positions` is a list of `{ "position": 1, "player_id": 42 }`. `percentages` is a list of
`{ "position": 1, "percent": 38 }`.

## Player images

A player can have a **thumbnail** (small, shown next to the nickname) and a **photo** (larger). Both are stored
in the database, in the `player_images` table, so they are part of a database backup, survive a deploy and need
no public folder on the host. Only logged-in users can read them.

- A player has `thumbnail_version` and `photo_version`. Each is `null` when the player has no such image.
- The image answers allow caching for a year. Put the version in the URL, such as
  `/players/42/thumbnail?v=3f2a…`. The version changes when the image changes, which makes a new URL.
- The images come from uploads, or from the import of an older site.
- **Only the photo is uploaded.** The API turns the picture upright, cuts it from its middle to 3 wide by 4 tall,
  and stores a photo of 600 × 800 pixels and a thumbnail of 180 × 240, both JPEG
  (`PTSite\App\Support\PlayerPhotoMaker`, [ADR 0016](../decisions/0016-server-side-player-photos.md)). A smaller picture
  is enlarged. There is no route that changes the thumbnail alone, and removing the photo removes both.
- An upload is JPEG, PNG or WebP, at most 8 MB, and between 180 and 4096 pixels a side. A file that passes these
  checks but holds no readable picture is refused with the rule `player.photo.unreadable`.
- The server needs the PHP extensions `gd` (or `imagick`, with `IMAGE_DRIVER=imagick` in `.env`) and `exif`.
- The website shrinks the chosen picture to at most 1600 pixels a side and sends it as JPEG
  (`frontend/src/lib/resizeImage.ts`), only to keep the upload small. Another client may send the picture as it
  is.
- Uploads and removals go to the audit log as `player.image_saved` and `player.image_removed`, with
  `thumbnail_version` and `photo_version` before and after, not the images. Entries from before ADR 0016 have
  `kind` and `version` instead, for one image.

## Data types

- **Money and points:** decimal strings with two places, such as `"840.00"`, never floats. Currency is BRL.
- **Percentages:** integers.
- **Dates and times:** ISO 8601 with the league's offset, such as `"2026-03-14T21:00:00-03:00"`. The app time
  zone is `America/Sao_Paulo`. Plain dates (`starts_on`, `birth_date`) are `YYYY-MM-DD`.
- **IDs:** integers.

## Responses

- A single resource: `{ "data": { … } }`. A list: `{ "data": [ … ] }`.
- The audit log is paginated: `{ "data": [ … ], "meta": { "current_page", "last_page", … }, "links": { … } }`.
- Contact details (`email`, `birth_date`) of a player are only included for admins and the player themself.

## Errors

| Status | When |
|---|---|
| `401` | Not logged in |
| `403` | Logged in, but the role does not allow it |
| `404` | Not found |
| `409` | A state conflict: opening while another night is open, finishing a night that is not open, saving a partial result on a night that is not open |
| `422` | Invalid input, or any other broken business rule |
| `429` | Too many login attempts (10 per minute by default, `LOGIN_THROTTLE`), or too many requests for a password link (5 per minute, `PASSWORD_RESET_THROTTLE`) |

The body always has a Brazilian Portuguese `message`, and `errors` by field when a field is concerned:

```json
{
  "message": "Este jogador já está na 1ª posição.",
  "rule": "night.result.duplicate_player",
  "errors": { "positions.3": ["Este jogador já está na 1ª posição."] }
}
```

`rule` is present for business rules and names the rule, so clients can react to specific cases.

## Auth

- **Website:** `GET /sanctum/csrf-cookie`, then `POST /api/v1/login`. Later requests send the session cookie
  and the `X-XSRF-TOKEN` header. "Remember me" lasts 30 days. Requests from the site's own host always get
  session auth; `SANCTUM_STATEFUL_DOMAINS` adds others, such as the Vite dev server.
- **Other clients:** `POST /api/v1/tokens`, then `Authorization: Bearer <token>`.
- **Legacy passwords:** users imported from an older site log in with their old password once; it is then replaced by a
  modern hash.
- **Forgotten passwords:** `POST /api/v1/password-resets` sends a link to
  `<APP_URL>/app/reset-password?token=<token>`. The token is the only secret: the `password_resets` table keeps
  its SHA-256 hash, for 60 minutes and one use. The website calls `GET /sanctum/csrf-cookie` before the two
  `POST` requests, as for the login. Rules: [accounts-and-roles.md](../specs/accounts-and-roles.md), rule 12.
  Reasons: [0017](../decisions/0017-email-for-password-reset.md).
- **Permissions:** policies in `app/Policies`. `GET /me` returns `abilities` so clients can show or hide
  actions; the API checks every request anyway.

## Keeping the spec and client in sync

```sh
cd backend && php artisan scramble:export --path=../frontend/openapi.json
cd ../frontend && npm run api:types
```

CI fails if either file is out of date.
