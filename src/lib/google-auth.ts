import { db } from "@/lib/db"

interface CachedToken {
  token: string
  expiresAt: number
}

let cachedAccessToken: CachedToken | null = null

/**
 * Obtiene un Access Token válido para las APIs de Google.
 * Reutiliza el token en memoria si aún no ha expirado.
 */
export async function getGoogleAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now()
  if (!forceRefresh && cachedAccessToken && cachedAccessToken.expiresAt > now + 60000) {
    return cachedAccessToken.token
  }

  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  if (!config?.googleClientId || !config?.googleClientSecret || !config?.googleRefreshToken) {
    throw new Error("La integración con Google no está vinculada. Por favor vincula tu cuenta de Google en Ajustes > Integraciones.")
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      refresh_token: config.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error("Error refreshing Google token:", err)
    throw new Error(`Error al refrescar credenciales de Google: ${err}`)
  }

  const data = await response.json()
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: now + expiresIn * 1000,
  }

  return data.access_token
}

/**
 * Intercambia el código de autorización obtenido del popup de Google por tokens de acceso y refresco.
 */
export async function exchangeGoogleCodeForTokens(code: string, redirectUri: string) {
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  if (!config?.googleClientId || !config?.googleClientSecret) {
    throw new Error("Faltan Client ID o Client Secret de Google en la configuración.")
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error("Error exchanging token with Google:", err)
    throw new Error(`No se pudo validar el código de autorización de Google: ${err}`)
  }

  const data = await response.json()

  // Guardar refresh token en GlobalConfig
  await db.globalConfig.update({
    where: { id: "vendetta_config" },
    data: {
      googleRefreshToken: data.refresh_token || config.googleRefreshToken,
      lastCalendarSync: new Date(),
    },
  })

  // Actualizar caché en memoria si viene un nuevo access token
  if (data.access_token) {
    const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600
    cachedAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    }
  }

  return data
}

export interface GoogleSuiteStatus {
  isLinked: boolean
  hasClientId: boolean
  hasClientSecret: boolean
  hasCalendarId: boolean
  hasAnalyticsPropertyId: boolean
  hasAnalyticsMeasurementId: boolean
  hasSearchConsoleSiteUrl: boolean
  propertyId: string | null
  measurementId: string | null
  siteUrl: string | null
  calendarId: string | null
}

export async function getGoogleSuiteStatus(): Promise<GoogleSuiteStatus> {
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  return {
    isLinked: !!config?.googleRefreshToken,
    hasClientId: !!config?.googleClientId,
    hasClientSecret: !!config?.googleClientSecret,
    hasCalendarId: !!config?.googleCalendarId,
    hasAnalyticsPropertyId: !!config?.googleAnalyticsPropertyId,
    hasAnalyticsMeasurementId: !!config?.googleAnalyticsMeasurementId,
    hasSearchConsoleSiteUrl: !!config?.googleSearchConsoleSiteUrl,
    propertyId: config?.googleAnalyticsPropertyId || null,
    measurementId: config?.googleAnalyticsMeasurementId || null,
    siteUrl: config?.googleSearchConsoleSiteUrl || null,
    calendarId: config?.googleCalendarId || null,
  }
}
