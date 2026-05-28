# Auditoría de optimización y limpieza — Vendetta

> Fecha: 2026-05-27 · Estado base: 33,606 LOC en `src/`, 30 modelos Prisma, 32 deps de runtime.

Este documento registra la limpieza ya aplicada y las optimizaciones pendientes,
priorizadas por impacto/riesgo. El objetivo es reducir el tamaño del proyecto sin
afectar funcionalidad en producción.

---

## 1. Aplicado en este sprint (validado con `npm run build` verde)

| Cambio | Detalle | Impacto |
|---|---|---|
| Deps muertas eliminadas | `googleapis`, `jsonwebtoken`, `jspdf`, `@types/jsonwebtoken` — 0 imports en `src/` | −4 deps, ~70 MB en `node_modules` |
| `shadcn` reclasificada | Movida de `dependencies` a `devDependencies` (es CLI, no runtime) | Coherencia de deps |
| Página de prueba borrada | `src/app/admin/upload-test/` — no enlazada en sidebar, sin referencias | −1 ruta |
| Scripts one-shot borrados | `src/scripts/migrate-locations.ts`, `migrate-to-normalized.ts` — no invocados | −2 archivos |
| Stub muerto eliminado | `syncToGoogleCalendar` en `lib/notifications/index.ts` — 0 callsites | Limpieza |
| Modelo Prisma eliminado | `SystemLog` — 0 referencias en código | −1 modelo |
| Fix de build | `tsconfig.json` ahora excluye `PROB/**` (subproyecto separado que rompía el typecheck) | Build local verde |

**Nota sobre `deleteFromGoogleCalendar`**: se conservó (no es código muerto) porque
tiene 2 callsites en `src/app/api/booking/route.ts`. Google Calendar sigue sin
implementarse; el stub es un no-op intencional.

---

## 2. Pendiente — requiere decisión operativa (NO tocado)

Estos elementos parecen migraciones/debug one-shot, pero están **activos en producción**.
No se borraron por falta de certeza sobre su uso actual.

| Elemento | Ubicación | Por qué dudar |
|---|---|---|
| Botón "Sincronizar Datos" | `RepairSyncButton.tsx` + `actions/admin.ts` (`repairOrphanedEvents`) | Visible en el dashboard `/admin`. Crea `BookingRequest` para eventos huérfanos. Borrar solo si ya no aparecen huérfanos nuevos. |
| `api/admin/repair` | `src/app/api/admin/repair/route.ts` | Hardcoded a reparar un cliente específico ("Johanna"). Casi seguro one-shot cumplido. |
| `api/admin/migrate` | `src/app/api/admin/migrate/route.ts` | Normaliza estados viejos (`confirmed→agendado`, etc). Verificar que ningún cron/externo lo llame. |
| Página Diagnóstico | `actions/diagnostico.ts` + `src/app/admin/diagnostico/` + link en `AdminSidebar.tsx` | Herramienta de debug operativa; puede seguir siendo útil. |

---

## 3. Pendiente — refactors de mayor esfuerzo (recomendados)

| # | Acción | Impacto estimado | Esfuerzo | Riesgo |
|---|---|---|---|---|
| 1 | Consolidar `actions/config.ts` (13 funciones que repiten `requireAdmin → FormData → upsert vendetta_config → revalidatePath`) en una sola `saveConfigSectionAction` + mapa de campos | −~360 LOC | 1–2 h | Bajo |
| 2 | Mover `requireAdmin()` a `lib/auth.ts` y reusarlo en los ~16 sitios que lo reimplementan inline | −~150 LOC, consistencia | 1 h | Bajo |
| 3 | Fusionar `lib/notifications/{templates,musicians,dispatcher}.ts` (la separación actual no agrega valor; solo `dispatcher` y `whatsapp` tienen callsites externos) | −~200 LOC, 3→1 archivo | 2 h | Medio (8 callsites) |
| 4 | Extraer un `<CrudManager<T>>` genérico para los 6 managers casi idénticos (Packages 535, Extras 494, Repertoire 406, Locations 321, Users 276, Services 230 ≈ 2262 LOC) | −~1200 LOC | 6–10 h | Medio |
| 5 | Split de `admin/configuracion/page.tsx` (793 LOC) en sub-componentes por tab | Organización | 1 h | Nulo |

