#!/usr/bin/env bash
set -euo pipefail
cd /opt/vendetta

echo "=== Starting container ==="
docker compose up -d
sleep 8

echo "=== Container status ==="
docker compose ps

echo "=== Applying Prisma schema (db push) ==="
docker compose exec -T vendetta npx prisma db push --accept-data-loss --skip-generate

echo "=== Logs (last 40 lines) ==="
docker compose logs --tail=40 vendetta

echo "=== Network membership ==="
docker inspect vendetta-app --format "{{range \$k,\$v := .NetworkSettings.Networks}}{{\$k}} {{end}}"

echo "=== Done ==="
