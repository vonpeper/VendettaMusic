# Guía de acceso y deployment — Infraestructura Prosuite

**Para:** Jose
**De:** Felix
**Actualizado:** 2026-07-28

---

## 1. Tu acceso SSH (esto resuelve el problema que traías)

**El puerto SSH del master NO es el 22, es el 2226.** Si tu cliente apunta al puerto por defecto, la conexión hace timeout y parece un bloqueo o un problema de llave — pero no lo es. Revisé los logs: tu llave está siendo aceptada correctamente.

```bash
ssh -p 2226 jose@66.29.152.229
```

Tienes dos formas de entrar, ambas funcionan:

| Método | Detalle |
|---|---|
| **Llave SSH** (preferido) | Tu ED25519 `SHA256:iZ43W7cZ4f04V2lO6Aqr2HFk5LZ5w4463wrWbGLboi0` ya está autorizada |
| **Password** | Habilitado solo para tu usuario. Felix te lo pasa por canal seguro |

### Para tu `~/.ssh/config` (recomendado)

```
Host prosuite-master
    HostName 66.29.152.229
    User jose
    Port 2226
```

Después de eso, entras con `ssh prosuite-master`.

### Si usas VS Code / Cursor Remote-SSH

Los logs mostraban tu sesión abriendo y cerrando en menos de un segundo, reintentando cada ~6 segundos. Eso es el cliente en loop, no el servidor. Si vuelve a pasar:

1. Confirma que el host del Remote-SSH tenga **`Port 2226`**.
2. Borra el caché local: `rm -rf ~/.vscode-server` **en el servidor** (si existe) y en VS Code local: paleta de comandos → *Remote-SSH: Kill VS Code Server on Host*.
3. Revisa el log de la extensión: *Output → Remote-SSH*.

### Cambio en tus privilegios (2026-07-28)

Se te retiró `sudo`. **Conservas el grupo `docker`**, que es lo que necesitas para operar contenedores y para que siga corriendo tu `evolution_watchdog.sh`. Si necesitas algo que requiera root, pídelo — no es un castigo, es higiene: el acceso root sin contraseña en un server de producción es un riesgo que ninguno de los dos quiere.

---

## 2. La regla de deployment

> **Si no es un contenedor Docker con healthcheck, labels Traefik, límites de recursos y logging rotado, y no vive en `/opt/stacks/`, no entra a producción.**

El host es infraestructura inmutable. Las apps son ganado, no mascotas.

### Prohibido

| ❌ | Por qué |
|---|---|
| Apps en `/home/<usuario>/` corriendo con `node`, `npm start`, `pm2`, `nohup`, `screen` | No sobreviven un reinicio, no tienen límites de recursos, nadie más las puede operar |
| Tarballs (`.tar`, `.tar.gz`) subidos por `scp` y extraídos en el server | No hay trazabilidad de qué versión está corriendo ni cómo volver atrás |
| Publicar puertos al host fuera de Traefik (`-p 3010:3010`, `ports:` en compose) | Expone servicios sin TLS ni control de acceso |
| Scripts shell de deploy propios en tu home | Cada uno hace algo distinto; nadie más puede repetir el deploy |
| Editar código en el servidor (`nano`, `vim` sobre producción) | El cambio se pierde en el siguiente deploy y no queda en git |
| Secrets en `.env` planos dentro de tu home | — |

### Lo correcto

| ✅ | Cómo |
|---|---|
| Trabajar en un repo de GitHub | Clonado en **tu máquina**, no en el servidor |
| Containerizar la app | `Dockerfile` multi-stage + `docker-compose.yml` con labels Traefik |
| Deployar con `git push` | El pipeline hace build y deploy; nada de SSH + editar |
| Apps productivas en `/opt/stacks/<cliente>/` | Un directorio por stack, con su compose versionado |
| Operar desde las herramientas | Logs: `logs.prosuite.pro` · Métricas: `beszel.prosuite.pro` · Deploys/rollback: `dokploy.prosuite.pro` |

