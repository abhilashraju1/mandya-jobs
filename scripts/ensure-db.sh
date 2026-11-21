#!/usr/bin/env bash
set -e

export LD_LIBRARY_PATH=/mnt/sfdisk/flatpak/app/org.pgadmin.pgadmin4/x86_64/stable/active/files/lib:${LD_LIBRARY_PATH:-}
export PATH=/home/5296658037_0/.gemini/antigravity/bin:${PATH}

PGDATA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.pgdata"

if ! pg_isready -h localhost -p 5432 -U postgres >/dev/null 2>&1; then
  if [ -f "$PGDATA_DIR/postmaster.pid" ]; then
    PID=$(head -n 1 "$PGDATA_DIR/postmaster.pid")
    if ! kill -0 "$PID" 2>/dev/null; then
      echo "Cleaning up stale postmaster.pid (PID $PID)..."
      rm -f "$PGDATA_DIR/postmaster.pid"
    fi
  fi
  if [ ! -d "$PGDATA_DIR" ]; then
    echo "Initializing PostgreSQL cluster at $PGDATA_DIR..."
    initdb -D "$PGDATA_DIR" -U postgres --auth=trust >/dev/null
  fi
  echo "Starting PostgreSQL server on port 5432..."
  pg_ctl -D "$PGDATA_DIR" -l "$PGDATA_DIR/server.log" -o "-p 5432 -k /tmp" start >/dev/null
  sleep 1
fi

# Ensure database exists
if ! psql -h localhost -p 5432 -U postgres -lqt | cut -d \| -f 1 | grep -qw mandya_jobs; then
  createdb -h localhost -p 5432 -U postgres mandya_jobs
fi

echo "PostgreSQL is running and ready on port 5432 (database: mandya_jobs)"
