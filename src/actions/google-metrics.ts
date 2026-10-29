"use server"

import { requireAdminMsg } from "@/lib/auth-guards"
import { getGoogleSuiteStatus, getGoogleAccessToken } from "@/lib/google-auth"
import { getSearchConsoleReport, SearchConsoleFullReport, listSearchConsoleSites } from "@/lib/google-search-console"
import { getGoogleAnalyticsReport, GA4FullReport } from "@/lib/google-analytics"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Cache en memoria para respuestas de Google APIs
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const memoryCache = new Map<string, CacheEntry<any>>()

function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key)
  if (!item) return null
  if (Date.now() - item.timestamp > item.ttl) {
    memoryCache.delete(key)
    return null
  }
  return item.data
}

function setCached<T>(key: string, data: T, ttlMs: number) {
  memoryCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
}

export interface GoogleMetricsCombined {
  status: {
    isLinked: boolean
    hasSearchConsole: boolean
    hasAnalytics: boolean
    siteUrl: string | null
    propertyId: string | null
    measurementId: string | null
  }
  searchConsole: SearchConsoleFullReport | null
  analytics: GA4FullReport | null
  errors: {
    searchConsole?: string
    analytics?: string
  }
  lastUpdated: string
}

/**
 * Obtiene el consolidado de métricas de Google (Search Console + GA4) para el periodo seleccionado.
 */
