#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed on this server."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is not available."
  exit 1
fi

echo "[docker] starting app + telegram local api (profile=local)"
docker compose --profile local up -d --build

echo "[docker] stack status"
docker compose --profile local ps

echo "[docker] app health probe"
curl -fsS http://127.0.0.1:5000/ >/dev/null && echo "app is reachable on :5000"

