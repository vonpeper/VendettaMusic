# Guía de Integración de Google Calendar

Esta guía te guiará paso a paso para obtener las credenciales necesarias (**Client ID** y **Client Secret**) desde la consola de Google Cloud, configurar tu **ID de Calendario** y vincular tu cuenta.

---

## Paso 1: Crear un Proyecto en Google Cloud

1. Entra a la [Consola de Google Cloud](https://console.cloud.google.com/).
2. Inicia sesión con la cuenta de Google (Gmail o Google Workspace) donde tienes el calendario que deseas sincronizar.
3. En la barra superior (al lado del logotipo de Google Cloud), haz clic en el selector de proyectos y selecciona **Nuevo Proyecto** (New Project).
4. Dale un nombre identificable (por ejemplo, `Vendetta Music`) y haz clic en **Crear**.

---

## Paso 2: Habilitar la API de Google Calendar

1. En el menú lateral izquierdo de la consola de Google Cloud, navega a **API y servicios** (APIs & Services) > **Biblioteca** (Library).
2. En la barra de búsqueda escribe: `Google Calendar API`.
3. Haz clic sobre el resultado de **Google Calendar API**.
4. Haz clic en el botón azul **Habilitar** (Enable).

---

## Paso 3: Configurar la Pantalla de Consentimiento de OAuth

Antes de crear las claves, debes definir cómo se mostrará la pantalla de inicio de sesión de Google.

1. Ve a **API y servicios** > **Pantalla de consentimiento de OAuth** (OAuth consent screen).
2. Selecciona **Externo** (External) y haz clic en **Crear** (Create).
3. **Información de la aplicación**:
   * **Nombre de la aplicación**: `Vendetta`
   * **Correo electrónico de soporte del usuario**: Selecciona tu correo de la lista.
   * **Información de contacto del desarrollador**: Escribe tu correo electrónico.
   * Haz clic en **Guardar y continuar**.
4. **Permisos (Scopes)**:
   * Haz clic en **Agregar o eliminar campos** (Add or remove scopes).
   * En la tabla, busca y selecciona el permiso: `.../auth/calendar` (Ver, editar, compartir y eliminar permanentemente todos los calendarios).
   * Haz clic en **Actualizar** en la parte inferior de la ventana emergente.
   * Haz clic en **Guardar y continuar**.
5. **Usuarios de prueba (Test users)** (⚠️ MUY IMPORTANTE):
   * Como tu proyecto estará en modo "Prueba" (no verificado públicamente por Google, lo cual es normal para uso interno), debes autorizar qué cuentas pueden iniciar sesión.
   * Haz clic en **Add Users** (Agregar usuarios).
   * Escribe el **correo electrónico exacto** con el que vas a iniciar sesión para sincronizar el calendario (ej. `tu-correo@gmail.com`).
   * Haz clic en **Agregar** y luego en **Guardar y continuar**.
6. Revisa el resumen y haz clic en **Volver al tablero** (Back to dashboard).

---

## Paso 4: Crear las Credenciales (Client ID y Client Secret)

1. Ve a **API y servicios** > **Credenciales** (Credentials).
2. Haz clic en **Crear credenciales** (Create Credentials) en la parte superior y selecciona **ID de cliente de OAuth** (OAuth client ID).
3. En **Tipo de aplicación** (Application type), selecciona **Aplicación web** (Web application).
4. **Nombre**: `Vendetta Web App`.
5. En la sección **Orígenes de JavaScript autorizados** (Authorized JavaScript origins):
   * Haz clic en **Agregar URI**.
   * Escribe: `https://vendetta.mx`
6. En la sección **URI de redireccionamiento autorizados** (Authorized redirect URIs) (⚠️ CRÍTICO):
   * Haz clic en **Agregar URI**.
   * Escribe exactamente: `https://vendetta.mx/api/auth/google/callback`
7. Haz clic en **Crear**.
8. Aparecerá una ventana flotante con tu **Client ID** (ID de cliente) y tu **Client Secret** (Secreto de cliente). Cópialos y guárdalos en un lugar seguro temporalmente.

---

## Paso 5: Obtener el ID de tu Calendario de Google

Por defecto, si deseas usar tu calendario principal, el ID es simplemente tu dirección de correo de Gmail (ej. `tu-correo@gmail.com`). Si deseas usar un calendario secundario específico:

1. Entra a [Google Calendar](https://calendar.google.com/).
2. En la barra lateral izquierda, busca el calendario que deseas usar bajo "Mis calendarios".
3. Pasa el cursor sobre él, haz clic en los **tres puntos** y selecciona **Configuración y uso compartido** (Settings and sharing).
4. Desplázate hacia abajo hasta la sección **Integrar el calendario** (Integrate calendar).
5. Copia el texto que aparece en **ID del calendario** (Calendar ID). Debe verse como algo así:
   * Calendario principal: `tu-correo@gmail.com`
   * Calendario secundario: `c_xxxxxxxxxxxxxx@group.calendar.google.com`

---

## Paso 6: Configurar y Vincular en Vendetta

1. Ve al panel de administración de Vendetta: `https://vendetta.mx/admin/configuracion`.
2. Dirígete a la pestaña **Integraciones**.
3. En la sección **Google Calendar**, ingresa los datos correspondientes:
   * **Client ID** (el que creaste en el Paso 4)
   * **Client Secret** (el que creaste en el Paso 4)
   * **Google Calendar ID** (el correo o el ID secundario del Paso 5)
4. Haz clic en **Guardar Credenciales Google**.
5. Una vez guardadas, haz clic en el botón azul **Vincular Cuenta de Google**.
6. Google abrirá una página de inicio de sesión. Selecciona tu cuenta de prueba autorizada en el Paso 3.
7. Te aparecerá una advertencia de seguridad de Google ("Google no ha verificado esta aplicación"). Esto es normal. Haz clic en **Avanzado** (Advanced) y luego en **Ir a Vendetta (no seguro)** (Go to Vendetta).
8. Selecciona las casillas para otorgar permisos de ver y editar tus eventos de Google Calendar y haz clic en **Continuar**.
9. Serás redirigido de vuelta al panel de configuración de Vendetta, donde el estado de Google Calendar debería cambiar a **"Sincronización Activa"** en color verde.

¡Listo! A partir de ese momento, cualquier show que pase al estado "Confirmado" se sincronizará automáticamente.
