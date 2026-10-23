#!/bin/bash
set -euo pipefail

echo "=========================================="
echo "  Deploy Vendetta Music (commit 8e0386a)"
echo "=========================================="

TAG="${1:-sha-8e0386a}"
NEW_IMAGE="ghcr.io/vonpeper/vendettamusic:${TAG}"
DB_PATH="/opt/stacks/vendetta/data/prisma/prod.db"
CONTAINER_CONF="/etc/containers/systemd/vendetta.container"

echo "1. Creando respaldo de base de datos..."
BACKUP_PATH="/opt/stacks/vendetta/data/prisma/prod.db.bak_$(date +%Y%m%d_%H%M%S)"
sudo cp "$DB_PATH" "$BACKUP_PATH"
echo "   Respaldo creado en: $BACKUP_PATH"

echo "2. Aplicando migración de base de datos (columnas customMusicianPay y customStaffPay)..."
sudo python3 - << 'PYEOF'
import sqlite3

db_path = "/opt/stacks/vendetta/data/prisma/prod.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

migrations = [
    ("BookingRequest", "customMusicianPay"),
    ("BookingRequest", "customStaffPay"),
    ("Event", "customMusicianPay"),
    ("Event", "customStaffPay"),
]

for table, col in migrations:
    try:
        c.execute(f"ALTER TABLE {table} ADD COLUMN {col} REAL;")
        print(f"   [+] Columna {col} agregada a tabla {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print(f"   [i] Columna {col} ya existía en tabla {table}")
        else:
            raise e

conn.commit()
conn.close()
print("   Migración de esquema completada exitosamente.")
PYEOF

echo "3. Descargando nueva imagen de contenedor en storage de root..."
sudo podman pull "$NEW_IMAGE"

echo "4. Actualizando configuración Quadlet en $CONTAINER_CONF..."
sudo cp "$CONTAINER_CONF" "${CONTAINER_CONF}.bak_$(date +%Y%m%d_%H%M%S)"
sudo sed -i "s|Image=ghcr.io/vonpeper/vendettamusic:.*|Image=$NEW_IMAGE|" "$CONTAINER_CONF"

echo "5. Recargando systemd y reiniciando servicio vendetta..."
sudo systemctl daemon-reload
sudo systemctl restart vendetta

echo "6. Verificando estado del servicio..."
sleep 5
sudo systemctl is-active vendetta
echo "   Servicio vendetta activo."

echo "7. Probando respuesta HTTP..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://vendetta.mx/)
echo "   HTTP Status vendetta.mx: $HTTP_CODE"

echo "=========================================="
echo "  Despliegue completado exitosamente!"
echo "=========================================="
