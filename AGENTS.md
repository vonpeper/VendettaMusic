<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:propodvps1-operations-directive -->
# Directivas de Operación y Despliegue en propodvps1 (Vendetta Music)

Este proyecto corre en producción en el servidor **`propodvps1`** de Prosuite (`https://vendetta.mx`). Cualquier agente o desarrollador debe seguir estrictamente estas directivas.

## 1. Datos del Servidor
- **Alias SSH:** `propodvps1` (`ssh propodvps1`)
- **IP:** `66.94.114.222` | **Puerto:** `2226` (NO es el 22)
- **Usuario:** `jose` (con privilegios de `sudo`)
- **Llave SSH:** `~/.ssh/propodvps1_jose`
- **Sudo Pass:** `BvJhdx2S77NOv3Oqx62UwsX/`
- **Auditoría:** Todas las sesiones de sudo quedan registradas en `/var/log/sudo-io`

## 2. Reglas de Oro de Arquitectura
1. **NO Docker, NO Docker Compose, NO Dokploy:** El servidor corre 100% con **Podman 5.4+ y Quadlet**.
2. **Estructura de Servicios:** 
   - Servicio Web Principal: `/etc/containers/systemd/vendetta.container`
   - Servicio Secuencias: `/etc/containers/systemd/vendetta-secuencias.container`
3. **Red & Reverse Proxy:** Se conecta a `prosuite.network` con etiquetas de Traefik v3.3 para enrutamiento y certificados SSL automáticos.
4. **Flujo de Despliegue / Actualización:**
   ```bash
   # 1. Editar o crear el archivo .container
   sudo nano /etc/containers/systemd/vendetta.container

   # 2. Recargar systemd para regenerar units de Quadlet
   sudo systemctl daemon-reload

   # 3. Reiniciar el servicio
   sudo systemctl restart vendetta

   # 4. Verificar salud inmediatamente
   systemctl --failed
   sudo podman ps
   ```

## 3. Reglas para Agentes al Modificar Código
1. **Lee antes de escribir.** Revisa el contexto antes de editar y sigue las convenciones existentes.
2. **Cambios mínimos y enfocados.** Toca solo lo necesario para la tarea.
3. **Secrets y entorno.** Nunca hardcodees claves ni credenciales en el código; usa variables de entorno en el archivo `.container`.
4. **Verificación obligatoria.** Asegura que `npm run ts-check` y `npm run build` compilen sin errores antes de entregar o desplegar.
<!-- END:propodvps1-operations-directive -->
