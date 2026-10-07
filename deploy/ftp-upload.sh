#!/usr/bin/env bash
# Uploads a deploy package to the site on its shared host over FTP with TLS. It does what deploy/cpanel-upload.sh
# does, with an FTP account in place of the cPanel API token, which can change the whole hosting account.
#
#   deploy/ftp-upload.sh <package.zip> --web <web.zip> [--migrate]
#   deploy/ftp-upload.sh --check     logs in and does the checks below; changes nothing
#
#   ~/<app folder>      the whole package, and the server's .env
#   ~/public_html   the contents of public/, with an index.php that points at ~/<app folder>
#
# - Uploads both zips. FTP cannot extract them, so deploy/server-install.php does it: uploaded into the document
#   root under a random name with a random token, called once and deleted again.
# - Writes index.php from deploy/web-index.php, and .htaccess like deploy/cpanel-upload.sh.
# - --migrate runs `php artisan migrate --force` on the server through deploy/server-artisan.php, the same way.
#
# What it cannot do, so `task deploy` (the cPanel API) must have set the site up once:
# - upload the server's .env: it refuses when the app folder has none;
# - set the PHP version: it refuses when the document root's .htaccess does not name TARGET_PHP.
#
# It refuses to write into a document root that holds the folder named in DEPLOY_REFUSE_IF_PRESENT (another
# site's folder).
#
# Settings (environment variables):
#   DEPLOY_FTP_HOST      the server's own name, which its certificate names (required)
#   DEPLOY_FTP_USER      FTP user whose folder is the account's home folder (required)
#   DEPLOY_FTP_PASSWORD  its password (required)
#   DEPLOY_FTP_INSECURE  set to 1 to accept any certificate; for a test server only
#   APP_DIR                 folder in the home folder for the Laravel app, such as liga-app (required)
#   WEB_DIR                 the site's document root, a folder in the home folder (default public_html)
#   TARGET_URL              the site's address; it must not redirect (required)
#   TARGET_PHP              the site's PHP version (default ea-php83)
set -euo pipefail

package="" web="" migrate=0 check=0
while [ $# -gt 0 ]; do
  case "$1" in
    --web) web="$2"; shift 2 ;;
    --migrate) migrate=1; shift ;;
    --check) check=1; shift ;;
    -*) echo "Unknown option $1" >&2; exit 1 ;;
    *) package="$1"; shift ;;
  esac
done
if [ "$check" = 0 ] && { ! [ -f "$package" ] || ! [ -f "$web" ]; }; then
  echo "Usage: $0 <package.zip> --web <web.zip> [--migrate], or $0 --check" >&2
  exit 1
fi

: "${DEPLOY_FTP_HOST:?set DEPLOY_FTP_HOST}"
: "${DEPLOY_FTP_USER:?set DEPLOY_FTP_USER}"
: "${DEPLOY_FTP_PASSWORD:?set DEPLOY_FTP_PASSWORD}"
: "${APP_DIR:?set APP_DIR}"
WEB_DIR="${WEB_DIR:-public_html}"
TARGET_PHP="${TARGET_PHP:-ea-php83}"
: "${TARGET_URL:?set TARGET_URL}"

# The app holds .env and vendor/, so it must never be a web folder or another site's folder. Its name must end
# in "-app", or match DEPLOY_APP_DIR_PATTERN when a site sets a stricter rule.
if ! [[ "$APP_DIR" =~ ${DEPLOY_APP_DIR_PATTERN:-^[a-z0-9]+-app(-[a-z0-9]+)?$} ]]; then
  echo "Refusing to use '$APP_DIR': it does not look like this site's app folder." >&2
  exit 1
fi

# shellcheck source=deploy/web-files.sh
. "$(dirname "$0")/web-files.sh"