### Requisitos mínimos del `docker-compose.yml`

```yaml
services:
  app:
    image: ghcr.io/<org>/<app>:<tag>     # imagen versionada, no :latest a ciegas
    restart: unless-stopped
    healthcheck:                          # OBLIGATORIO
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    mem_limit: 512m                       # límites de recursos
    cpus: 1.0
    logging:                              # logging rotado
      driver: json-file
      options: { max-size: "10m", max-file: "3" }
    labels:                               # Traefik, sin ports: publicados
      - traefik.enable=true
      - traefik.http.routers.<app>.rule=Host(`<dominio>`)
      - traefik.http.routers.<app>.entrypoints=websecure
      - traefik.http.services.<app>.loadbalancer.server.port=3000
    networks: [dokploy-network]

networks:
  dokploy-network:
    external: true
```

**Referencia viva:** `/opt/stacks/evolution/docker-compose.yml` en el master cumple todo esto — cópialo como plantilla.

---

## 3. Si algo se rompe en producción

1. **Logs primero** → `logs.prosuite.pro` (Dozzle), filtra por stack.
2. **Métricas** → `beszel.prosuite.pro`: ¿CPU, RAM o disco anormales?
3. **Dokploy UI** → logs y terminal del contenedor.
4. **Rollback** → Dokploy UI → redeploy de la imagen anterior. Un click, sin rebuild.

**No** hagas hotfix editando en el servidor. Branch desde `main`, fix, push.

---

## 4. Cuando uses agentes de IA (Claude Code, Cursor, etc.)

Esto es importante y es la razón principal de este documento.

Un agente **no conoce estas reglas** a menos que las tenga en su contexto. Por defecto, si le pides "deploya esta app al servidor", va a proponer PM2, systemd o `scp` — porque es lo más común en internet, no porque sea lo correcto aquí.

**Antes de trabajar con un agente sobre infraestructura Prosuite:**

1. Coloca un archivo `CLAUDE.md` (o `AGENTS.md`, según la herramienta) en la raíz del proyecto con, como mínimo, la regla única y la lista de prohibidos de la sección 2.
2. Si el agente te propone PM2, systemd, tarballs, `scp` de código o apps en `/home/`, **recházalo** y pídele la alternativa containerizada.
3. Si te propone un patrón nuevo que no está aquí: pregunta antes de ejecutarlo.

Un agente con buen contexto es un multiplicador enorme. Uno sin contexto rompe producción con mucha eficiencia.

---

## 5. Pendientes concretos en tu entorno

Esto es lo que encontré hoy revisando el master. Nada urgente, pero hay que aterrizarlo:

| Qué | Dónde | Acción |
|---|---|---|
| Proceso PM2 `pri-castro` (detenido, 21 reinicios) | PM2 del usuario `jose` | Containerizar o eliminar el registro |
| `apps/vendetta`, `priscastromusic`, `SynapsisMexico`, `manifiesto21_source` | `/home/jose/` | Mover a repo + `/opt/stacks/`, o borrar si ya son legacy |
| `rgb_production.tar` | `/home/jose/` | Tarball de deploy: eliminar una vez containerizado |
| `deploy.sh` propio | `/home/jose/` | Reemplazar por deploy vía git push |
| Stacks `recsa` y `rgb` sin `healthcheck` | `/opt/stacks/` | Agregar healthcheck al compose (yo lo puedo hacer) |
| Token en texto plano en tu crontab | `crontab -l` (llamada a `manifiesto21.mx`) | Mover a un archivo con permisos `600` |

---

## 6. Dudas

- **Owner:** Felix — flxggm@icloud.com
- **Doc canónica:** `github.com/felixtron/prosuite` → `docs/DEPLOYMENT_DIRECTIVE.md`
- **Nuevos proyectos:** van a **`panel-prosuite-2`**, no al master (el master está congelado para apps nuevas)

**Antes de inventar un patrón nuevo, pregunta.** Casi siempre ya está resuelto, o hay una razón para que esté como está.