export async function getGoogleMetricsAction(
  period: "7d" | "28d" | "90d" = "28d",
  forceRefresh = false
): Promise<{ success: boolean; data?: GoogleMetricsCombined; message?: string }> {
  const authErr = await requireAdminMsg()
  if (authErr) return authErr

  try {
    const cacheKey = `google_metrics_${period}`
    if (!forceRefresh) {
      const cached = getCached<GoogleMetricsCombined>(cacheKey)
      if (cached) {
        return { success: true, data: cached }
      }
    }

    const suiteStatus = await getGoogleSuiteStatus()

    if (!suiteStatus.isLinked) {
      return {
        success: true,
        data: {
          status: {
            isLinked: false,
            hasSearchConsole: suiteStatus.hasSearchConsoleSiteUrl,
            hasAnalytics: suiteStatus.hasAnalyticsPropertyId,
            siteUrl: suiteStatus.siteUrl,
            propertyId: suiteStatus.propertyId,
            measurementId: suiteStatus.measurementId,
          },
          searchConsole: null,
          analytics: null,
          errors: {
            searchConsole: "Google no está vinculado. Por favor haz clic en 'Vincular Cuenta de Google'.",
            analytics: "Google no está vinculado. Por favor haz clic en 'Vincular Cuenta de Google'.",
          },
          lastUpdated: new Date().toISOString(),
        }
      }
    }

    // 1. Verificación previa de token y scopes válidos (Fail-fast con timeout)
    let token: string
    try {
      token = await getGoogleAccessToken()
    } catch (err: any) {
      console.warn("[google-metrics] Token refresh failed:", err?.message || err)
      const unlinkedData: GoogleMetricsCombined = {
        status: {
          isLinked: false,
          hasSearchConsole: suiteStatus.hasSearchConsoleSiteUrl,
          hasAnalytics: suiteStatus.hasAnalyticsPropertyId,
          siteUrl: suiteStatus.siteUrl,
          propertyId: suiteStatus.propertyId,
          measurementId: suiteStatus.measurementId,
        },
        searchConsole: null,
        analytics: null,
        errors: {
          searchConsole: "auth_failed",
          analytics: "auth_failed",
        },
        lastUpdated: new Date().toISOString(),
      }
      setCached(cacheKey, unlinkedData, 10 * 60 * 1000)
      return { success: true, data: unlinkedData }
    }

    // Validar scopes con tokeninfo antes de intentar peticiones costosas
    let hasScScope = false
    let hasGaScope = false
    try {
      const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`, {
        signal: AbortSignal.timeout(2000),
      })
      if (tokenInfoRes.ok) {
        const info = await tokenInfoRes.json()
        const scopeStr = typeof info.scope === "string" ? info.scope : ""
        hasScScope = scopeStr.includes("webmasters")
        hasGaScope = scopeStr.includes("analytics")
      } else if (tokenInfoRes.status === 401 || tokenInfoRes.status === 403) {
        // Credenciales inválidas o revocadas
        const unlinkedData: GoogleMetricsCombined = {
          status: {
            isLinked: false,
            hasSearchConsole: suiteStatus.hasSearchConsoleSiteUrl,
            hasAnalytics: suiteStatus.hasAnalyticsPropertyId,
            siteUrl: suiteStatus.siteUrl,
            propertyId: suiteStatus.propertyId,
            measurementId: suiteStatus.measurementId,
          },
          searchConsole: null,
          analytics: null,
          errors: {
            searchConsole: "auth_failed",
            analytics: "auth_failed",
          },
          lastUpdated: new Date().toISOString(),
        }
        setCached(cacheKey, unlinkedData, 10 * 60 * 1000)
        return { success: true, data: unlinkedData }
      }
    } catch {
      // Timeout o fallo de red en tokeninfo; continuar si no se pudo validar
    }

    if (!hasScScope && !hasGaScope) {
      const unlinkedData: GoogleMetricsCombined = {
        status: {
          isLinked: false,
          hasSearchConsole: suiteStatus.hasSearchConsoleSiteUrl,
          hasAnalytics: suiteStatus.hasAnalyticsPropertyId,
          siteUrl: suiteStatus.siteUrl,
          propertyId: suiteStatus.propertyId,
          measurementId: suiteStatus.measurementId,
        },
        searchConsole: null,
        analytics: null,
        errors: {
          searchConsole: "auth_failed",
          analytics: "auth_failed",
        },
        lastUpdated: new Date().toISOString(),
      }
      setCached(cacheKey, unlinkedData, 10 * 60 * 1000)
      return { success: true, data: unlinkedData }
    }

    // Ejecutar consultas solo para los servicios con permisos y configuración activa
    const [scResult, gaResult] = await Promise.allSettled([
      hasScScope && suiteStatus.hasSearchConsoleSiteUrl
        ? getSearchConsoleReport(period)
        : Promise.reject(new Error(hasScScope ? "URL de Search Console no configurada." : "auth_failed")),
      hasGaScope && suiteStatus.hasAnalyticsPropertyId 
        ? getGoogleAnalyticsReport(period) 
        : Promise.reject(new Error(hasGaScope ? "ID de GA4 no configurado." : "auth_failed")),
    ])

    const errors: { searchConsole?: string; analytics?: string } = {}
    let scData: SearchConsoleFullReport | null = null
    let gaData: GA4FullReport | null = null

    if (scResult.status === "fulfilled") {
      scData = scResult.value
    } else {
      errors.searchConsole = scResult.reason?.message || "Error al consultar Google Search Console"
    }

    if (gaResult.status === "fulfilled") {
      gaData = gaResult.value
    } else {
      errors.analytics = gaResult.reason?.message || "Error al consultar Google Analytics 4"
    }

    const combined: GoogleMetricsCombined = {
      status: {
        isLinked: true,
        hasSearchConsole: suiteStatus.hasSearchConsoleSiteUrl,
        hasAnalytics: suiteStatus.hasAnalyticsPropertyId,
        siteUrl: suiteStatus.siteUrl,
        propertyId: suiteStatus.propertyId,
        measurementId: suiteStatus.measurementId,
      },
      searchConsole: scData,
      analytics: gaData,
      errors,
      lastUpdated: new Date().toISOString(),
    }

    // Cache por 15 minutos
    setCached(cacheKey, combined, 15 * 60 * 1000)

    return { success: true, data: combined }
  } catch (error: any) {
    console.error("Error in getGoogleMetricsAction:", error)
    return { success: false, message: error.message || "Error al obtener las métricas de Google" }
  }
}

/**
 * Guarda los identificadores específicos de la suite de Google (GA4, Measurement ID, Search Console).
 */
export async function saveGoogleSuiteConfigAction(arg1: any, arg2?: any) {
  const authErr = await requireAdminMsg()
  if (authErr) return authErr

  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null)
    if (!formData) return { success: false, message: "Error: No se recibieron datos" }

    const propertyId = (formData.get("propertyId") as string)?.trim() || null
    const measurementId = (formData.get("measurementId") as string)?.trim() || null
    const siteUrl = (formData.get("siteUrl") as string)?.trim() || null
    const siteVerification = (formData.get("siteVerification") as string)?.trim() || null

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: {
        googleAnalyticsPropertyId: propertyId,
        googleAnalyticsMeasurementId: measurementId,
        googleSearchConsoleSiteUrl: siteUrl,
        googleSiteVerification: siteVerification,
      },
      create: {
        id: "vendetta_config",
        googleAnalyticsPropertyId: propertyId,
        googleAnalyticsMeasurementId: measurementId,
        googleSearchConsoleSiteUrl: siteUrl,
        googleSiteVerification: siteVerification,
      }
    })

    // Limpiar caché
    memoryCache.clear()

    revalidatePath("/admin/analytics")
    revalidatePath("/admin/configuracion")
    revalidatePath("/")

    return { success: true, message: "Configuración de Google Search Console y Analytics guardada con éxito." }
  } catch (error: any) {
    console.error("Error saving Google Suite config:", error)
    return { success: false, message: `Error al guardar: ${error.message}` }
  }
}

/**
 * Prueba la conexión en vivo con cada uno de los servicios de Google
 */
export async function testGoogleSuiteConnectionAction() {
  const authErr = await requireAdminMsg()
  if (authErr) return authErr

  try {
    const token = await getGoogleAccessToken(true)
    const sites = await listSearchConsoleSites()
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

    let gaOk = false
    let gaError = null

    if (config?.googleAnalyticsPropertyId) {
      try {
        await getGoogleAnalyticsReport("7d")
        gaOk = true
      } catch (err: any) {
        gaError = err.message
      }
    }

    return {
      success: true,
      hasValidToken: !!token,
      searchConsole: {
        accessibleSites: sites,
        configuredSite: config?.googleSearchConsoleSiteUrl || "https://vendetta.mx",
        isConfiguredSiteFound: sites.some(s => s.toLowerCase().includes("vendetta.mx")),
      },
      analytics: {
        isConfigured: !!config?.googleAnalyticsPropertyId,
        propertyId: config?.googleAnalyticsPropertyId,
        isWorking: gaOk,
        error: gaError,
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Error al verificar conexión con Google",
    }
  }
}
