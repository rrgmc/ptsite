# PTSite backend

The API of PTSite, a poker home-game league site. It is a Laravel app with no pages of its own: the website is
the single-page app in [`../frontend`](../frontend), which uses only this API.

This folder is two things at once:

- **A Composer package, `rrgmc/ptsite`.** A league's own Laravel app requires it and gets the API, the
  migrations, the messages and the commands.
- **The package's own app.** The usual Laravel files next to it make the package run alone, for development,
  the tests and the demo league.

[`docs/architecture/backend-layers.md`](../docs/architecture/backend-layers.md) explains both, and the steps to
add a feature.

## What is where

| Folder | What it holds |
|---|---|
| `src/Domain` | The rules and calculations, in plain PHP. No Laravel |
| `app/Actions` | Every change: one class each, which checks the policy, saves and writes the audit log |
| `app/Queries` | What the API reads |
| `app/Http` | Controllers and resources. The endpoints are under `/api/v1` |
| `app/Policies` | Who may do what |
| `config/ptsite.php` | The settings a site may change |
| `lang` | The API's messages, in Brazilian Portuguese and English |
| `database` | Migrations, factories and the demo league's seeder |
| `tests` | Domain tests, API tests and architecture tests |

The endpoints are listed in [`docs/architecture/api.md`](../docs/architecture/api.md).

## Running it

The steps are in the [README at the top](../README.md) ("Running it locally" and "Tests"). In short, with the
database running (`task db:up`):

```sh
composer install
cp .env.example .env && php artisan key:generate
php artisan ptsite:prepare-database # creates the database named in .env
php artisan migrate:fresh --seed    # the demo league and three development logins
php artisan serve
vendor/bin/pint                     # code style
vendor/bin/pest                     # tests
```

After changing the API, run `php artisan scramble:export --path=../frontend/openapi.json` here and
`npm run api:types` in `../frontend`.

## License

MIT. See [`LICENSE`](../LICENSE).
