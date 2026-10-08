# Deployment

> The reasons are in [0007](../decisions/0007-shared-hosting.md). This page describes the generic procedure. A
> league's own site repository holds its real settings: the address, the host, the accounts and the history of
> its deploys. Names such as `example.com`, `~/liga-app` and `<cpanel user>` are placeholders.

The target is a cheap shared PHP host with cPanel. Such a host usually has no SSH, no Composer and no Node.js,
so the site is built on a developer's machine or in CI and uploaded as a zip.

## Build (CI)

The tests of one pull request take about 6 minutes, in seven jobs.
[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs each thing once, and nothing it does not need:

| When | What runs |
|---|---|
| A pull request | The tests: backend, frontend, Storybook in two jobs, end to end in two jobs |
| A push to `master`, which is a merged pull request | Nothing. The pull request already ran the tests |
| A change that touches only `docs/` or `.md` files | Nothing |
| Started by hand (`gh workflow run ci.yml`, or "Run workflow" on GitHub) | The `package` job only |
| A version tag (`vX.Y.Z`) is pushed | [`release.yml`](../../.github/workflows/release.yml), about 3 minutes. See "Releases" |

The backend job also runs `php deploy/check-forbidden.php`. It names no word itself: without a list it refuses
only an image that `deploy/forbidden-allow.txt` does not name. A site runs the same script on the core with its
own list of names (`--list`), in its own CI.

The tests on a pull request run on its merge with `master` as it was then. If `master` moved since, bring the
branch up to date before merging, so that the tests cover what `master` will hold.

CI never uploads to a site. The `package` job, "Build the deploy package (not uploaded)", only stores a zip. It
runs only when started by hand, because deploys normally use `task deploy`, which builds the same package on
your machine. When started by hand, it:

1. `composer install --no-dev --optimize-autoloader` in `backend/`.
2. `npm ci && npm run build` in `frontend/`, which writes the SPA into `backend/public/app`.
3. Zips `backend/` (including `vendor/` and `public/app`, excluding `.env`, SQLite files, logs and tests) as the
   artifact `ptsite-deploy-<commit>`.

The artifact is kept for 3 days.

## Releases

A release is a git tag `vX.Y.Z` on `master`, and the tag is the version
([ADR 0018](../decisions/0018-releases-and-versions.md)). The steps for a person are in
[RELEASE.md](../../RELEASE.md). This section says how it works.

**Where the version comes from.** No file holds it. Each build asks for it in this order:

1. The environment variable `APP_VERSION`, when set.
2. `git describe --tags --always --dirty`: `v2.1.0` on a tag, `v2.1.0-3-gabc1234` three commits after it, and
   only the commit when no tag exists.
3. `dev`, when git gives no answer.

`frontend/vite.config.ts` does this for every frontend build and puts the answer in the constant
`__APP_VERSION__`, which the footer shows. [`deploy/build-package.php`](../../deploy/build-package.php) does the
same for a package, passes the answer to the frontend build, and writes it to `public/version.txt`. So
`https://example.com/version.txt` tells which build the site runs.

**What a tag starts.** [`release.yml`](../../.github/workflows/release.yml) runs when a `vX.Y.Z` tag is pushed:

1. It refuses a tag whose commit is not on `master`.
2. It runs `deploy/build-package.php` with `APP_VERSION` set to the tag. This is the script `task package`
   runs, so both packages are built the same way.
3. It publishes the GitHub release, with notes made from the merged pull requests and the package attached as
   `ptsite-vX.Y.Z.zip`. A release asset does not count against the 500 MB of stored artifacts.

It runs no tests: every commit on `master` was tested on its pull request. It does not upload to a site.

**Uploading a release.** `task deploy:release -- v2.1.0` downloads the package of that release and uploads it
from your machine, like `task deploy`. `task deploy:release:ftp -- v2.1.0` does it over FTP.

## Server layout

Many shared hosts fix the main domain's document root at `~/public_html`. So the Laravel app lives in a folder
next to it, and only the contents of `public/` go into the document root. `.env`, `vendor/` and `storage/`
are never reachable from the web.

| | |
|---|---|
| App folder | `~/liga-app`: the whole package and the server's `.env`. The name must end in `-app` (or match `DEPLOY_APP_DIR_PATTERN`) |
| Document root | `~/public_html`: the contents of `public/`, with a generated `index.php` |
| PHP | 8.3 or newer, set for the domain with cPanel MultiPHP |
| Database | MySQL 5.7 or newer with `utf8mb4`, made in cPanel |

- `/` redirects to `/app/`. Laravel serves `public/app/index.html` for every `/app/*` URL, so links such as
  `/app/nights/42` work when opened directly; built assets are served as static files.
- The app is at `/app/`, the API at `/api`, and the build has these paths fixed: the site runs at the root of
  its domain, not in a folder of it.
- PHP on the host needs `exif` and an image extension, for the player photos
  ([ADR 0016](../decisions/0016-server-side-player-photos.md)): `gd`, or `imagick` with `IMAGE_DRIVER=imagick` in
  `.env`. Without them, every photo upload is refused as unreadable, and `storage/logs/laravel.log` names the
  missing software.
- `config:cache` and `route:cache` are not run.

## The `.env` on the server

`.env` lives only on the server. It is made once, by hand or with `php deploy/upload.php <package> --env <file>`.
Production values to set:

| Setting | Value |
|---|---|
| `APP_NAME` | The site's name. The package's `site.json` gives the name shown; this one names the session cookie |
| `APP_ENV`, `APP_DEBUG` | `production`, `false` |
| `APP_KEY` | A new key (`php artisan key:generate --show`) |
| `APP_URL` | The site's address, such as `https://example.com`. The password link is built from it |
| `DB_*` | The MySQL settings from cPanel (`DB_HOST=localhost`) |
| `SESSION_SECURE_COOKIE` | `true`, because the site must be used over HTTPS |
| `LOG_LEVEL` | `warning` |
| `PTSITE_TAGLINE`, `PTSITE_HOLIDAY_PRESET` | The league's settings (`backend/config/ptsite.php`). The holiday preset fills the holiday table of a new database; see [season-planner.md](../specs/season-planner.md) |
| `PASSWORD_RESET_SITE_DOMAIN`, `PASSWORD_RESET_BLOCKED_DOMAINS` | See "Email" |
| `MAIL_*` | See "Email" |

Over HTTP the browser drops the `secure` session and `XSRF-TOKEN` cookies, and logging in fails with "CSRF token
mismatch". Turn on the HTTPS redirect in cPanel for the domain.

A new database starts empty: run `php artisan migrate --force` (see "Running artisan without SSH"). The deploy
never imports data and never empties the database: it holds the live site's data. A site that migrates from an
older site imports its data once, with the importer in its own site repository.

## Settings of the deploy scripts

The scripts in `deploy/` name no host. A site sets these environment variables. The ones that are not secret go
in `local/deploy.env`, which `Taskfile.yml` loads and git ignores.

| Setting | Meaning |
|---|---|
| `DEPLOY_CPANEL_USER` | The cPanel user name |
| `DEPLOY_CPANEL_URL` | The cPanel address, such as `https://cpanel.example.com` |
| `DEPLOY_CPANEL_TOKEN` | The cPanel API token. Or put it on the `cPanel token:` line of `local/keys.md`. It is never printed |
| `DEPLOY_FTP_HOST`, `DEPLOY_FTP_USER`, `DEPLOY_FTP_PASSWORD` | The FTP account, or the `FTP host:`, `FTP user:` and `FTP password:` lines of `local/keys.md` |
| `APP_DIR` | The app folder in the home folder, such as `liga-app`. Required. It must end in `-app`, or match `DEPLOY_APP_DIR_PATTERN` |
| `WEB_DIR` | The document root, in the home folder. Default `public_html` |
| `TARGET_VHOST` | The site's domain in cPanel, such as `example.com` |
| `TARGET_URL` | The site's address. It must not redirect |
| `TARGET_PHP` | The PHP version for the domain. Default `ea-php83` |
| `DEPLOY_REFUSE_IF_PRESENT` | A folder name that, when it is in the document root, stops the upload. Use it to protect another site's folder |
| `MAIL_HOST`, `MAIL_FROM_NAME` | For `deploy/set-mail-env.php` (see "Email") |

## Upload with the cPanel API

[`Taskfile.yml`](../../Taskfile.yml) has a task for each case:

| Command | What it does |
|---|---|
| `task package` | Builds `local/build/ptsite.zip` (the name is `packageName` of `site.json`) from the working tree with [`deploy/build-package.php`](../../deploy/build-package.php). It installs the PHP and frontend packages itself (`composer install --no-dev`, `npm ci`). It stages in `local/build/stage`, so `backend/vendor` keeps its dev packages |
| `task deploy` | `task package`, uploads it, then runs `php artisan migrate --force` on the server. The data on the server stays |
| `task deploy:ci` | The same, with the package CI built for the current commit (`gh run download`). CI builds it only when asked: run `gh workflow run ci.yml` on that commit first, and use the package within 3 days. The task takes the package only from a run started by hand, never from a pull request's run |
| `task deploy:release -- v2.1.0` | The same, with the package of a release (`gh release download`) |
| `task deploy:mail` | Writes the mail settings into the server's `.env`. See "Email" |

The uploads go through [`deploy/upload.php`](../../deploy/upload.php). It makes a second zip with the contents
of `public/`, and on Windows it runs the upload script in an `alpine` container (Docker must be running), because
Git for Windows' curl stalls on uploads larger than about 1 MB to the cPanel API ("408 Request Timeout"). The
`--no-index` option replaces `public/robots.txt` in the package with one that blocks every search engine, for a
test site.

[`deploy/cpanel-upload.sh`](../../deploy/cpanel-upload.sh) then, through the cPanel API:

1. Refuses to go on when the document root holds the folder named in `DEPLOY_REFUSE_IF_PRESENT`, or when the app
   folder has no `.env` and none was passed with `--env`.
2. Extracts the package into the app folder and the second zip into the document root. It deletes nothing, so
   files of an earlier deploy stay.
3. Writes `index.php` in the document root from [`deploy/web-index.php`](../../deploy/web-index.php). It is
   `backend/public/index.php` with the app folder's path written in, and it tells Laravel that the public
   folder is the document root. Keep the two files in step.
4. Writes `.htaccess` in the document root: a redirect to the site's own host name for any other host name, then
   Laravel's own rules, then the PHP version block cPanel keeps in that file. The login cookie belongs to one
   host name, so the site must have only one. `/.well-known` is left out of the redirect, for cPanel's
   certificate check.
5. Sets the PHP version for the domain when the block was not there.
6. Runs the migrations.

The settings and their defaults are at the top of [`deploy/cpanel-lib.sh`](../../deploy/cpanel-lib.sh).

Two catches with the cPanel API:

- cPanel takes a relative destination of a file operation from the source's folder, not the home folder. The
  scripts pass absolute paths. Do the same in any new script.
- cPanel keeps the PHP version as a handler block in the document root's `.htaccess`, and each deploy replaces
  that file. The script copies the block into the new file.

## Moving to a fresh app folder

An upload never deletes a file on the server. That is safe, but files a new version no longer has stay in the
app folder, and some would still be read: an old `lang/` or `config/` file comes before the package's own. So a
large change of the code goes to a **fresh app folder**, and the old one stays as the way back.

1. Pick a new folder name, such as `liga-app-2`, and set `APP_DIR` to it.
2. `php deploy/copy-env.php <old app folder>` gives the new folder the server's `.env`
   ([`deploy/cpanel-copy-env.sh`](../../deploy/cpanel-copy-env.sh)). The file is read and written on the
   server's side: it never reaches the developer's disk, and no value is printed. `NAME=value` after the folder
   changes a setting in the copy, such as `APP_URL` for a test address.
3. Upload as usual. The upload writes the document root's `index.php` with the new folder's path, so the site
   runs from it from that moment.
4. To go back, upload the old version with `APP_DIR` set to the old folder: its `index.php` points there again.

**A test address first.** Give a subdomain its own document root and upload there with `WEB_DIR`, `TARGET_VHOST`
and `TARGET_URL` set to the subdomain, and `APP_DIR` set to the new folder. The new code then runs next to the
live site. When both run on the same database, check first that the new version has no migration to run
(`php artisan migrate --pretend` on a copy of the data), and upload without `--migrate`. For the cutover, upload
again with the live site's `WEB_DIR`, `TARGET_VHOST` and `TARGET_URL`, and set `APP_URL` back with
`copy-env.php` and `DEPLOY_REPLACE_ENV=1`.

## Upload over FTP

The cPanel API token can change the whole hosting account: files, databases, mailboxes and DNS. A CI job or a
helper should not hold it. An FTP account can only read and write files. That is still a lot: whoever can write
a PHP file into the document root can run code on the site and read its `.env`.

**The FTP account.** cPanel allows one folder per FTP account, and the site uses two (the app folder and the
document root), so the account's folder is the home folder. Set `DEPLOY_FTP_HOST` to the server's own name, the
one its certificate names, because a name that only points at the server fails the certificate check. Use the
full user name, such as `<user>@example.com`: the short name may be refused ("530 Access denied").

| Command | What it does |
|---|---|
| `task deploy:ftp:check` | Logs in and does the checks below. It changes nothing |
| `task deploy:release:ftp -- v2.1.0` | Uploads the package of a release over FTP and runs the migrations |

**How it works.** FTP can put files on the server, but cannot extract a zip or run a command, and the package
has thousands of files. So [`deploy/ftp-upload.sh`](../../deploy/ftp-upload.sh) uploads two zips and lets the
server extract them:

1. It checks before the first upload: the document root does not hold the folder named in
   `DEPLOY_REFUSE_IF_PRESENT`, the app folder has its `.env`, and the document root's `.htaccess` names the
   PHP version in `TARGET_PHP`.
2. It uploads the package zip into the app folder and the zip of `public/` into the document root.
3. It uploads [`deploy/server-install.php`](../../deploy/server-install.php) into the document root under a
   random name with a random token, calls it once and deletes it. That file extracts both zips, removes them
   and answers with the app folder's full path.
4. It writes `index.php` and `.htaccess`, the same as the cPanel upload.
5. It runs the migrations through `deploy/server-artisan.php` (see "Running artisan without SSH").

**What it cannot do.** It cannot upload the server's `.env` or set the PHP version. Both need the cPanel API,
so a new site is set up once with `task deploy`. FTP only replaces the code of a site that already runs.

## Running artisan without SSH

The host has no SSH, so the upload scripts run the migrations through a one-off PHP file,
[`deploy/server-artisan.php`](../../deploy/server-artisan.php):

1. It uploads the file into the document root under a random name (`deploy-<24 hex digits>.php`), with a
   random token and the app folder's path written into it.
2. It calls the file once over HTTPS, with the token in the `X-Deploy-Token` header and the commands as JSON.
   The file boots Laravel, runs the commands and answers with their output.
3. It deletes the file, also when a command failed.

The file answers "404" to a request without the right token. It runs only `migrate`. It is not part of the
deploy package. A host's malware scanner may block a PHP file that reads system information; Laravel itself is
not affected.

## Email

The site sends one kind of message: the password link (rule 12 of
[accounts-and-roles.md](../specs/accounts-and-roles.md)). The reasons for this setup are in
[0017](../decisions/0017-email-for-password-reset.md).

| | |
|---|---|
| How | Laravel's `smtp` mailer, through a mailbox on the site's domain made in cPanel |
| Server | The host's mail server, such as `mail.example.com`, port 465 with TLS. Its certificate must cover that name |
| When | Inside the request. There is no queue. The SMTP timeout is 15 seconds (`MAIL_TIMEOUT`) |
| SPF | A TXT record that covers the host's mail relay. cPanel usually makes it |
| DKIM | The `default._domainkey` key cPanel makes |
| DMARC | A TXT record at `_dmarc.example.com`, such as `v=DMARC1; p=none; adkim=r; aspf=r`. Add it in cPanel's "Zone Editor". Move to `p=quarantine` after a few weeks of messages that pass |

The mailbox's address and password are on the `Email user:` and `Email password:` lines of `local/keys.md`. Set
`MAIL_HOST` and `MAIL_FROM_NAME` in the environment, then `task deploy:mail` writes the mail settings into the
server's `.env`:

1. [`deploy/set-mail-env.php`](../../deploy/set-mail-env.php) builds the `MAIL_` lines: `MAIL_MAILER=smtp`,
   `MAIL_SCHEME=smtps`, `MAIL_HOST`, `MAIL_PORT=465`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS` (the
   mailbox) and `MAIL_FROM_NAME`.
2. [`deploy/cpanel-mail-env.sh`](../../deploy/cpanel-mail-env.sh) reads the app folder's `.env`, replaces its
   `MAIL_` lines with the new ones and uploads it. Every other line stays. No value is printed.

The configuration is not cached on the server, so the next request uses the new values. Run the task again
after changing the mailbox's password.

**To check that mail arrives,** ask for a link for your own account on the live site. In Gmail, "Mostrar
original" must show SPF, DKIM and DMARC as PASS. If the host refuses SMTP from PHP, set `MAIL_MAILER=sendmail`
in the server's `.env` instead.

The addresses that never get a link are set in `backend/config/ptsite.php` (`password_reset`): the site's own domain
(`PASSWORD_RESET_SITE_DOMAIN`, empty by default) and a list of placeholder domains. The built-in list holds only
`email.com` and `email.com.br`. `PASSWORD_RESET_BLOCKED_DOMAINS` in the `.env` adds domains without a deploy.

**If every admin is locked out** and none has an address that can get a link, set a password hash by hand: in
phpMyAdmin, put a bcrypt hash in `users.password` and `NULL` in `users.legacy_password` for one admin.
`php -r "echo password_hash('the new password', PASSWORD_BCRYPT);"` makes the hash.

## Limits to respect

- No queue workers or websockets. Anything slow must fit in a request, or run from the host's cron. So mail is
  sent inside the request.
- PHP 8.3 or newer, and MySQL with `utf8mb4`.
- Keep opcache's **JIT off** (`opcache.jit=disable`, PHP's default). In CI, PHP 8.3 with the JIT on crashed now and
  then with a segmentation fault; the end-to-end test servers turn it off (`frontend/scripts/e2e-server.mjs`).
  Check the host's value with `php -i`.
- The login throttle uses the cache; the default file cache works on shared hosting.
- Some firewalls refuse requests with the default User-Agent of scripting languages (406 Not Acceptable). Set
  one in any script that calls the host.

## Still open

- Whether a release uploads itself to a site. Today a person runs `task deploy:release`.
- Preview builds.
- SSH is off on many shared hosts, so `php artisan` runs through a one-off file (see "Running artisan without
  SSH"). A host that offers SSH would be simpler.
