<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:vps-deploy-directive -->
# Directiva de despliegue (VPS / Dokploy) — LEER ANTES DE TOCAR INFRA

Este proyecto corre en producción bajo un modelo de despliegue fijo. **Cualquier agente que haga cambios debe respetar esta directiva. No improvisar.**

## Arquitectura de producción
- **Dominio de producción: https://vendetta.mx** (detrás de Cloudflare). Es el único dominio válido. No asumas `localhost`, Vercel, ni `*.prosuite.pro` como producción.
- **Hosting: VPS `panel-prosuite-2`**, orquestado con **Dokploy** (panel en `https://panel.prosuite.pro`).
- **Repo:** `vonpeper/VendettaMusic`. Stack: Next.js + Prisma + Postgres, contenedores Docker vía `docker-compose.yml`.

## Cómo se despliega (NO se despliega a mano en el VPS)
- El deploy es **automático por GitHub Actions** al hacer merge a `main`:
  - `.github/workflows/build.yml` → construye y publica la imagen.
  - `.github/workflows/deploy.yml` → dispara `compose.deploy` en Dokploy vía su API.
- **Nunca** hagas `docker`, `git pull`, edición de archivos, ni `prisma migrate` directamente sobre el VPS/servidor. El servidor es desechable: se reconstruye desde el repo. Todo cambio entra **solo por el repo**.

## Reglas para agentes al hacer cambios — no escribir "a lo loco"
1. **Lee antes de escribir.** Revisa el archivo y su contexto antes de editar. Sigue las convenciones existentes (estilo, nombres, estructura). No reescribas módulos completos por un cambio chico.
2. **Cambios mínimos y enfocados.** Toca solo lo necesario para la tarea. Nada de refactors masivos no solicitados ni reformateo de archivos enteros.
3. **No toques sin permiso explícito:** `docker-compose.yml`, `.github/workflows/*`, `prisma/schema.prisma`, variables/secrets, configuración de Dokploy o del dominio. Si un cambio los requiere, **propón primero y espera confirmación**.
4. **Secrets y entorno:** nunca hardcodees claves ni URLs de producción en el código. Usa variables de entorno. `.env.example` documenta las requeridas; las reales viven en Dokploy y en los secrets de GitHub.
5. **Esquema de base de datos:** los cambios a Prisma van con migración versionada (`prisma migrate`), nunca `db push` contra producción ni edición manual del esquema en el servidor.
6. **Branch + PR:** trabaja en rama y abre PR contra `main`. No hagas push directo a `main` (dispara deploy a producción). Deja que el merge dispare el deploy.
7. **Verifica antes de entregar:** que compile/lintee localmente. No marques algo como hecho si no lo validaste.
8. **Ante la duda, pregunta.** Si la tarea afecta despliegue, datos de producción o infra, confirma con el responsable antes de actuar.
<!-- END:vps-deploy-directive -->
