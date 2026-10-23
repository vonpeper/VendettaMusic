# Guía Completa de Integración Google Suite (Calendar, Search Console y Analytics GA4)

Esta guía explica detalladamente cómo conectar **Google Calendar**, **Google Search Console** y **Google Analytics 4 (GA4)** con el sistema administrativo de **Vendetta Music**, permitiendo sincronizar la agenda y consultar todas las métricas de tráfico y posicionamiento directamente desde el panel.

---

## 1. Configuración del Proyecto en Google Cloud Console

1. Ingresa a la [Consola de Google Cloud](https://console.cloud.google.com/).
2. Inicia sesión con la cuenta de Google propietaria del dominio y las propiedades analíticas (o tu cuenta de administración).
3. Selecciona tu proyecto existente (ej. `Vendetta Music`) o crea uno nuevo.

---

## 2. Habilitar las APIs Requeridas

En el menú lateral de Google Cloud, navega a **APIs y servicios** > **Biblioteca** y habilita las siguientes 3 APIs:

1. **Google Calendar API** (para la sincronización bidireccional de shows confirmados).
2. **Google Analytics Data API** (para consultar usuarios, sesiones, páginas y canales de GA4 desde el servidor).
3. **Google Search Console API** (o *Search Console API*, para consultar clics, impresiones, CTR y posiciones de palabras clave).

---

## 3. Configurar la Pantalla de Consentimiento OAuth

1. Ve a **APIs y servicios** > **Pantalla de consentimiento de OAuth**.
2. Tipo de usuario: **Externo**.
3. **Permisos (Scopes):** Agrega los siguientes 3 permisos:
   - `https://www.googleapis.com/auth/calendar` (Google Calendar)
   - `https://www.googleapis.com/auth/analytics.readonly` (Google Analytics - Ver datos de Google Analytics)
   - `https://www.googleapis.com/auth/webmasters.readonly` (Google Search Console - Ver datos de Search Console)
4. **Usuarios de prueba (Test users):**
   - Agrega el correo exacto de Gmail o Google Workspace con el que vas a autorizar la cuenta.

---

## 4. Crear Credenciales (OAuth 2.0 Web Client)

1. Ve a **APIs y servicios** > **Credenciales**.
2. Haz clic en **Crear credenciales** > **ID de cliente de OAuth**.
3. Tipo de aplicación: **Aplicación web**.
4. **Orígenes de JavaScript autorizados:**
   - `https://vendetta.mx`
   - `http://localhost:3006` (para pruebas locales si aplica)
5. **URI de redireccionamiento autorizados:**
   - `https://vendetta.mx/api/auth/google/callback`
   - `http://localhost:3006/api/auth/google/callback`
6. Guarda y copia el **Client ID** y el **Client Secret**.

---

## 5. Obtener los Identificadores de GA4 y Search Console

### A. Google Analytics 4:
1. Entra a [Google Analytics](https://analytics.google.com/).
2. Haz clic en el engranaje inferior **Administrar** (Admin).
3. En la columna de **Propiedad**, haz clic en **Detalles de la propiedad** (Property Details).
4. Copia el **ID de la propiedad** (un número de 9 dígitos, ej: `439281729`).
5. En **Flujos de datos** (Data Streams) > haz clic en tu flujo web de `vendetta.mx` y copia el **ID de medición** (ej: `G-XXXXXXXXXX`).

### B. Google Search Console:
1. Entra a [Google Search Console](https://search.google.com/search-console).
2. En el selector superior izquierdo, verifica cómo está registrado tu sitio:
   - Propiedad de prefijo de URL: `https://vendetta.mx`
   - Propiedad de dominio: `sc-domain:vendetta.mx`
3. Asegúrate de que la cuenta de correo con la que autorizas OAuth en Vendetta tenga permisos de **Propietario** o **Usuario con permiso completo** en dicha propiedad.

---

## 6. Guardar y Vincular en el Panel de Vendetta

1. Entra a `https://vendetta.mx/admin/configuracion?tab=integraciones`.
2. En la sección **Google Workspace Suite**, ingresa:
   - **Client ID**
   - **Client Secret**
   - **Google Calendar ID** (tu correo o ID de calendario secundario)
   - **Search Console Site URL** (`https://vendetta.mx`)
   - **GA4 Property ID** (el ID numérico)
   - **GA4 Measurement ID** (`G-XXXXXXXXXX`)
3. Haz clic en **Guardar Configuración Google Suite**.
4. Haz clic en el botón azul **Vincular Cuenta de Google**.
5. Concede los permisos solicitados en la pantalla de Google.
6. Al regresar, el estado mostrará **"OAuth Conectado"**.
7. Ve a la barra lateral en **MÉTRICAS** > **Google Analytics & SEO** (`/admin/analytics`) para consultar tus métricas en tiempo real.
