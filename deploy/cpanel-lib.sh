# Helpers for the scripts that work on the hosting account through the cPanel API (no SSH needed).
# Sourced by deploy/cpanel-upload.sh.
#
# Settings (environment variables):
#   DEPLOY_CPANEL_USER          cPanel user name (required)
#   DEPLOY_CPANEL_TOKEN  cPanel API token (required)
#   DEPLOY_CPANEL_URL    cPanel address, for example https://cpanel.example.com (required)
#   APP_DIR                 folder in the home folder for the Laravel app, such as liga-app (required)
#   WEB_DIR                 the site's document root, in the home folder (default public_html)
#   TARGET_VHOST            the site's domain in cPanel, such as example.com (required)
#   TARGET_URL              the site's address; it must not redirect (required)
#   TARGET_PHP              the site's PHP version (default ea-php83)

: "${DEPLOY_CPANEL_USER:?set DEPLOY_CPANEL_USER}"
: "${DEPLOY_CPANEL_TOKEN:?set DEPLOY_CPANEL_TOKEN}"
: "${DEPLOY_CPANEL_URL:?set DEPLOY_CPANEL_URL}"
: "${APP_DIR:?set APP_DIR}"
WEB_DIR="${WEB_DIR:-public_html}"
: "${TARGET_VHOST:?set TARGET_VHOST}"
TARGET_PHP="${TARGET_PHP:-ea-php83}"
: "${TARGET_URL:?set TARGET_URL}"

# The app holds .env and vendor/, so it must never be a web folder or another site's folder. Its name must end
# in "-app", or match DEPLOY_APP_DIR_PATTERN when a site sets a stricter rule.
if ! [[ "$APP_DIR" =~ ${DEPLOY_APP_DIR_PATTERN:-^[a-z0-9]+-app(-[a-z0-9]+)?$} ]]; then
  echo "Refusing to use '$APP_DIR': it does not look like this site's app folder." >&2
  exit 1
fi

AUTH="Authorization: cpanel $DEPLOY_CPANEL_USER:$DEPLOY_CPANEL_TOKEN"

uapi() { # uapi Module function [curl args...]: prints the JSON answer, fails when the call failed
  local mod="$1" fn="$2" out; shift 2
  out="$(curl -sS -m 600 -H "$AUTH" "$DEPLOY_CPANEL_URL/execute/$mod/$fn" "$@")"
  if ! jq -e '.status == 1' >/dev/null <<<"$out"; then
    echo "cPanel $mod::$fn failed: $(jq -c '.errors' <<<"$out" 2>/dev/null || head -c 300 <<<"$out")" >&2
    return 1
  fi
  printf '%s' "$out"
}

api2() { # api2 Module function [curl args...]: the older API, for calls UAPI lacks here
  local mod="$1" fn="$2" out; shift 2
  out="$(curl -sS -m 600 -H "$AUTH" -G "$DEPLOY_CPANEL_URL/json-api/cpanel" \
    --data-urlencode cpanel_jsonapi_version=2 --data-urlencode "cpanel_jsonapi_module=$mod" \
    --data-urlencode "cpanel_jsonapi_func=$fn" "$@")"
  # Not every call reports a result for each item: Fileman::mkdir answers with the new folder only.
  if ! jq -e '.cpanelresult.event.result == 1
      and ([.cpanelresult.data[]? | objects | select(has("result")) | .result] | all(. == 1))' >/dev/null <<<"$out"; then
    echo "cPanel $mod::$fn failed: $(jq -c '.cpanelresult.error // .cpanelresult.data' <<<"$out" 2>/dev/null || head -c 300 <<<"$out")" >&2
    return 1
  fi
  printf '%s' "$out"
}

upload() { # upload <local file> <dir> <name>
  local tmp
  tmp="$(mktemp -d)"
  cp "$1" "$tmp/$3"
  uapi Fileman upload_files -F "dir=$2" -F overwrite=1 -F "file-1=@$tmp/$3" >/dev/null
  rm -r "$tmp"
}

remove() { # remove <file in the home folder>
  api2 Fileman fileop --data-urlencode op=unlink --data-urlencode "sourcefiles=$1" >/dev/null
}

list() { # list <dir>: prints the names in it, hidden ones too, one per line
  uapi Fileman list_files -G --data-urlencode "dir=$1" --data-urlencode show_hidden=1 \
    | jq -r '.data[].file | select(. != "." and . != "..")'
}

has() { # has <dir> <name>: true when the folder has an entry with that name
  list "$1" | grep -qxF -- "$2"
}

ensure_dir() { # ensure_dir <name>: makes the folder in the home folder when it is not there yet
  has "$home" "$1" || api2 Fileman mkdir --data-urlencode "path=$home" --data-urlencode "name=$1" >/dev/null
}

read_file() { # read_file <dir> <name>: prints the file's content
  uapi Fileman get_file_content -G --data-urlencode "dir=$1" --data-urlencode "file=$2" | jq -r '.data.content'
}

php_version() { # php_version <vhost>: prints its PHP version, for example ea-php82
  uapi LangPHP php_get_vhost_versions | jq -r --arg v "$1" '.data[] | select(.vhost == $v) | .version'
}

home="$(uapi Variables get_user_information | jq -r '.data.home')"
[[ "$home" == /* ]] || { echo "Could not read the home folder." >&2; exit 1; }
