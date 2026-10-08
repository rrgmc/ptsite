#!/usr/bin/env bash
# Regenerates the phone screenshots in docs/screens (shown in README.md).
# README.md is in English, so the screenshots are too: they come from a copy of the demo site (../site) in English.
# Builds the frontend, then starts Laravel on a fresh MySQL database with the development seed,
# runs scripts/screenshots.mjs, and stops the server. MySQL must be running (`task db:up`).
# Set PW_CHROMIUM_PATH if Chromium is preinstalled elsewhere.
set -euo pipefail
cd "$(dirname "$0")/.."
FRONTEND=$PWD
BACKEND=$FRONTEND/../backend
# The same port offset as ports.ts: the one in local/ports.env, or else PORT_OFFSET. Only a git worktree has
# that file.
OFFSET=$({ sed -n 's/^PORT_OFFSET=//p' ../local/ports.env 2>/dev/null || true; } | tr -d '\r')
PORT=${PORT:-$((8130 + ${OFFSET:-${PORT_OFFSET:-0}}))}
# Its own database: the development one's name plus this suffix (backend/config/database.php).
export DB_DATABASE_SUFFIX=_screenshots
# The demo site in English, in a folder git ignores. Both the build and Laravel read it. Git Bash on Windows
# needs the path in the Windows form (pwd -W), for PHP and Node to find it.
SITE=$(pwd -W 2>/dev/null || pwd)/node_modules/.screenshots-site
rm -rf "$SITE"
cp -r ../site "$SITE"
node -e '
  const fs = require("node:fs")
  const file = process.argv[1] + "/site.json"
  const english = { name: "Demo League", shortName: "League", tagline: "A poker league among friends", nightTitlePrefix: "League", locale: "en-US" }
  fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(fs.readFileSync(file, "utf8")), ...english }, null, 2))
' "$SITE"
export PTSITE_SITE_DIR=$SITE

npm run build >/dev/null
(cd "$BACKEND" && php artisan ptsite:prepare-database -q)

# setsid puts the server and its child in a process group, so that one kill stops both. Git Bash on Windows has
# no setsid: there the processes listening on the port are stopped instead.
SETSID=$(command -v setsid || true)
stop_server() {
  if [ -n "$SETSID" ]; then
    kill -- -"$SERVER" 2>/dev/null || kill "$SERVER" 2>/dev/null || true
  else
    kill "$SERVER" 2>/dev/null || true
    for pid in $(netstat -ano | awk -v port=":$PORT" '$2 ~ port"$" && $4 == "LISTENING" { print $5 }' | sort -u); do
      taskkill //F //T //PID "$pid" >/dev/null 2>&1 || true
    done
  fi
  wait "$SERVER" 2>/dev/null || true
}

(cd "$BACKEND" && php artisan migrate:fresh --seed --force -q)
(cd "$BACKEND" && LOGIN_THROTTLE=1000 exec $SETSID php artisan serve --port="$PORT" >/dev/null 2>&1) &
SERVER=$!
trap stop_server EXIT
for _ in $(seq 1 30); do curl -sf "http://127.0.0.1:$PORT/up" >/dev/null && break; sleep 0.5; done

BASE_URL="http://127.0.0.1:$PORT/app/" node scripts/screenshots.mjs
echo "screenshots: done"
