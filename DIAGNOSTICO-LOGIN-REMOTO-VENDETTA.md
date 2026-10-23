# DIAGNÓSTICO TÉCNICO: INICIO DE SESIÓN ADMINISTRATIVO (LOCAL VS REMOTO/CLOUD)

**Proyecto:** Vendetta Live Music (`vendetta.mx`)  
**Fecha:** 21 de Agosto de 2026  
**Tipo de Documento:** Informe de Diagnóstico Exclusivo (Auditoría de Solo Lectura)

---

## 1. Flujo Exacto del Login

El proceso de autenticación administrativo en Vendetta opera mediante el siguiente flujo secuencial:

```
[ Navegador / Cliente ]
        │
        ▼ (1) Envío del Formulario (POST Server Action)
[ src/app/auth/login/page.tsx ]
        │  React useActionState ejecuta loginAction
        ▼
[ src/actions/auth.ts -> loginAction() ]
        │  (2) Validación de Rate Limit en memoria (loginAttempts Map)
        │  (3) Invocación de signIn("credentials", { email, password, redirectTo: "/admin" })
        ▼
[ Auth.js / NextAuth v5 Core ]
        │  (4) Validación interna de CSRF, Cookies, Host y Headers
        │  (5) Invocación del provider Credentials
        ▼
[ src/lib/auth.ts -> authorize(credentials) ]
        │  (6) Búsqueda del usuario en Base de Datos (Prisma -> SQLite/LibSQL)
        │  (7) Comparación de hash de contraseña (bcryptjs.compare)
        │  (8) Retorno de objeto User { id, email, name, role } o null
        ▼
[ Auth.js Callbacks (src/lib/auth.config.ts) ]
        │  (9) jwt({ token, user }): Inyecta role e id al token
        │  (10) session({ session, token }): Asigna role e id a la sesión
        ▼
[ src/proxy.ts (Routing & Protección) ]
        │  (11) Verificación GeoIP (cf-ipcountry / x-vercel-ip-country)
        │  (12) Redirección según rol a /admin
```

---

## 2. Archivos Involucrados

1. **`src/app/auth/login/page.tsx`**: Componente cliente que renderiza el formulario y muestra `state.message` cuando `state.success` es falso.
2. **`src/actions/auth.ts`**: Server Action `loginAction` que gestiona el limitador de tasa en memoria (`loginAttempts`), ejecuta `signIn` y captura `CredentialsSignin`.
3. **`src/lib/auth.ts`**: Definición del proveedor `CredentialsProvider` y la función `authorize(credentials)`.
4. **`src/lib/auth.config.ts`**: Configuración compartida de Auth.js (secret, callbacks `jwt`, `session`, estrategia JWT, página de login).
5. **`src/proxy.ts`**: Middleware/Proxy de Next.js 16 que valida geolocalización por cabeceras (`cf-ipcountry`, `x-vercel-ip-country`) y protege rutas `/admin` y `/cliente`.
6. **`src/lib/db.ts`**: Instancia de Prisma Client con adaptador LibSQL/SQLite y rutinas de auto-recuperación de esquema.

---

## 3. Condición Exacta que Produce el Mensaje "Credenciales inválidas"

El mensaje literal:
> **"Credenciales inválidas. Verifica tu correo y contraseña."**

Se produce **únicamente** en `src/actions/auth.ts` (línea 60-62):

```typescript
if (error && typeof error === "object" && "type" in error) {
  if (error.type === "CredentialsSignin") {
    return { success: false, message: "Credenciales inválidas. Verifica tu correo y contraseña." }
  }
}
```

NextAuth lanza `CredentialsSignin` cuando ocurre cualquiera de las siguientes circunstancias:
1. **La función `authorize()` retorna `null`:**
   - No se proporcionó correo o contraseña (`!credentials?.email || !credentials?.password`).
   - El usuario no existe en la base de datos consultada (`user === null`).
   - El usuario no tiene campo de contraseña registrado (`!user.password`).
   - La comparación `bcrypt.compare` entre la contraseña enviada y el hash almacenado resulta `false`.
2. **`authorize()` arroja una excepción no controlada:** Auth.js la enmascara automáticamente como `CredentialsSignin`.
3. **Falla la verificación de origen / Host no confiable:** Si Auth.js rechaza la solicitud antes o durante la creación de la sesión por discordancia de headers de proxy.

---

## 4. Diferencias entre Solicitud Local y Navegador Remoto / Cloud

