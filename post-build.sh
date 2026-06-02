#!/usr/bin/env bash
set -euo pipefail
cd /opt/vendetta

echo "=== Starting container ==="
docker compose up -d
sleep 8

echo "=== Container status ==="
docker compose ps

echo "=== Applying Prisma schema (db push) ==="
docker compose exec -T -u root vendetta-v4 npx prisma db push --accept-data-loss

echo "=== Logs (last 40 lines) ==="
docker compose logs --tail=40 vendetta-v4

echo "=== Network membership ==="
docker inspect vendetta-app-v4 --format "{{range \$k,\$v := .NetworkSettings.Networks}}{{\$k}} {{end}}"

echo "=== Done ==="
