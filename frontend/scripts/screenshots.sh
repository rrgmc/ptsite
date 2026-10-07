#!/usr/bin/env bash
# Regenerates docs/screens/{mobile,desktop} (shown in README.md).
# Builds the frontend, then for each device starts Laravel on a fresh MySQL database with the development seed,
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

for device in mobile desktop; do
  (cd "$BACKEND" && php artisan migrate:fresh --seed --force -q)
  (cd "$BACKEND" && LOGIN_THROTTLE=1000 exec $SETSID php artisan serve --port="$PORT" >/dev/null 2>&1) &
  SERVER=$!
  trap stop_server EXIT
  for _ in $(seq 1 30); do curl -sf "http://127.0.0.1:$PORT/up" >/dev/null && break; sleep 0.5; done

  DEVICE=$device BASE_URL="http://127.0.0.1:$PORT/app/" node scripts/screenshots.mjs
  echo "screenshots: $device done"

  stop_server
done