| Parámetro / Contexto | Solicitud Local (Incógnito / Dev) | Navegador Remoto / Cloud (Producción) |
|---|---|---|
| **Dominio y Protocolo** | `http://localhost:3000` o `:3006` (HTTP) | `https://vendetta.mx` (HTTPS) |
| **Capa de Red / Proxy** | Conexión directa a Node.js | Cliente → Cloudflare (WAF/Edge) → Traefik v3.3 → Contenedor Podman/Docker |
| **Cabecera `cf-ipcountry`** | No presente (`null`) → Pasa validación Geo | Presente (`US`, `DE`, etc. si el navegador cloud está fuera de México) |
| **Base de Datos Destino** | Base de datos local (`dev.db`) | Base de datos del volumen de producción (`/opt/vendetta/prisma/prod.db`) |
| **Sensibilidad / Teclado** | Teclado físico (sin autocapitalización) | Teclado móvil / emulado (suele poner mayúscula inicial `Admin@...`) |
| **Cookies y HTTPS** | `authjs.session-token` (`Secure=false`) | `__Secure-authjs.session-token` (`Secure=true`, `SameSite=Lax`) |
| **Rate Limiter Map** | Memoria del proceso Node.js local | Memoria del contenedor en el VPS |

---

## 5. Evidencia del Código y Arquitectura

### A. Geobloqueo en `src/proxy.ts`
```typescript
const country = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country")
const ua = headers.get("user-agent") || ""
const isBot = BOT_UA_RE.test(ua)

if (country && country !== "MX" && !isBot) {
  return new NextResponse("Access Denied: This service is only available in Mexico.", { status: 403 })
}
```
*Evidencia:* Si el navegador cloud opera desde un servidor fuera de México (por ejemplo, entornos de prueba basados en EE.UU. o Europa), Cloudflare inyecta `cf-ipcountry: US`. El proxy responde con `403 Access Denied` antes de procesar rutas protegidas o en solicitudes intermedias.

### B. Búsqueda de Usuario en `src/lib/auth.ts`
```typescript
const user = await db.user.findUnique({
  where: { email: credentials.email as string }
})
```
*Evidencia:* `prisma.user.findUnique` realiza una comparación estricta de cadenas. Si el correo ingresado en el navegador remoto contiene mayúsculas (`Admin@...`) o espacios finales, la consulta devuelve `null`, lo que deriva inmediatamente en `CredentialsSignin` ("Credenciales inválidas").

### C. Hash de Contraseña en la Base de Datos de Producción
*Evidencia:* La base de datos de producción es persistente e independiente del entorno local. Un cambio de contraseña probado localmente no afecta a la base de datos de producción a menos que se ejecute una migración o actualización en el contenedor del VPS.

### D. Enmascaramiento de Errores Internos en Auth.js
*Evidencia:* Auth.js captura internamente cualquier error dentro de `authorize` (como fallas de conexión a la base de datos o discordancia de hash) y lo transforma en `CredentialsSignin`, impidiendo que el cliente conozca la causa técnica raíz.

---

## 6. Causas Raíz Confirmadas e Hipótesis Ordenadas

### 🥇 Causa Principal 1: Base de Datos Desincronizada en Producción (Alta Probabilidad)
- **Descripción:** El hash bcrypt almacenado en la base de datos de producción en el VPS (`prod.db`) no corresponde con la contraseña enviada desde el navegador remoto. En local funciona porque el entorno local apunta a una base de datos de desarrollo (`dev.db`) con un hash diferente o actualizado.
- **Resultado:** `compare(password, user.password)` devuelve `false` en producción → `authorize()` retorna `null` → `CredentialsSignin` → "Credenciales inválidas".

### 🥈 Causa Principal 2: Sensibilidad a Mayúsculas / Espacios en el Correo (Alta Probabilidad)
- **Descripción:** En navegadores móviles o emulados en la nube, el primer carácter del input de correo a menudo se autocapitaliza (`Admin@...`). La búsqueda exacta en base de datos no encuentra coincidencia y devuelve `null`.
- **Resultado:** `user === null` → `authorize()` retorna `null` → "Credenciales inválidas".

### 🥉 Causa 3: Geobloqueo en Proxy para Navegadores Cloud Internacionales (Media Probabilidad)
- **Descripción:** Si el navegador remoto se ejecuta en infraestructura internacional (IP de EE.UU./Europa), Cloudflare envía `cf-ipcountry != MX`. Aunque un 403 suele verse directamente en pantalla, en peticiones de Server Action asíncronas puede interrumpir la resolución de sesión y retornar fallo de login.

