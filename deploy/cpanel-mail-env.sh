#!/usr/bin/env bash
# Puts the mail settings into the server's .env through the cPanel API (no SSH needed).
#
#   deploy/cpanel-mail-env.sh <file with the MAIL_ lines>
#
# - Reads ~/<app folder>/.env, drops its MAIL_ lines, adds the lines of the given file and uploads the result.
# - Every other line of the .env stays as it is.
# - It prints the names of the settings it wrote, never a value. deploy/set-mail-env.php makes the file.
#
# The app does not cache its configuration on the server, so the new values apply to the next request.
set -euo pipefail

lines="${1:-}"
[ -f "$lines" ] || { echo "Usage: $0 <file with the MAIL_ lines>" >&2; exit 1; }

# shellcheck source=deploy/cpanel-lib.sh
. "$(dirname "$0")/cpanel-lib.sh"

has "$APP_DIR" .env || { echo "No .env in $APP_DIR." >&2; exit 1; }

new="$(mktemp)"
trap 'rm -f "$new"' EXIT
current="$(read_file "$APP_DIR" .env)"
# An .env without the app key is not the server's file: stop before replacing it with something worse.
grep -q '^APP_KEY=.' <<<"$current" || { echo "The .env read from $APP_DIR has no APP_KEY. Nothing was changed." >&2; exit 1; }

# cat -s keeps one empty line where the old MAIL_ lines left several.
{ grep -v '^MAIL_' <<<"$current"; echo; cat "$lines"; } | cat -s >"$new"

upload "$new" "$APP_DIR" .env
echo "Wrote to $home/$APP_DIR/.env: $(grep -o '^MAIL_[A-Z_]*' "$lines" | tr '\n' ' ')"