**Por verificar antes de tocar**: modelos `Setlist`/`SetlistSong` y `Quote`/`QuoteItem`
podrían estar sin uso real (si todo el flujo va por `BookingRequest`). Confirmar
referencias antes de eliminar — implican migración de DB.

---

## 4. Seguridad — vulnerabilidades (2026-05-27)

Partíamos de 13 vulnerabilidades. Estado tras la limpieza: **7 moderate, 0 high**.

### Resuelto
| Acción | Detalle |
|---|---|
| `npm audit fix` no-breaking | Subió Next `16.2.4 → 16.2.6` (parcha XSS, cache poisoning, SSRF, DoS) y arregló `postcss`, `qs`, `ws`, `fast-uri`, `hono`, `brace-expansion` transitivos |
| `xlsx → exceljs` | Eliminado el único **high** (Prototype Pollution + ReDoS de SheetJS, sin fix en npm). Migrado el endpoint `api/admin/export` a `exceljs@4.4.0`. El export solo escribe (nunca parsea), así que el vector ya era inexplotable; aun así se eliminó la dep de raíz |

### Restante (NO accionable sin romper — riesgo real nulo en este contexto)
| Vuln | Cadena | Por qué no se toca |
|---|---|---|
| `@hono/node-server` (moderate) | `@prisma/dev` → `prisma` | Dep de **dev-tooling** de Prisma (dev server/studio), no entra al runtime de producción. Su fix `--force` haría downgrade Prisma 7→6 |
| `postcss` (moderate) | interno de `next` | Bundle interno de Next 16.2.6. Su fix `--force` haría downgrade Next a v9. Se resolverá cuando Next actualice su propio postcss |
| `uuid` (moderate) | `exceljs` | El advisory afecta `uuid.v3/v5/v6` con buffer de salida; exceljs usa `v4` sin buffer → no explotable. Su fix `--force` haría downgrade exceljs a 3.4.0 |

**Regla**: no correr `npm audit fix --force` — todos sus "fixes" son downgrades mayores
(Prisma 7→6, Next 16→9, exceljs 4→3) que romperían el proyecto.

---

## 5. Validación pre-deploy — sin regresiones de frontend (2026-05-27)

Antes del deploy se verificó que la limpieza y los fixes de seguridad **no eliminaran
ninguna funcionalidad, botón ni sección visible**.

### Auditoría del diff
- Único archivo de UI tocado en ambos commits: **borrado de `admin/upload-test/page.tsx`**.
- Cero componentes en `src/components/**` y cero páginas existentes modificadas → por
  construcción no se pudo quitar un botón de ninguna pantalla en uso.
- `admin/upload-test` tenía **0 referencias entrantes** (ningún `Link`/`href`/`router.push`/
  `redirect`): página huérfana de pruebas, no estaba en el sidebar ni en ningún menú.
- Los 3 botones de export (`ventas`, `clientes`, `eventualidades`) intactos; solo cambió
  el backend del endpoint (xlsx→exceljs) con comportamiento idéntico.

### Smoke test de runtime (Next 16.2.6, dev server real)
| Prueba | Resultado |
|---|---|
| Home `/` | 200 — secciones presentes: Músicos, Paquetes, Servicios, Galería, Contacto, Cotizar |
| `/paquetes`, `/repertorio`, `/servicios`, `/contacto`, `/cotizar` | todas 200 |
| `/api/admin/export` (bookings/clients/events) | 401 — endpoint vivo y protegido (no 404) |
| Generación de `.xlsx` con exceljs | buffer válido (magic `PK`), verificado con datos dummy |
| Log del server | sin errores de runtime |

> Las pantallas admin (dashboard, tablas) requieren login y no se navegaron logueadas;
> el diff garantiza que ninguna fue modificada.

---

## 6. Notas de operación

- **DB local vs CLI**: `src/lib/db.ts` resuelve por default a `file:./prisma/dev.db`,
  pero `prisma.config.js` usa `file:./prisma/prod.db`. Conviene unificar para evitar
  confusión al correr migraciones locales.
- **Sincronizar schema local**: tras `git pull`, la DB local puede quedar atrás del
  schema. Correr `prisma db push` (o `migrate deploy`) antes de `npm run build`.
- **`npm audit`**: quedan vulnerabilidades reportadas (revisar `npm audit` y evaluar
  `npm audit fix` sin `--force`).
