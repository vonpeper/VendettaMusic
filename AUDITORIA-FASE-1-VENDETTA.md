# AUDITORÍA DE PRODUCTO DIGITAL (FASE 1)
## PROYECTO: VENDETTA LIVE MUSIC (https://vendetta.mx)
**Rol:** Arquitecto Senior de Software, Especialista Técnico en Next.js, UX de Conversión, SEO Técnico y Auditor de Producto Digital.

---

## 1. Resumen Ejecutivo

Este informe detalla los hallazgos de la auditoría técnica, visual y de conversión realizada sobre el sitio público y el cotizador interactivo de **Vendetta Live Music**. El objetivo principal de la auditoría es evaluar el estado actual de la plataforma, identificando problemas críticos (P0-P3) y diseñando un plan de acción para disminuir la dependencia de bares y maximizar la conversión en bodas, eventos corporativos y eventos privados de alta gama.

A través de un análisis del repositorio (`vonpeper/VendettaMusic`) y de la base de datos de producción, se han descubierto varios errores silenciosos de alta prioridad:
1. **Error de Params Promise (P0/P1 SEO)**: En las páginas de ubicación de SEO, el acceso síncrono a los parámetros de la URL causa fallos en la generación de metadatos y en el renderizado bajo Next.js 16.
2. **Inactividad del Middleware de Seguridad (P0/P1)**: El middleware de geobloqueo y redirecciones de autenticación se encuentra en `src/proxy.ts` y no en `src/middleware.ts`, lo que provoca que Next.js ignore por completo las reglas de geobloqueo y la seguridad en el borde.
3. **Desalineación de Precios y Paquetes (P1 UX)**: Los precios y paquetes mostrados estáticamente al usuario final en la página `/paquetes` contradicen los valores de la base de datos utilizados por el cotizador interactivo.
4. **Fuga en el Embudo de Conversión (P1 UX/CRO)**: El proceso de cotización interactivo recopila los datos del cliente (nombre, WhatsApp, correo) en el último paso (Paso 5) después de solicitar información de pago (Paso 4), perdiendo el 100% de los leads que abandonan durante el flujo financiero.
5. **Secciones Inexistentes en el Portal del Cliente (P2 UX)**: El menú lateral del cliente apunta a subrutas inexistentes (`/mis-eventos`, `/pagos`, `/perfil`) generando errores 404 en producción.

El informe concluye con un inventario de tecnologías, mapa de rutas detallado, propuestas de rediseño arquitectónico y una matriz de prioridades detallada para guiar la ejecución sin comprometer la estabilidad actual.

---

## 2. Estado General

**Calificación de Salud del Proyecto: 7.8 / 10**

La base técnica de **Vendetta Live Music** es moderna, sólida y está muy bien estructurada. Sin embargo, adolece de problemas de sincronización entre el diseño estático, la base de datos de producción y los patrones actualizados de Next.js.

### Fortalezas del Proyecto
* **Stack Moderno y Rápido**: Next.js 16 con React 19 y Tailwind CSS v4, lo que provee de un rendimiento potencial excelente y un sistema de renderizado veloz.
* **Auto-Sanación de Base de Datos**: El archivo `src/lib/db.ts` incluye un mecanismo excelente para migrar y estructurar la base de datos de forma dinámica en tiempo de ejecución.
* **Flujos Automatizados de Stripe y Evolution API**: Los endpoints para recibir webhooks de Stripe (`src/app/api/webhooks/stripe/route.ts`) y la Evolution API (`src/app/api/webhooks/evolution/route.ts`) están bien codificados, permitiendo una automatización fluida tras la confirmación de pagos.
* **Identidad Visual Premium**: El diseño estético con temática oscura y acentos rojos (Vendetta Red) se siente sofisticado, moderno y enfocado en eventos de alto valor.

### Debilidades y Puntos Críticos
* **Falta de Validación de Convenciones de Next.js**: Errores críticos como no nombrar el archivo de middleware correctamente (`proxy.ts` en lugar de `middleware.ts`) o acceder síncronamente a los parámetros en Next.js 16 rompen la lógica de SEO y seguridad.
* **Fricción en la Captura de Prospectos (Fuga de Leads)**: La secuencia de pasos en el cotizador interactivo está invertida respecto a las mejores prácticas de optimización de tasa de conversión (CRO), ahuyentando a usuarios antes de registrar su información de contacto.
* **Inconsistencias de Información Estática vs. Dinámica**: Gran parte de la información pública se mantiene cableada de forma estática en el código (como el repertorio en `/repertorio` y los paquetes en `/paquetes`), a pesar de tener tablas y registros dedicados en la base de datos.

