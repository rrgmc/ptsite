# Example site

The smallest site built on PTSite. It shows what a league's own repository holds for the backend, and CI builds
it to prove that the package works outside its own app.

```
backend/
  composer.json           requires rrgmc/ptsite, here through a path repository to ../../../backend
  artisan
  bootstrap/app.php       calls PTSite\App\Bootstrap for the middleware and the error rendering
  bootstrap/providers.php empty: Composer registers the package's provider
  config/app.php          Laravel's usual file: name, time zone and language from .env
  public/                 index.php and .htaccess; the built single-page app goes in public/app
  storage/
  .env.example            the holiday preset, the database and the table prefix
site/
  site.json               the site's name, logo, language, money, time zone and main color
  theme.css               its changes to the design tokens
  public/icons/           its app icons, drawn by `npm run icons`
```

There is no `app/`, `routes/`, `database/` or `lang/` folder: all of that comes from the package. A site adds
one only for what it changes, for example `lang/pt_BR/rules.php` to reword a message.

## Running it

MySQL must be running (`task db:start` at the top of this repository).

```
cd examples/site/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan ptsite:prepare-database
php artisan migrate
php artisan db:seed --class='PTSite\Database\Seeders\DatabaseSeeder'
php artisan ptsite:verify
php artisan serve
```

`DatabaseSeeder` seeds the demo league and the logins `dev-admin`, `dev-keeper` and `dev-player` (password
`password`). The tables are named `ex_players`, `ex_nights` and so on, because `.env.example` sets
`DB_TABLE_PREFIX=ex_`.

## The frontend

`site/` is this site's folder: its name, logo, language, money, time zone and main color in `site.json`, a
change to two design tokens in `theme.css`, and its own app icons in `public/icons` (see
[`site/README.md`](../../site/README.md) at the top of this repository). The frontend is built for it from the
core's `frontend/` folder:

```
cd frontend
PTSITE_SITE_DIR=../examples/site/site PTSITE_OUT_DIR=../examples/site/backend/public/app npx vite build
```

In PowerShell, set the two variables with `$env:PTSITE_SITE_DIR = '..\examples\site\site'` first. After the
build, `php artisan serve` in `backend/` shows "Clube Exemplo" in blue at `/app/`.
