#!/usr/bin/env bash
# Uploads a deploy package to the site on its shared host through the cPanel API (no SSH needed).
#
#   deploy/cpanel-upload.sh <package.zip> --web <web.zip> [--env <file>] [--migrate]
#
# The Laravel app lives outside the document root, so .env, vendor/ and storage/ are never reachable from the
# web. Only the contents of the package's public/ folder go into the document root:
#
#   ~/<app folder>      the whole package, and the server's .env
#   ~/public_html   the contents of public/, with an index.php that points at ~/<app folder>
#
# - Uploads the package into the app folder, extracts it there and removes the zip.
# - --web is a zip of the package's public/ folder without index.php and .htaccess (deploy/upload.php makes
#   it). It is extracted into the document root.
# - Writes index.php from deploy/web-index.php, and .htaccess from the package's one: with a redirect to the
#   site's own host name in front, and the PHP version handler cPanel keeps in that file kept.
# - --env uploads the server's .env file into the app folder.
# - --migrate runs `php artisan migrate --force` on the server, keeping its data.
#
# The host has no SSH. The artisan command runs through deploy/server-artisan.php, uploaded into the document
# root under a random name with a random token, called once and deleted again.
#
# It refuses to write into a document root that holds the folder named in DEPLOY_REFUSE_IF_PRESENT (another
# site's folder), and it never deletes anything there. The settings are in deploy/cpanel-lib.sh.
set -euo pipefail

package="" web="" env_file="" migrate=0
while [ $# -gt 0 ]; do
  case "$1" in
    --web) web="$2"; shift 2 ;;
    --env) env_file="$2"; shift 2 ;;
    --migrate) migrate=1; shift ;;
    -*) echo "Unknown option $1" >&2; exit 1 ;;
    *) package="$1"; shift ;;
  esac
done
if ! [ -f "$package" ] || ! [ -f "$web" ]; then
  echo "Usage: $0 <package.zip> --web <web.zip> [--env <file>] [--migrate]" >&2
  exit 1
fi

# shellcheck source=deploy/cpanel-lib.sh
. "$(dirname "$0")/cpanel-lib.sh"
# shellcheck source=deploy/web-files.sh
. "$(dirname "$0")/web-files.sh"

artisan() { # artisan '<JSON list of commands>': runs them on the server and prints their output
  local token name script out
  token="$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')"
  name="deploy-$(od -An -N12 -tx1 /dev/urandom | tr -d ' \n').php"
  script="$(mktemp)"
  sed -e "s/__DEPLOY_TOKEN__/$token/" -e "s|__APP_DIR__|$home/$APP_DIR|" "$(dirname "$0")/server-artisan.php" >"$script"
  upload "$script" "$WEB_DIR" "$name"
  rm "$script"
  out="$(curl -sS -m 600 -H "X-Deploy-Token: $token" -H 'Content-Type: application/json' \
    --data "$1" "$TARGET_URL/$name")" || true
  remove "$WEB_DIR/$name"
  printf '%s\n' "$out" | sed 's/^/  /'
  grep -qx 'EXIT 0' <<<"$out" || { echo "The artisan commands failed on the server." >&2; return 1; }
}

extract() { # extract <local zip> <dir>: uploads the zip into the folder, extracts it there and removes it
  local zip_name
  zip_name="deploy-$(date -u +%Y%m%d%H%M%S).zip"
  upload "$1" "$2" "$zip_name"
  # destfiles must be absolute: a relative one is taken from the zip's own folder, not the home folder.
  api2 Fileman fileop --data-urlencode op=extract --data-urlencode "sourcefiles=$2/$zip_name" \
    --data-urlencode "destfiles=$home/$2" >/dev/null
  remove "$2/$zip_name"
}

echo "Target: $home/$APP_DIR and $home/$WEB_DIR for $TARGET_URL ($TARGET_PHP)"

if [ -n "${DEPLOY_REFUSE_IF_PRESENT:-}" ] && has "$WEB_DIR" "$DEPLOY_REFUSE_IF_PRESENT"; then
  echo "Refusing to write to $WEB_DIR: another site is there (a $DEPLOY_REFUSE_IF_PRESENT folder)." >&2
  exit 1
fi
ensure_dir "$APP_DIR"
if [ -z "$env_file" ] && ! has "$APP_DIR" .env; then
  echo "No .env in $APP_DIR. Pass --env to upload one." >&2
  exit 1
fi

echo "Uploading $(du -h "$package" | cut -f1) package..."
extract "$package" "$APP_DIR"
if [ -n "$env_file" ]; then
  echo "Uploading .env..."
  upload "$env_file" "$APP_DIR" .env
fi

echo "Uploading $(du -h "$web" | cut -f1) of web files..."
extract "$web" "$WEB_DIR"

# index.php and .htaccess are uploaded on their own: extracting may keep an existing file.
file="$(mktemp)"
sed "s|__APP_DIR__|$home/$APP_DIR|" "$(dirname "$0")/web-index.php" >"$file"
upload "$file" "$WEB_DIR" index.php

# cPanel keeps the PHP version as a handler block in the document root's .htaccess. Keep that block, so the
# site never runs on the server's default PHP version, not even for a moment.
handler=""
if has "$WEB_DIR" .htaccess; then
  handler="$(read_file "$WEB_DIR" .htaccess | php_handler)"
fi
write_htaccess "$package" "$handler" >"$file"
upload "$file" "$WEB_DIR" .htaccess
rm "$file"

if ! grep -q "x-httpd-$TARGET_PHP" <<<"$handler"; then
  echo "Setting PHP $TARGET_PHP for $TARGET_VHOST..."
  uapi LangPHP php_set_vhost_versions -G --data-urlencode "version=$TARGET_PHP" --data-urlencode "vhost=$TARGET_VHOST" >/dev/null
fi
echo "PHP for $TARGET_VHOST: $(php_version "$TARGET_VHOST")"

# The database comes last: the migrations need the new code, the .env and the right PHP version in place.
if [ "$migrate" = 1 ]; then
  echo "Running the migrations..."
  artisan '[["migrate", "--force"]]'
fi
echo "Done."
