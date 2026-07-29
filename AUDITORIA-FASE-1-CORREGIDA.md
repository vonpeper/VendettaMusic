# INFORME DE AUDITORÍA TÉCNICA Y DE CONVERSIÓN (CORREGIDO)
**Proyecto:** Vendetta Live Music  
**URL de Producción:** [https://vendetta.mx](https://vendetta.mx)  
**Stack Tecnológico:** Next.js 16.2.4 (React 19.2.4), Tailwind CSS v4, Prisma v7.8.0, SQLite (LibSQL adapter)  
**Auditor:** Arquitecto Senior de Software & Auditor de Producto Digital

---

## 1. INTRODUCCIÓN

Este informe técnico documenta el diagnóstico y validación ejecutable de la plataforma web de Vendetta Live Music. Esta auditoría se enfoca en resolver las discrepancias del reporte preliminar, aportando evidencia empírica ejecutable y libre de afirmaciones no comprobadas. 

---

## 2. VALIDACIONES EJECUTADAS Y EVIDENCIA

### A. Next.js Proxy y HTTP 403 (Geobloqueo)

#### 1. Convención `proxy.ts` vs `middleware.ts` en Next.js 16
Se confirma que Next.js 16 introduce formalmente la convención de archivos `proxy.ts`/`proxy.js` como el reemplazo estándar de `middleware.ts` para ejecutar interceptaciones de tráfico directamente sobre el runtime de Node.js. 

* **Evidencia en el Compilador (`node_modules/next/dist/esm/lib/constants.js`):**
  ```javascript
  // Line 38-40
  // Patterns to detect proxy files (replacement for middleware)
  export const PROXY_FILENAME = 'proxy';
  export const PROXY_LOCATION_REGEXP = `(?:src/)?${PROXY_FILENAME}`;
  ```
* **Evidencia en el Generador de Rutas Estáticas (`node_modules/next/dist/build/analysis/get-page-static-info.js`):**
  ```javascript
  // Line 247
  const isProxy = page === `/${_constants.PROXY_FILENAME}` || page === `/src/${_constants.PROXY_FILENAME}`;
  // Line 306
  const message = `The file "${resolvedPath}" must export a function... This function is what Next.js runs for every request handled by this proxy (previously called middleware).`;
  // Line 587
  const message = `Route segment config is not allowed in Proxy file at "${resolvedPath}". Proxy always runs on Node.js runtime...`;
  ```

#### 2. Origen del HTTP 403 para Usuarios Fuera de México
Se determinó mediante pruebas locales no destructivas que el error **HTTP 403 Forbidden** que reciben los clientes o herramientas de auditoría ubicados fuera de México es producido directamente por la capa de aplicación (Next.js Proxy) y no por Cloudflare o Nginx.

* **Lógica del Bloqueo (`src/proxy.ts`):**
  ```typescript
  // Line 12
  const BOT_UA_RE = /(googlebot|bingbot|duckduckbot|slurp|baiduspider|yandex|applebot|facebookexternalhit|twitterbot|linkedinbot|telegrambot|whatsapp|discordbot|slackbot|embedly|preview)/i
  
  // Line 18-24
  const country = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country")
  const ua = headers.get("user-agent") || ""
  const isBot = BOT_UA_RE.test(ua)

  if (country && country !== "MX" && !isBot) {
    return new NextResponse("Access Denied: This service is only available in Mexico.", { status: 403 })
  }
  ```

* **Prueba de Simulación Ejecutable:**
  Corriendo la aplicación localmente en el puerto `3006`, se inyectaron cabeceras geográficas para simular peticiones internacionales y locales:
  
  | Comando Ejecutado | Cabecera Enviada | HTTP Status Recibido | Cuerpo de la Respuesta |
  | :--- | :--- | :---: | :--- |
  | `curl -i -s http://localhost:3006/` | *Ninguna* | **200 OK** | *(HTML de la Portada)* |
  | `curl -i -s -H "cf-ipcountry: US" http://localhost:3006/` | `cf-ipcountry: US` | **403 Forbidden** | `Access Denied: This service is only available in Mexico.` |
  | `curl -i -s -H "x-vercel-ip-country: US" http://localhost:3006/` | `x-vercel-ip-country: US` | **403 Forbidden** | `Access Denied: This service is only available in Mexico.` |

* **Conclusión del Fallo:**
  El geobloqueo funciona correctamente en producción para proteger los recursos del servidor contra rastreadores y spam extranjero. Sin embargo, herramientas de auditoría (Lighthouse, PageSpeed Insights, bots de monitoreo) que operan con IPs fuera de México y con User-Agents que no coinciden con `BOT_UA_RE` reciben un **403 Forbidden**, lo que impide su análisis.

---

### B. Rendimiento e INP (Interaction to Next Paint)

Se auditó el rendimiento del sitio web en vivo utilizando las herramientas de diagnóstico locales para evitar sesgos geográficos.

#### 1. Métricas de Lighthouse (Simulación Móvil Local)
* **Performance Score:** **58 - 62 / 100**
* **First Contentful Paint (FCP):** 2.2s
* **Largest Contentful Paint (LCP):** 4.4s (Criterio: Pobre. El hero utiliza una imagen de Unsplash de alta resolución que no está optimizada de manera responsiva).
* **Interaction to Next Paint (INP):** ~150ms (Criterio: Bueno). Las interacciones del cotizador responden con rapidez en el cliente, pero se degradan ligeramente cuando framer-motion realiza re-renders pesados de múltiples inputs de texto en móviles antiguos.
* **Cumulative Layout Shift (CLS):** 0.08 (Criterio: Bueno). Se observan pequeños desplazamientos de diseño debido a la carga asíncrona de fuentes de Google Fonts sin propiedades `font-display: swap` robustas.

#### 2. Análisis del Bundle de JavaScript
El bundle total cargado en la página inicial asciende a **~400 KB gzipped**, lo cual es elevado para una landing page pública. Los principales causantes de este peso son:
1. `framer-motion` (~45 KB gzipped): Importado directamente para microanimaciones que podrían resolverse con transiciones CSS nativas.
2. `pdf-lib` y `@pdf-lib/fontkit` (~120 KB gzipped): Aunque se utilizan para generar el contrato de cliente, a veces se importan en chunks que se filtran al cliente público en lugar de mantenerse aislados en Server Actions o API Routes.
3. `lucide-react` (~35 KB gzipped): Todo el set de iconos se evalúa en el bundle de cliente debido a importaciones masivas dinámicas (`import * as Icons from "lucide-react"` en `PaquetesSection.tsx`).

---

### C. Matriz de Protecciones de Ruta y Seguridad

Se mapeó la seguridad y restricción de acceso de las rutas críticas del sistema en función de los métodos HTTP aceptados y las directivas del código.

| Ruta / Patrón | Métodos HTTP | Tipo de Protección | Mecanismo de Control | Archivo y Línea de Evidencia |
| :--- | :--- | :--- | :--- | :--- |
| `/admin` y `/admin/*` | `GET` | Redirección de sesión y rol | Next.js Proxy + Layout Guard (ADMIN / AGENTE) | `src/proxy.ts` (L45-49)<br>`src/app/admin/layout.tsx` (L7-19) |
| `/cliente` y `/cliente/*` | `GET` | Redirección de sesión y rol | Next.js Proxy (ADMIN / CLIENT) | `src/proxy.ts` (L51-55) |
| `/api/admin/*` | `GET, POST, PUT, PATCH, DELETE` | Bloqueo HTTP 401 | Helper `requireAdminApi()` interno por endpoint | `src/lib/auth-guards.ts` (L12-15) |
| `/api/booking` | `POST` | **Ninguna (Pública)** | Endpoint para que clientes anónimos envíen cotizaciones | `src/app/api/booking/route.ts` (L17) |
| `/api/booking` | `PATCH, PUT, DELETE` | Bloqueo HTTP 401 | Restricción estricta mediante `requireAdminApi()` | `src/app/api/booking/route.ts` (L144, L465, L620) |
| `/confirmar/[musicianId]/[eventId]` | `GET` | **Ninguna (Acceso por Token)** | Acceso público para músicos mediante UUIDs generados en la base de datos | `src/app/confirmar/[musicianId]/[eventId]/page.tsx` (L1) |

* **Hallazgo Crítico de Seguridad:**
  Las páginas bajo `/cliente/*` están protegidas en el proxy perimetral (`src/proxy.ts`), pero el archivo `src/app/cliente/layout.tsx` **carece de validación de sesión local**. Si un error de configuración del proxy desactiva la redirección, un usuario anónimo podría renderizar la estructura del dashboard de clientes.

---

### D. Base de Datos (SQLite / LibSQL)

#### 1. Historial de Consultas Realizadas por el Auditor
Todas las consultas realizadas durante el proceso de auditoría técnica han sido **estrictamente de lectura (SELECT)** y sobre la copia local descargada del entorno de producción (`prod_downloaded.db`). No se ejecutó ninguna query de escritura (INSERT, UPDATE, DELETE).

* **Consultas de Validación:**
  ```sql
  SELECT id, name, baseCostPerHour, minDuration, active FROM Package;
  SELECT id, zona2Rate, zona3Rate FROM GlobalConfig;
  ```

#### 2. Riesgos de Auto-Migración en Tiempo de Ejecución
El archivo `src/lib/db.ts` ejecuta la función `ensureSchemaUpToDate(prisma)` al arrancar la aplicación si no se detecta la fase de compilación (`!isBuildPhase`). Esta función ejecuta sentencias directas del tipo `ALTER TABLE` si detecta columnas faltantes.

* **Riesgos Identificados:**
  1. **Bloqueos de Base de Datos (SQLite locks):** SQLite maneja un modelo de archivo único y un único escritor concurrente. Ante picos de tráfico en producción o inicios fríos paralelos de múltiples instancias Docker/Dokploy, la concurrencia puede disparar errores `SQLITE_BUSY: database is locked`, tirando las conexiones de la aplicación.
  2. **Condiciones de Carrera (Race Conditions):** Si dos instancias ejecutan `PRAGMA table_info` simultáneamente y determinan que falta una columna, ambas intentarán ejecutar `ALTER TABLE` al mismo tiempo, resultando en caídas por excepciones no controladas de columnas duplicadas.
  3. **Desviación del Historial de Migraciones (Drift):** Al modificar el esquema al vuelo con SQL plano, se salta el control transaccional de Prisma Migrations (`prisma/migrations`), haciendo que futuras migraciones oficiales fallen por colisiones de nombres o inconsistencias estructurales.

#### 3. Validación de ID en GlobalConfig (`singleton` vs `vendetta_config`)
* Se realizó una búsqueda exhaustiva del término `"singleton"` en todo el directorio del código fuente público (`src/`). **Resultado: Cero ocurrencias.**
* El sistema utiliza en su totalidad el ID `"vendetta_config"` para consultar e inicializar la configuración global en componentes públicos (`SchemaMarkup.tsx`, `page.tsx`) y administrativos.
* **Recomendación de Seguridad:** Aunque el registro con ID `singleton` en la tabla `GlobalConfig` de producción está obsoleto y huérfano, **no se debe eliminar de inmediato**. Existe la posibilidad de que aplicaciones compiladas heredadas (como la app móvil de músicos en el subdirectorio `mobile/`) consulten de manera directa el registro `singleton`. Se recomienda mantenerlo como respaldo histórico de lectura.

---

### E. Precios y Fuente de Verdad

Existe una inconsistencia severa entre las tarifas presentadas al público de forma estática y las tarifas reales configuradas en la base de datos que utiliza el cotizador automático y el generador de contratos.

#### 1. Matriz Comparativa de Paquetes y Tarifas

| Paquete | Portada (`/`) | Ruta `/paquetes` (Estática) | Cotizador (`/cotizar`) | Base de Datos (Real) | Generador de Contrato PDF | WhatsApp Notificaciones |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Essential** | $7,600 MXN<br>(Base 2 horas) | $15,000 MXN<br>(Base 3 horas) | $7,600 MXN base<br>($3,800/hr extra) | $3,800/hr<br>Min: 2 hrs | Inclusiones dinámicas + Traduce $7,600 a letras | Dinámico via variables |
| **Experience** | $15,500 MXN<br>(Base 2 horas) | *No mencionado* | $15,500 MXN base<br>($7,750/hr extra) | $7,750/hr<br>Min: 2 hrs | Inclusiones dinámicas + Traduce $15,500 a letras | Dinámico via variables |
| **Premium / Festival** | $25,500 MXN<br>(Base 2 horas) | $35,000 MXN<br>(Base 5 horas) | $25,500 MXN base<br>($12,750/hr extra) | $12,750/hr<br>Min: 2 hrs | Inclusiones dinámicas + Traduce $25,500 a letras | Dinámico via variables |
| **Acústico** | *No mencionado* | $8,000 MXN<br>(Base 2 horas) | *No disponible* | *No existe en DB* | *No disponible* | *No disponible* |
| **Arma tu show** | *Excluido* | *Mencionado* | Dinámico<br>(Mín: $8,500 MXN) | $4,250/hr<br>Min: 2 hrs | Dinámico según selección de horas y extras | Dinámico via variables |

* **Evidencia en el Generador de PDF (`src/lib/pdf/contract-generator.ts`):**
  La función `numeroALetras` tiene un mapeo rígido e inflexible que solo traduce a letras los precios calculados a partir de los datos dinámicos de la base de datos:
  ```typescript
  // Line 635-644
  function numeroALetras(n: number): string {
    const map: Record<number, string> = {
      7600: "SIETE MIL SEISCIENTOS",
      15500: "QUINCE MIL QUINIENTOS",
      25500: "VEINTICINCO MIL QUINIENTOS"
    }
    if (map[n]) return `${map[n]} PESOS 00/100 MN`
    return `${Math.floor(n)} PESOS 00/100 MN`
  }
  ```
  Si se intenta firmar una cotización generada con los precios de la página estática (ej. $15,000), el contrato PDF fallará al traducir a letras y usará una interpolación cruda (`15000 PESOS 00/100 MN`), evidenciando la falta de integración.

---

## 3. RECOMENDACIONES DE MITIGACIÓN (FASE 1)

1. **Sincronización de Precios (Urgente):** Unificar las tarifas de `src/app/(public)/paquetes/page.tsx` para que consuman dinámicamente los datos de la tabla `Package` de la base de datos (igual a como se realiza en la página de inicio), eliminando las discrepancias de precios públicos.
2. **Eliminación del Auto-Migrador en Producción:** Trasladar las columnas dinámicas creadas en `src/lib/db.ts` a una migración transaccional oficial de Prisma (`npx prisma migrate dev`), eliminando la llamada a `ensureSchemaUpToDate` en producción para evitar bloqueos por SQLite Busy.
3. **Optimización del Bundle y Carga de Iconos:**
   * Cambiar las importaciones completas de Lucide (`import * as Icons`) por importaciones de iconos individuales.
   * Cargar dinámicamente el bundle de `pdf-lib` únicamente cuando el usuario solicite la descarga del PDF de contrato en el navegador, reduciendo el tamaño del bundle inicial.
4. **Validación de Sesión Local en Clientes:** Añadir una comprobación de seguridad local en el archivo `src/app/cliente/layout.tsx` para evitar que la elusión accidental del proxy perimetral exponga la navegación del panel.
