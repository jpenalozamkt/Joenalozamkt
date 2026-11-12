#!/usr/bin/env bash
# Levanta un Postgres temporal, aplica las migraciones y corre las pruebas de permisos.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PGBIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)
export PATH="$PGBIN:$PATH"
TMP=$(mktemp -d)
PORT=${PGPORT_TEST:-55432}
cleanup(){ pg_ctl -D "$TMP/data" -m fast stop >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT
RUNAS=""
if [ "$(id -u)" = "0" ]; then chown -R postgres "$TMP"; RUNAS="runuser -u postgres --"; fi
$RUNAS initdb -D "$TMP/data" -A trust -U postgres >/dev/null
$RUNAS pg_ctl -D "$TMP/data" -o "-p $PORT -k $TMP" -l "$TMP/log" start >/dev/null
sleep 1
PSQL="psql -h $TMP -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$PSQL -c "create database hub" postgres
$PSQL -d hub -f "$DIR/supabase_stub.sql"
for f in "$DIR"/../migrations/*.sql; do echo "→ $(basename "$f")"; $PSQL -d hub -f "$f"; done
$PSQL -tA -d hub -f "$DIR/rls_tests.sql" 2>&1 | sed -n "s/.*NOTICE:  //p; /TODAS/p" | grep -v "^\s*$"