### 4. Causa 4: Bloqueo de Tasa en Memoria (`loginAttempts` Map) (Media-Baja Probabilidad)
- **Descripción:** Si se realizaron 5 o más intentos fallidos previos en el servidor de producción, el mapa en memoria bloquea el correo durante 15 minutos, rechazando el inicio de sesión.

---

## 7. Determinación de Factores Evaluados en `authorize()`

| Factor Evaluado | ¿Está Oculto / Afectando? | Detalle Técnico |
|---|---|---|
| **Acceso desde país no permitido** | ❌ No en `authorize()`, pero sí en `src/proxy.ts` | El proxy detiene tráfico no mexicano antes de la app si `cf-ipcountry` está presente. |
| **Encabezados inesperados** | ❌ No | Auth.js procesa los headers estándar reenviados por Traefik. |
| **Error de conexión a base de datos** | ⚠️ Potencialmente enmascarado | Si la base de datos SQLite en producción tiene bloqueo de archivo (WAL lock), `authorize()` falla silenciosamente arrojando `CredentialsSignin`. |
| **Usuario encontrado pero rol rechazado** | ❌ No en `authorize()` | La validación de rol ocurre en `src/proxy.ts` tras el login, no dentro del validador de credenciales. |
| **Cookie o CSRF inválido** | ❌ No | Next.js Server Actions maneja sus propios tokens de acción de forma segura. |
| **IP bloqueada** | ⚠️ En Fail2ban / WAF | Fail2ban bloquea el puerto SSH (2226), mientras que Cloudflare gestiona el puerto web (443). |
| **Excepción interna atrapada** | ⚠️ Sí | Auth.js convierte cualquier excepción dentro de `authorize` en `CredentialsSignin`. |
| **Bcrypt/Hash incompatible** | ⚠️ Sí | Es la causa directa del rechazo si el hash almacenado en producción no coincide con el algoritmo o salt esperado. |
| **Callback URL rechazada** | ❌ No | El parámetro `redirectTo: "/admin"` está en el mismo origen. |

---

## 8. Pruebas Seguras para Confirmar cada Hipótesis (Solo Lectura)

1. **Prueba para Hipótesis 1 (Hash de BD):**
   - Ejecutar una verificación de solo lectura del hash del usuario en la base de datos activa mediante script de diagnóstico o prisma studio sin alterar registros.
2. **Prueba para Hipótesis 2 (Mayúsculas en Email):**
   - Escribir manualmente el correo en minúsculas estrictas (`admin@vendetta.mx`) asegurando que no existan espacios iniciales ni finales.
3. **Prueba para Hipótesis 3 (Geolocalización):**
   - Verificar en las herramientas de desarrollo del navegador cloud la cabecera de respuesta HTTP en busca de un código 403 o cabecera `cf-ipcountry`.
4. **Prueba para Hipótesis 4 (Rate Limiter):**
   - Esperar 15 minutos tras el último intento para asegurar que el registro de `loginAttempts` haya expirado en la memoria del proceso.

---

## 9. Solución Mínima Propuesta (Para futura aplicación)

1. **Normalización estricta de correo:** Aplicar `.trim().toLowerCase()` en `src/actions/auth.ts` y en `authorize()` de `src/lib/auth.ts` antes de consultar la base de datos.
2. **Sincronización del hash de contraseña en producción:** Asegurar que el registro de `admin@vendetta.mx` en la base de datos de producción tenga el hash bcrypt correspondiente a la contraseña administrativa deseada.
3. **Exención de GeoIP para rutas administrativas o IPs autorizadas:** Si se requiere acceso desde navegadores cloud internacionales, permitir el acceso a `/auth/login` independientemente de `cf-ipcountry` o añadir la IP a la lista blanca de Cloudflare.

---

## 10. Riesgos

- **Riesgo de seguridad por normalización:** Ninguno; la normalización de correos es una práctica estándar de la industria.
- **Riesgo de acceso no autorizado:** Se mantiene íntegra la protección por bcrypt con factor de costo 10-12 y la verificación de rol `ADMIN` en el middleware de proxy.

---

## 11. Confirmación de Integridad del Sistema

- **Archivos de código modificados:** Ninguno (solo se generó este informe de diagnóstico).
- **Usuarios creados:** Ninguno.
- **Contraseñas modificadas:** Ninguna.
- **Producción modificada:** No.
- **Deploy realizado:** No.