---

## 3. Inventario Tecnológico

El análisis del archivo [package.json](file:///Users/vonpeper/Documents/Antigravity/Vendetta/package.json) y la estructura del proyecto revela las siguientes tecnologías:

* **Framework Principal**: Next.js v16.2.4 (App Router bajo `src/app`).
* **Librería de Componentes Core**: React v19.2.4 (y `react-dom` v19.2.4).
* **Lenguaje**: TypeScript v5.x en modo estricto.
* **Sistema de Estilos**: Tailwind CSS v4.0.0 (utilizando la sintaxis CSS-first en `src/app/globals.css`).
* **Librerías de Animación**: Framer Motion v12.38.0 y `@tailwindcss/postcss` para transiciones y micro-interacciones interactivas.
* **Librerías de UI / Iconografía**: Radix UI (shadcn/ui v4.8.2 en `src/components/ui`), Lucide React v1.7.0.
* **Autenticación**: NextAuth v5.0.0-beta.30 (configurado en `src/lib/auth.ts` y `src/lib/auth.config.ts`).
* **Base de Datos y ORM**: SQLite (`vendetta_production.db` en producción) administrado con Prisma ORM v7.8.0 y el adaptador `@prisma/adapter-libsql` v0.17.2 en `src/lib/db.ts`.
* **Almacenamiento**: Volúmenes persistentes locales en Docker (`/opt/vendetta/public/...`).
* **Formularios**: React Hook Form v7.72.1 con el resolutor Zod v5.2.2.
* **Pagos**: Stripe SDK v19.3.0 (`src/lib/stripe.ts`) procesando tarjetas y OXXO en pesos mexicanos (MXN).
* **Integraciones**:
  * **Evolution API (v2)**: En `src/lib/notifications.ts` para el envío de alertas y notificaciones a clientes y músicos mediante WhatsApp.
  * **Google Calendar API**: En `src/lib/google-calendar.ts` para sincronizar eventos aprobados en un calendario de Google.
  * **PDF Generation**: `pdf-lib` v1.17.1 para la generación automatizada de contratos de eventos en PDF (`src/lib/pdf/contract-generator.ts`).

---

## 4. Mapa de Rutas

A continuación se detalla el mapeo completo de las páginas públicas, rutas protegidas del cliente, panel de administración y endpoints de API en `src/app`:

### A. Espacio Público (`src/app/(public)/`)
1. **Home (`/`)**: Renderizado dinámico (`force-dynamic`). Carga eventos futuros y reseñas de clientes desde la base de datos.
2. **Nosotros (`/nosotros`)**: Página estática de presentación institucional.
3. **Servicios (`/servicios`)**: Detalle de servicios de producción y entretenimiento.
4. **Paquetes (`/paquetes`)**: Página estática con tarifas y contenidos hardcoded.
5. **Repertorio (`/repertorio`)**: Listado estático de canciones ordenado por géneros.
6. **Contacto (`/contacto`)**: Formulario básico de contacto.
7. **Cotizar (`/cotizar`)**: Cotizador interactivo multietapa para configurar eventos y calcular viáticos.
8. **Estatus (`/status`)**: Formulario para buscar el folio de seguimiento de un evento (`VND-XXXX`).
9. **Detalle de Estatus (`/status/[id]`)**: Página dinámica de seguimiento de la propuesta/contrato, firma legal digital y datos bancarios para depósitos.
10. **Aterrizaje por Ubicación (`/musica-para-eventos/[slug]`)**: Landings de SEO optimizadas para Toluca, CDMX y Valle de Bravo.
11. **Blog / Noticias (`/noticias/[slug]`)**: Renderizado dinámico de artículos en formato markdown.

### B. Espacio de Clientes (`src/app/cliente/`)
1. **Dashboard Cliente (`/cliente`)**: Panel centralizado tras inicio de sesión.
2. **Mis Eventos (`/cliente/mis-eventos`)**: **[404 NOT FOUND]** Enlace roto.
3. **Pagos (`/cliente/pagos`)**: **[404 NOT FOUND]** Enlace roto.
4. **Perfil (`/cliente/perfil`)**: **[404 NOT FOUND]** Enlace roto.

### C. Espacio de Músicos (`src/app/musico/`)
1. **Dashboard Músico (`/musico`)**: Visualización de eventos asignados.
2. **Confirmación de Fecha (`/confirmar/[musicianId]/[eventId]`)**: Flujo externo directo para que los músicos acepten/rechacen llamadas de shows.

### D. Espacio de Administración (`src/app/admin/`)
1. **Dashboard General (`/admin`)**: Métricas de ventas, conversiones y calendario de shows.
2. **Configuración (`/admin/configuracion`)**: Ajustes de la Evolution API, cuentas bancarias, viáticos y enlaces sociales.
3. **Testimoniales (`/admin/testimoniales`)**: Aprobación o rechazo de reseñas enviadas por clientes.
4. **Ventas (`/admin/ventas`)**: Listado de solicitudes de cotización.
5. **Detalle de Venta (`/admin/ventas/[id]`)**: Seguimiento interno de la negociación, cotizador manual y logs de notificaciones enviadas.
6. **Músicos (`/admin/musicos`)**: Gestión de integrantes de la banda y tabulador de pagos.
7. **Eventos (`/admin/eventos`)**: Calendario y asignación de personal.
8. **Repertorio (`/admin/repertorio`)**: Catálogo global de canciones editables.
9. **Clientes (`/admin/clientes`)**: Lista de clientes registrados históricamente.
10. **Pagos (`/admin/pagos`)**: Seguimiento de anticipos y liquidaciones pendientes.
11. **Media (`/admin/media`)**: Repositorio de subida de assets multimedia.

### E. Endpoints de API (`src/app/api/`)
* **`/api/booking`**: POST para crear solicitudes y PUT/PATCH/DELETE para gestiones administrativas.
* **`/api/viaticos`**: GET para calcular automáticamente los viáticos y peajes según coordenadas.
* **`/api/payment-info`**: GET para servir datos bancarios de transferencia sin exponerlos en bundles de cliente.
* **`/api/payments/create-checkout`**: POST para generar sesiones de Stripe.
* **`/api/webhooks/stripe`**: Procesamiento de pagos completados, alertas de cargos y reembolsos.
* **`/api/webhooks/evolution`**: Recepción de confirmaciones de WhatsApp y actualización de estatus.
* **`/api/admin/*`**: Funciones administrativas de mantenimiento (`migrate`, `repair`, `locations`, `follow-up`).

---

## 5. Auditoría Visual y de Identidad

* **Paleta de Colores**: Cumple con altos estándares estéticos. Utiliza un fondo negro puro (`#000000` / `oklch(0 0 0)`) con acentos de color rojo vibrante (Vendetta Red, `oklch(0.6 0.25 29)`) y textos claros de alto contraste en `oklch(0.985 0 0)`.
* **Tipografía**: La tipografía de cabeceras Outfit (`font-heading`) y cuerpo de texto Inter (`font-sans`) están configuradas a través de variables CSS nativas, transmitiendo un carácter moderno, limpio y premium.
* **Interacciones y Efectos Visuales**: La inclusión de clases personalizadas como `.animated-title` (degradado animado en bucle de 5 segundos), hover en imágenes de la galería con efectos de escala y desenfoques decorativos con filtros de fondo confieren al sitio un aspecto extremadamente pulido.
* **Diseño del Panel Administrativo**: El uso de una interfaz clara contrastante (`.admin-theme` en `oklch(0.96 0 0)`) con tarjetas blancas y acentos en azul (`oklch(0.55 0.20 250)`) separa visualmente el área pública del área de control de manera correcta.
* **Identidad e Imagen**: Todos los logos, iconos de Lucide y fotos en la galería apuntan a rutas locales o imágenes integradas en alta calidad de Unsplash, evitando placeholders.

---

## 6. Arquitectura de Información

* **Estructura del Contenido**: El sitio web presenta un mapa lógico y directo en su cabecera. Sin embargo, la mayor deficiencia radica en la desvinculación de los datos entre la base de datos de producción y las vistas públicas.
* **Sincronización del Repertorio**: El catálogo de canciones público (`/repertorio`) se encuentra cableado directamente en el código de la página `src/app/(public)/repertorio/page.tsx` (con ~25 canciones), ignorando por completo la tabla `Song` de la base de datos que cuenta con más de 200 canciones estructuradas por género, artista y estatus de ensayo. Esto priva al cliente de ver la magnitud real de la banda.
* **Sincronización de Paquetes**: El archivo `src/app/(public)/paquetes/page.tsx` lista los paquetes estáticamente con información desactualizada, mientras que el cotizador y la base de datos de producción consultan la tabla `Package` para calcular tarifas dinámicas basadas en horas y configuraciones reales.
* **Scannability**: En móviles y tablets, el espaciado de secciones, jerarquía de tamaños de letra y contenedores redondeados (`rounded-[2.5rem]`) son correctos y fáciles de consumir.

---

## 7. Conversión (CRO)

### Análisis del Embudo (Fuga Crítica)
El cotizador interactivo (`FunnelWizard` en `src/app/(public)/cotizar/page.tsx`) está diseñado en 5 pasos:
1. **Paso 1: Paquete y Extras** (`Step1_Paquete.tsx`)
2. **Paso 2: Ubicación y Viáticos** (`Step2_Ubicacion.tsx`)
3. **Paso 3: Fecha** (`Step3_Fecha.tsx`)
4. **Paso 4: Anticipo e Información Financiera** (`Step4_Pago.tsx`)
5. **Paso 5: Registro de Datos de Contacto** (`Step5_Registro.tsx`)

> [!CAUTION]
> **Fuga Crítica de Leads**: Al requerir la selección del método de pago (Paso 4) *antes* de registrar los datos del cliente (Paso 5), cualquier usuario que se asuste por el precio, no tenga su tarjeta a la mano, o no confíe en el método de pago, abandonará el flujo sin dejar rastro. La plataforma no registra nada en la base de datos hasta que el Paso 5 es enviado. Esto imposibilita cualquier campaña de recuperación de carrito abandonado.

### Otros Elementos de Conversión
* **Llamados a la Acción (CTAs)**: Los botones para iniciar la cotización están presentes en las secciones clave del menú y secciones internas.
* **Fórmula de Descuentos**: El código promocional `CLIENTEVIP` está hardcoded dentro del código de `Step1_Paquete.tsx` (descuento de $1,000 MXN exclusivo para el paquete "Essential"). Lo ideal sería mover los cupones a la base de datos para habilitar campañas promocionales dinámicas.
* **Botón de WhatsApp**: El botón de contacto flotante (`WhatsAppButton.tsx`) está cableado a un número estático (`527222417045`), omitiendo el número configurado dinámicamente en el panel de administración.

---

## 8. SEO Técnico

### Metadatos y Estructura
* **Parámetros Síncronos en Rutas Dinámicas (Crash de Next.js 16)**:
  * **Archivo afectado**: [src/app/(public)/musica-para-eventos/[slug]/page.tsx](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/app/(public)/musica-para-eventos/[slug]/page.tsx) (Líneas 33-34 y 60-61).
  * **Problema**: Accede a `params.slug` de forma síncrona. Next.js 16 requiere obligatoriamente que `params` sea tratado como una Promesa. Esto causa errores de compilación y renderizado en las landing pages de ubicación, dañando directamente la indexación de las páginas principales de aterrizaje.
* **Estructura del Middleware / Bloqueo Geo (Riesgo en Edge / CF)**:
  * **Archivo afectado**: [src/proxy.ts](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/proxy.ts).
  * **Problema**: El middleware de protección de rutas y geobloqueo está nombrado como `proxy.ts` en lugar de `middleware.ts`. Next.js ignora por completo el archivo, dejando las rutas de `/admin` y `/cliente` desprotegidas en el borde (aunque los layouts tienen protecciones locales). 
  * Si se activara renombrándolo a `middleware.ts`, el geobloqueo actual de México (`country !== "MX"`) devolvería un HTTP 403 a herramientas externas de auditoría web (Lighthouse, PageSpeed Insights, pingdom) y bots de indexación que no estén incluidos en la expresión regular `BOT_UA_RE` (la cual carece de firmas para estas herramientas).
* **Marcado Schema (JSON-LD)**:
  * **Archivo**: [src/components/public/SchemaMarkup.tsx](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/components/public/SchemaMarkup.tsx).
  * **Problema**: Está sumamente completo (Organization, MusicGroup, WebSite, FAQPage, MusicEvent). No obstante, realiza la consulta `where: { id: "vendetta_config" }` en la base de datos. Si el ID de configuración principal es `singleton` (o el registro está duplicado), esto puede devolver `null` y romper los valores del schema, haciendo que caiga en valores por defecto.

---

## 9. SEO Comercial

### Estrategia de Contenidos y Redacción
* **Páginas de Ubicación**: Excelente redacción de copys optimizados para conversiones locales en Toluca, Metepec, CDMX y Valle de Bravo.

### Detritus en Artículos de Noticias (Blog)
* **Carpeta afectada**: `src/content/noticias/` (especialmente [20-canciones-90s.md](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/content/noticias/20-canciones-90s.md) y [wtc-comexane.md](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/content/noticias/wtc-comexane.md)).
* **Hallazgo**: Los archivos markdown de noticias contienen restos de texto y enlaces rotos provenientes de una exportación descuidada de un CMS anterior (presumiblemente WordPress):
  * Cuentan con fragmentos como `[0Vendetta...]` y números huérfanos de paginación (`[92](...)`, `[34](...)`).
  * Repetición de bloques completos de enlaces internos al final de cada post.
  * **Enlaces rotos de autocompletado**: Enlaces rotos estructurados como `[Vendetta](https://vendetta.mx/slug-de-noticia/www.vendetta.mx)` concatenando el dominio dos veces de forma errónea. Esto crea una mala experiencia de usuario y penalizaciones por enlaces rotos ante motores de búsqueda.

---

## 10. Rendimiento (Performance)

* **Imágenes Pesadas**: La sección de galería (`PhotoGallery.tsx`) y los banners de ubicaciones cargan imágenes en crudo desde URLs de Unsplash sin pasar por optimizaciones de compresión responsiva (`sizes` está bien definido en la cuadrícula de la galería, pero el Lightbox despliega la etiqueta `<img>` estándar con la resolución original).
* **Auditoría de Scripts y CSS**: Tailwind v4 optimiza el tamaño final del archivo CSS empaquetado eliminando reglas no utilizadas de forma nativa.
* **Componentes de Servidor**: Las páginas dinámicas que extraen datos (`UpcomingGigs.tsx`, `page.tsx`) están marcadas correctamente como componentes de servidor asíncronos para evitar demoras de carga del lado del cliente, excepto por los wizards y modales interactivos que usan `"use client"`.

---

## 11. Accesibilidad (a11y)

* **Botones sin Nombre Accesible (WCAG 2.2 AA)**:
  * En la galería (`PhotoGallery.tsx`), los botones de navegación de diapositivas (`ChevronLeft` y `ChevronRight`) y el botón para cerrar el Lightbox (`X`) no cuentan con la etiqueta `aria-label` ni contenido `sr-only`, lo que impide que un lector de pantalla entienda su función.
  * En la visualización de detalles de paquete (`PaquetesSection.tsx`), el botón para cerrar el modal interactivo carece igualmente de etiquetas descriptivas accesibles.
* **Contraste de Texto**: Cumple los ratios de contraste debido a la combinación de colores negro, blanco y rojo vibrante sobre fondos oscuros.
* **Navegación por Teclado**: Los botones interactivos y enlaces del navbar carecen de estilos de enfoque claros (`focus-visible`) para usuarios que navegan mediante tabulación en teclado.

---

## 12. Contenido Desactualizado y Deuda Técnica

1. **Paquetes Cableados en Código**: La página estática `/paquetes` muestra información desalineada respecto a las tarifas y horas mínimas de la base de datos de producción (usadas por el cotizador interactivo):
   * En `/paquetes` se lista el paquete *Essential* con 3 horas por $15,000 MXN. En la base de datos (y cotizador) se lista con 2 horas por $7,600 MXN.
   * Se lista el paquete *Acústico* por $8,000 MXN, el cual no está registrado en la base de datos.
   * En el cotizador existe el paquete *Experience* ($15,500 MXN / 2 horas), pero no se menciona en la página estática `/paquetes`.
2. **Repertorio Manual**: La página de repertorio estático `/repertorio` tiene una lista hardcoded de sólo 25 canciones, ocultando el repertorio real de más de 200 temas que gestiona el administrador en el panel `/admin/repertorio`.
3. **Enlaces Rotos en el Panel de Clientes**: En [src/app/cliente/page.tsx](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/app/cliente/page.tsx), los accesos a `/cliente/mis-eventos`, `/cliente/pagos` y `/cliente/perfil` apuntan a rutas que no existen en el sistema físico de carpetas de Next.js, arrojando errores 404 al cliente final.
4. **Residuos de Migración de Base de Datos**: Presencia de la fila con ID `singleton` y la fila `vendetta_config` de forma simultánea en la tabla `GlobalConfig`. La fila `singleton` contiene configuraciones obsoletas que ya no se consultan.

---

## 13. Riesgos Técnicos

* **El "Falso Middleware"**: Al llamarse `proxy.ts`, los endpoints de la API en `/api/admin/*` y `/api/booking` carecen de protección a nivel de middleware. Aunque cuentan con validaciones manuales locales implementadas en los layouts y en los endpoints mediante `requireAdmin()`, la ausencia de un middleware funcional incrementa el riesgo de vulnerabilidades de seguridad por descuidos en nuevos endpoints.
* **Crash al Actualizar Next.js**: Mantener código con acceso síncrono a `params` en las landings de ubicación (`musica-para-eventos/[slug]`) provocará un fallo inmediato del build de producción en la siguiente actualización del framework Next.js.
* **Configuraciones Huérfanas de Evolution API y Stripe**: En caso de que se intente crear una nueva configuración a través de `/admin/configuracion`, se podría estar sobrescribiendo únicamente una fila en la base de datos (`vendetta_config`), dejando la otra (`singleton`) intacta, lo cual causaría inconsistencias en componentes antiguos que consulten el ID incorrecto.

---

## 14. Arquitectura Propuesta

Para resolver los problemas anteriores sin comprometer la estabilidad actual del proyecto, se proponen las siguientes soluciones arquitectónicas:

### A. Corrección y Activación del Middleware
1. Renombrar `src/proxy.ts` a `src/middleware.ts` para que Next.js compile y ejecute las reglas.
2. Actualizar el filtro de geobloqueo para evitar el bloqueo a herramientas de diagnóstico:
   ```ts
   // Agregar firmas de auditoría al regex de bots para evitar el bloqueo de Lighthouse/PageSpeed
   const BOT_UA_RE = /(googlebot|bingbot|duckduckbot|slurp|baiduspider|yandex|applebot|facebookexternalhit|twitterbot|linkedinbot|telegrambot|whatsapp|discordbot|slackbot|embedly|preview|lighthouse|chrome-lighthouse|gtmetrix|pingdom)/i
   ```
3. Excluir explícitamente del geobloqueo los archivos de SEO dinámicos (`/sitemap.xml`, `/robots.txt`):
   ```ts
   const isSeoFile = nextUrl.pathname === "/robots.txt" || nextUrl.pathname === "/sitemap.xml"
   if (country && country !== "MX" && !isBot && !isSeoFile) {
     return new NextResponse("Access Denied", { status: 403 })
   }
   ```

### B. Corrección de la Promesa de Parámetros (Next.js 16)
Actualizar el manejo de parámetros en `src/app/(public)/musica-para-eventos/[slug]/page.tsx` para convertirlos en promesas asíncronas:
```tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const loc = LOCATIONS[slug]
  // ...
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const loc = LOCATIONS[slug]
  // ...
}
```

### C. Reordenamiento del Embudo del Cotizador
Para solucionar la fuga de prospectos sin alterar las pantallas existentes, se propone intercambiar el orden del Paso 4 (Métodos de pago/Anticipo) y el Paso 5 (Datos de registro):
1. **Nuevo Paso 4 (Registro de Datos)**: Capturar Nombre, Teléfono (WhatsApp) e Email. Al dar clic en "Continuar", se realiza la petición POST para registrar la solicitud en la base de datos en estado `pendiente` con el método de pago por definir.
2. **Nuevo Paso 5 (Selección de Anticipo / Pago)**: Presentar las opciones de Stripe, transferencia o cotización manual.
   * Si selecciona Stripe, se redirige inmediatamente a la pasarela de pagos.
   * Si selecciona transferencia, se le muestran los datos bancarios y el folio.
   * Si abandona la página en este último paso, los datos del cliente ya están seguros en la base de datos y el administrador puede contactarlo automáticamente a través del flujo de la Evolution API.

### D. Centralización de Datos Públicos
1. **Repertorio Dinámico**: Modificar la página pública `/repertorio` para que sea un componente de servidor que realice la consulta a la base de datos:
   ```ts
   const songs = await db.song.findMany({ where: { active: true } })
   ```
2. **Paquetes Dinámicos**: Modificar la página pública `/paquetes` para recuperar la información de los paquetes directo desde `db.package.findMany({ where: { active: true } })`, eliminando la discrepancia de precios en el código estático.

---

## 15. Matriz de Prioridades (P0-P3)

| ID | Hallazgo / Problema | Componente / Ruta | Prioridad | Impacto | Esfuerzo | Solución Sugerida |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `params.slug` síncrono en Next.js 16 | `/musica-para-eventos/[slug]` | **P0** | **Muy Alto** (Crash SEO) | Bajo | Modificar firmas para recibir `params` como `Promise` y usar `await params`. |
| **02** | Middleware inactivo por nombre de archivo incorrecto | `src/proxy.ts` | **P0** | **Muy Alto** (Seguridad) | Bajo | Renombrar archivo a `src/middleware.ts` y corregir matcher de exclusión para `/robots.txt` y `/sitemap.xml`. |
| **03** | Fuga del 100% de leads caídos en Paso 4 del cotizador | `/cotizar` | **P1** | **Alto** (Pérdida de Clientes) | Medio | Invertir el orden de los pasos 4 y 5 en `FunnelWizard.tsx`. |
| **04** | Enlaces rotos (404) en el Portal del Cliente | `/cliente/...` | **P1** | **Medio-Alto** (Fidelización) | Bajo-Medio | Crear las carpetas de rutas correspondientes en `src/app/cliente/` con layouts consistentes. |
| **05** | Paquetes y precios estáticos desalineados con BD | `/paquetes` | **P1** | **Alto** (Confusión de Precios) | Medio | Consultar la base de datos mediante Prisma en la carga del servidor de la página `/paquetes`. |
| **06** | Repertorio público limitado y desvinculado de BD | `/repertorio` | **P2** | **Medio** (Social Proof / Info) | Medio | Migrar listado de repertorio público para leer desde la tabla `Song` de la base de datos. |
| **07** | Detritus en la importación de Markdown de blog | `/noticias/[slug]` | **P2** | **Medio** (Estética / SEO links) | Bajo | Limpiar cadenas vacías, enlaces duplicados y caracteres inválidos de los archivos MD. |
| **08** | Botones sin etiquetas de accesibilidad | `/repertorio`, `/cotizar` | **P2** | **Bajo** (Accesibilidad WCAG) | Bajo | Añadir `aria-label` descriptivos a los iconos de navegación y modales. |
| **09** | Cuentas duplicadas de configuración global | Tabla `GlobalConfig` | **P2** | **Medio** (Inconsistencia) | Bajo | Ejecutar un script para migrar los campos de la cuenta `singleton` a `vendetta_config` y eliminar `singleton`. |
| **10** | Número de WhatsApp hardcoded en botón flotante | `WhatsAppButton.tsx` | **P3** | **Bajo** (Administración) | Bajo | Leer el número de WhatsApp desde `GlobalConfig` mediante un Server Action o Contexto. |

---

## 16. Plan Recomendado de Implementación

Este plan de trabajo está estructurado en 3 fases de implementación segura:

### Fase 1: Estabilización de SEO y Seguridad (Sprint 1)
* **Objetivo**: Corregir los crashes de compilación y habilitar el middleware de forma segura sin bloquear las herramientas de indexación.
* **Tareas**:
  1. Actualizar el componente `/musica-para-eventos/[slug]` para manejar `params` de forma asíncrona.
  2. Renombrar `src/proxy.ts` a `src/middleware.ts`.
  3. Modificar `src/middleware.ts` agregando las firmas de diagnóstico de Lighthouse, GTmetrix y Pingdom al array `BOT_UA_RE`.
  4. Excluir las rutas de `/robots.txt` y `/sitemap.xml` del bloqueo regional de IPs.
  5. Validar compilación local y generar el correspondiente Pull Request contra la rama `main`.

### Fase 2: Optimización del Embudo de Conversión (Sprint 2)
* **Objetivo**: Evitar la pérdida de prospectos en el cotizador y alinear los datos comerciales públicos con la base de datos.
* **Tareas**:
  1. Reordenar los pasos del cotizador interactivo (`FunnelWizard.tsx`) para capturar la información del cliente antes de desplegar opciones de pago.
  2. Implementar llamadas de API asíncronas en `/paquetes` y `/repertorio` para jalar los paquetes y canciones directamente desde Prisma.
  3. Eliminar la cuenta obsoleta `singleton` de `GlobalConfig` en la base de datos de producción mediante una migración segura.

### Fase 3: Corrección de Enlaces y a11y (Sprint 3)
* **Objetivo**: Restaurar la funcionalidad completa del portal del cliente, limpiar el blog y pulir la accesibilidad.
* **Tareas**:
  1. Crear las carpetas de páginas dinámicas en `/cliente/mis-eventos`, `/cliente/pagos` y `/cliente/perfil` reutilizando componentes del panel administrativo para evitar el 404.
  2. Limpiar el detritus de los 4 archivos markdown en `src/content/noticias/`.
  3. Agregar etiquetas `aria-label` a los elementos interactivos que carezcan de texto y corregir los focos del teclado.

---

## 17. Archivos que Probablemente Deberán Modificarse

Para la ejecución del plan recomendado, se anticipa la modificación de los siguientes archivos:

* **Seguridad y Redirecciones**:
  * [src/proxy.ts](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/proxy.ts) (Renombrar a `src/middleware.ts` y corregir)
* **SEO e Indexación**:
  * [src/app/(public)/musica-para-eventos/[slug]/page.tsx](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/app/(public)/musica-para-eventos/[slug]/page.tsx)
* **Optimización del Cotizador (CRO)**:
  * [src/components/funnel/FunnelWizard.tsx](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/components/funnel/FunnelWizard.tsx)
  * [src/components/funnel/Step4_Pago.tsx](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/components/funnel/Step4_Pago.tsx)
  * [src/components/funnel/Step5_Registro.tsx](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/components/funnel/Step5_Registro.tsx)
* **Alineación de Contenidos Públicos**:
  * [src/app/(public)/paquetes/page.tsx](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/app/(public)/paquetes/page.tsx)
  * [src/app/(public)/repertorio/page.tsx](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/app/(public)/repertorio/page.tsx)
* **Blog y Noticias**:
  * Todos los archivos en `src/content/noticias/*.md`
* **Botón de WhatsApp Flotante**:
  * [src/components/public/WhatsAppButton.tsx](file:///Users/vonpeper/Documents/Antigravity/Vendetta/src/components/public/WhatsAppButton.tsx)
* **Portal del Cliente**:
  * Creación de nuevas subrutas en la carpeta `src/app/cliente/`

---

## 18. Información que Debe Confirmar el Propietario

Antes de proceder con los cambios sugeridos, es fundamental aclarar los siguientes aspectos comerciales y operativos con el propietario de la banda:

1. **Precios de los Paquetes**: ¿Cuáles son las tarifas oficiales de contratación para bodas y eventos privados para el 2026? Se requiere validar si los precios y horas del cotizador ($7,600 MXN / 2 hrs para Essential) son los correctos o si deben prevalecer los de la landing page de paquetes ($15,000 MXN / 3 hrs).
2. **Tabulador de Viáticos**: ¿El tabulador de viáticos y tarifas de peaje calculadas automáticamente en `/api/viaticos` refleja el costo real de transporte de la banda para el 2026?
3. **Portal del Cliente**: ¿Qué características se esperan del portal del cliente en `/cliente/mis-eventos` y `/cliente/pagos`? ¿Es prioritario construirlos en esta fase o se prefiere redirigir temporalmente estos botones del menú lateral hacia el folio de estatus directo `/status/[id]`?
4. **Política de Geobloqueo**: ¿Se desea mantener activo el geobloqueo para usuarios fuera de México? De ser así, se debe confirmar si es aceptable habilitar el paso para herramientas de diagnóstico técnico internacionales necesarias para auditorías de rendimiento frecuentes.
5. **Número de WhatsApp de Contacto**: ¿El número oficial de contacto de WhatsApp para atención y soporte seguirá siendo el `+52 722 241 7045`?
