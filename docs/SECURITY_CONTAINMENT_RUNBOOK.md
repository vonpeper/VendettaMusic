# Runbook de Seguridad, Contención y Operación — Vendetta Music

Este documento detalla las directivas técnicas de seguridad, contención, gestión de variables de entorno, auditorías y procedimientos operativos para el entorno de producción en **Vendetta Music** (`vendetta.mx`).

---

## 1. Matriz de Variables de Entorno

| Variable | Requerida | Valor por defecto | Propósito / Descripción |
| :--- | :--- | :--- | :--- |
| `AUTH_SECRET` | **Sí** | *(Ninguno, fail-closed)* | Llave secreta criptográfica para firmar tokens JWT de sesión y tokens de recursos firmados (HMAC-SHA256). |
| `CRON_SECRET` | **Sí** | *(Ninguno, fail-closed)* | Token Bearer para autorizar la ejecución del cron diario (`POST /api/cron/daily`). |
| `WHATSAPP_INBOUND_ENABLED` | Opcional | `false` | Controla el procesamiento y almacenamiento de mensajes entrantes. `false` apaga la creación de `InboxItem` y notificaciones inbound. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Opcional | *(Vacío)* | Número comercial de atención por WhatsApp. Si está vacío o no se define, el botón flotante se oculta y la web dirige a `/cotizar` o formulario de contacto. |
| `EVOLUTION_WEBHOOK_SECRET` | Recomendada | *(Vacío)* | Secreto compartido para validar la firma HMAC-SHA256 (`x-evolution-signature`) del webhook de Evolution API. |
| `EVOLUTION_INSTANCE` | Opcional | `vendetta_admin` | Nombre de la instancia autorizada de Evolution API. |
| `DATABASE_URL` | **Sí** | `file:./prisma/dev.db` | Cadena de conexión a la base de datos SQLite / LibSQL. |

---

## 2. Protocolo de Rotación de Credenciales

### A. Generación de Nuevos Secretos Criptográficos
Ejecutar localmente para generar strings aleatorios seguros de 64 caracteres hex:
```bash
# Generar AUTH_SECRET
openssl rand -hex 32

# Generar CRON_SECRET
openssl rand -hex 32

# Generar EVOLUTION_WEBHOOK_SECRET
openssl rand -hex 32
```

### B. Actualización de Contraseña de Administrador
La inicialización de la base de datos (`src/lib/db.ts`) ya **NO** sobreescribe contraseñas en tiempo de ejecución.
Para actualizar la contraseña del usuario `admin@vendetta.mx` en el servidor de forma segura:
```bash
# Generar hash bcrypt seguro (12 rounds)
node -e "const bcrypt = require(bcryptjs); bcrypt.hash(NUEVA_PASS_AQUI, 12).then(console.log);"
```
Actualizar el hash en la tabla `User` mediante script o consola de base de datos sin dejar rastro en el historial de comandos.

---

## 3. Automatización del Cron Diario

El endpoint diario solo acepta solicitudes **POST** con encabezado de autorización:
```bash
# Ejecución vía cURL / Crontab:
curl -X POST https://vendetta.mx/api/cron/daily \
  -H "Authorization: Bearer <TU_CRON_SECRET>" \
  -H "Content-Type: application/json"
```

Configuración recomendada en `crontab` del VPS (ajustada para ejecutarse a las 08:00 AM hora CDMX):
```cron
# 16:00 UTC = 08:00 AM America/Mexico_City (CDMX)
0 16 * * * curl -s -X POST https://vendetta.mx/api/cron/daily -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
```

---

## 4. Gestión de WhatsApp y Limpieza de Mensajes Entrantes

### A. Apagado de Inbound
El webhook en `/api/webhooks/evolution` mantiene activas las actualizaciones de estado de entrega (`delivered`, `read`, `sent`) para mensajes salientes (necesarias para evitar envíos duplicados), pero descarta y no almacena mensajes entrantes cuando `WHATSAPP_INBOUND_ENABLED=false`.

### B. Herramienta de Saneamiento de Datos Inbound
Se incluye un script seguro con confirmación de doble factor:

1. **Modo Simulación (Dry-Run):**
   ```bash
   npx tsx scripts/cleanup-inbound-whatsapp.ts
   ```
   *(Muestra los totales de registros inbound e InboxItems a eliminar sin alterar la base de datos).*

2. **Modo Ejecución (Destructivo):**
   ```bash
   CONFIRM_CLEANUP_INBOUND="ELIMINAR_WHATSAPP_INBOUND_VENDETTA" npx tsx scripts/cleanup-inbound-whatsapp.ts --execute
   ```

---

## 5. Auditorías de Datos (Solo Lectura)

### A. Detección de Clientes Duplicados
```bash
npx tsx scripts/audit-duplicate-clients.ts
```
Analiza coincidencias de teléfonos (normalizados a 10 dígitos), correos duplicados y reservas sin perfil asignado.

### B. Detección de Venues y Locaciones Sintéticas
```bash
npx tsx scripts/audit-venues.ts
```
Detecta entradas sintéticas generadas históricamente (`Show - ...`), eventos sin locación vinculada y posibles duplicados de catálogo.

---

## 6. Depuración del Historial Git (Git History Purge)

> [!CAUTION]
> Este procedimiento reescribe el historial de Git. Debe ejecutarse **únicamente** con respaldo previo y autorización explícita.

Para eliminar definitivamente credenciales y secretos de commits antiguos antes de cualquier publicación o push:

1. Instalar `git-filter-repo`:
   ```bash
   brew install git-filter-repo
   ```

2. Crear archivo de reemplazo de expresiones sensibles (`expressions.txt`):
   ```text
   regex:(?i)Pp55202104#==>REDACTED_PASSWORD
   regex:(?i)BvJhdx2S77NOv3Oqx62UwsX/==>REDACTED_SUDO_PASS
   regex:012 700 02996376576 4==>REDACTED_CLABE
   regex:072 180 01127840168 2==>REDACTED_CLABE
   regex:527222417045==>REDACTED_PHONE
   ```

3. Ejecutar reemplazo en todo el historial:
   ```bash
   git filter-repo --replace-text expressions.txt --force
   ```

---

## 7. Verificación de Integridad y Checklist de Despliegue

> [!CAUTION]
> **Estado de Despliegue:** El despliegue permanece bloqueado hasta verificar el esquema real del VPS y aprobar manualmente una migración limitada a Fase 2.

Antes de entregar cambios o preparar releases:
- [ ] `npm run ts-check` compila con 0 errores.
- [ ] `npm run build` genera los artefactos de producción sin advertencias críticas.
- [ ] Ausencia de credenciales hardcodeadas comprobada con búsqueda regex en `src/`.
- [ ] `scripts/cleanup-inbound-whatsapp.ts` corre en simulación sin errores.
- [ ] El renderizado de `/admin/ventas` no ejecuta mutaciones de base de datos.