# The password goes to curl in a file, so it is never on a command line.
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
escape() { sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' <<<"$1"; }
(umask 077; printf 'user = "%s:%s"\n' "$(escape "$DEPLOY_FTP_USER")" "$(escape "$DEPLOY_FTP_PASSWORD")" >"$work/curl.conf")
[ "${DEPLOY_FTP_INSECURE:-}" != 1 ] || echo insecure >>"$work/curl.conf"
base="ftp://$DEPLOY_FTP_HOST"

ftp() { curl -sS -m 900 --ssl-reqd -K "$work/curl.conf" "$@"; }
put() { ftp -T "$1" "$base/$2" >/dev/null; } # put <local file> <path in the home folder>
remove() { ftp -Q "DELE $1" "$base/" >/dev/null; } # remove <path in the home folder>
exists() { ftp -I "$base/$1" >/dev/null 2>&1; } # exists <file in the home folder>: also finds hidden files
random() { od -An -N"$1" -tx1 /dev/urandom | tr -d ' \n'; }

run_once() { # run_once <local PHP file> [curl args...]: uploads it into the document root, calls it, deletes it
  local script="$1" name out; shift
  name="deploy-$(random 12).php"
  put "$script" "$WEB_DIR/$name"
  out="$(curl -sS -m 900 -H "X-Deploy-Token: $token" "$@" "$TARGET_URL/$name" | tr -d '\r')" || true
  remove "$WEB_DIR/$name"
  printf '%s\n' "$out"
  grep -qx 'EXIT 0' <<<"$out"
}

echo "Target: $APP_DIR and $WEB_DIR on $DEPLOY_FTP_HOST for $TARGET_URL ($TARGET_PHP)"

# Every check comes before the first upload.
names="$(ftp -l "$base/$WEB_DIR/")"
if [ -n "${DEPLOY_REFUSE_IF_PRESENT:-}" ] && grep -qxF "$DEPLOY_REFUSE_IF_PRESENT" <<<"$names"; then
  echo "Refusing to write to $WEB_DIR: another site is there (a $DEPLOY_REFUSE_IF_PRESENT folder)." >&2
  exit 1
fi
if ! exists "$APP_DIR/.env"; then
  echo "No .env in $APP_DIR. FTP deploys do not upload one: set the site up once with 'task deploy'." >&2
  exit 1
fi
# cPanel keeps the PHP version as a handler block in the document root's .htaccess. Keep that block, so the
# site never runs on the server's default PHP version, not even for a moment.
handler=""
if exists "$WEB_DIR/.htaccess"; then
  handler="$(ftp "$base/$WEB_DIR/.htaccess" | php_handler)"
fi
if ! grep -q "x-httpd-$TARGET_PHP" <<<"$handler"; then
  echo "The site does not run PHP $TARGET_PHP, and FTP cannot set it: do it once with 'task deploy'." >&2
  exit 1
fi
if [ "$check" = 1 ]; then
  echo "The FTP account works and the site is ready for an upload. Nothing was changed."
  exit 0
fi

token="$(random 24)"
package_zip="deploy-$(random 12).zip"
web_zip="deploy-$(random 12).zip"

echo "Uploading $(du -h "$package" | cut -f1) package..."
put "$package" "$APP_DIR/$package_zip"
echo "Uploading $(du -h "$web" | cut -f1) of web files..."
put "$web" "$WEB_DIR/$web_zip"

echo "Extracting on the server..."
sed -e "s/__DEPLOY_TOKEN__/$token/" -e "s/__APP_DIR_NAME__/$APP_DIR/" -e "s/__PACKAGE_ZIP__/$package_zip/" \
  -e "s/__WEB_ZIP__/$web_zip/" "$(dirname "$0")/server-install.php" >"$work/install.php"
# The request has a JSON body like the artisan one: the host's ModSecurity refuses a POST without one.
if ! out="$(run_once "$work/install.php" -H 'Content-Type: application/json' --data '{}')"; then
  sed 's/^/  /' <<<"$out"
  # The install file removes the zips itself, but it may never have run.
  remove "$APP_DIR/$package_zip" 2>/dev/null || true
  remove "$WEB_DIR/$web_zip" 2>/dev/null || true
  echo "Extracting failed on the server." >&2
  exit 1
fi
sed 's/^/  /' <<<"$out"
app_path="$(sed -n 's/^APP //p' <<<"$out")"
[[ "$app_path" == /* || "$app_path" =~ ^[A-Za-z]:/ ]] || { echo "The server did not name the app folder." >&2; exit 1; }

# index.php and .htaccess are not in the web zip: they are made here.
sed "s|__APP_DIR__|$app_path|" "$(dirname "$0")/web-index.php" >"$work/index.php"
put "$work/index.php" "$WEB_DIR/index.php"
write_htaccess "$package" "$handler" >"$work/htaccess"
put "$work/htaccess" "$WEB_DIR/.htaccess"

# The database comes last: the migrations need the new code in place.
if [ "$migrate" = 1 ]; then
  echo "Running the migrations..."
  sed -e "s/__DEPLOY_TOKEN__/$token/" -e "s|__APP_DIR__|$app_path|" "$(dirname "$0")/server-artisan.php" >"$work/artisan.php"
  if ! out="$(run_once "$work/artisan.php" -H 'Content-Type: application/json' --data '[["migrate", "--force"]]')"; then
    sed 's/^/  /' <<<"$out"
    echo "The artisan commands failed on the server." >&2
    exit 1
  fi
  sed 's/^/  /' <<<"$out"
fi
echo "Done."
