#!/usr/bin/env bash
# Gives the app folder the .env of another app folder on the same account, through the cPanel API (no SSH
# needed). It is for moving a site to a fresh app folder: the server's .env exists only on the server.
#
#   deploy/cpanel-copy-env.sh <app folder to copy from> [NAME=value ...]
#
# - Reads <app folder to copy from>/.env and writes it as APP_DIR/.env. The file never leaves the server's side
#   of this script: it is not written to the developer's disk.
# - Each NAME=value replaces that setting's line, or adds it: APP_URL=https://next.example.com for a test
#   address.
# - It refuses when APP_DIR already has a .env, unless DEPLOY_REPLACE_ENV is 1.
# - It prints the names of the settings it changed, never a value.
set -euo pipefail

from="${1:-}"
[ -n "$from" ] || { echo "Usage: $0 <app folder to copy from> [NAME=value ...]" >&2; exit 1; }
shift

# shellcheck source=deploy/cpanel-lib.sh
. "$(dirname "$0")/cpanel-lib.sh"

[ "$from" != "$APP_DIR" ] || { echo "The two app folders are the same: $APP_DIR." >&2; exit 1; }
has "$from" .env || { echo "No .env in $from." >&2; exit 1; }
ensure_dir "$APP_DIR"
if has "$APP_DIR" .env && [ "${DEPLOY_REPLACE_ENV:-}" != 1 ]; then
  echo "$APP_DIR already has a .env. Set DEPLOY_REPLACE_ENV=1 to replace it." >&2
  exit 1
fi

new="$(mktemp)"
trap 'rm -f "$new"' EXIT
read_file "$from" .env >"$new"
# An .env without the app key is not the server's file: stop before writing something worse.
grep -q '^APP_KEY=.' "$new" || { echo "The .env read from $from has no APP_KEY. Nothing was changed." >&2; exit 1; }

changed=""
for setting in "$@"; do
  name="${setting%%=*}"
  [[ "$name" =~ ^[A-Z][A-Z0-9_]*$ && "$setting" == *=* ]] || { echo "Not a setting: write NAME=value." >&2; exit 1; }
  grep -v "^$name=" "$new" >"$new.next" || true
  printf '%s\n' "$setting" >>"$new.next"
  mv "$new.next" "$new"
  changed="$changed $name"
done

upload "$new" "$APP_DIR" .env
echo "Wrote $home/$APP_DIR/.env from $from/.env.${changed:+ Changed:$changed}"
