import { getGoogleAccessToken } from "@/lib/google-auth"
import { db } from "@/lib/db"

export interface SearchConsoleRow {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleDateRow extends SearchConsoleRow {
  date: string
}

export interface SearchConsoleQueryRow extends SearchConsoleRow {
  query: string
}

export interface SearchConsolePageRow extends SearchConsoleRow {
  page: string
}

export interface SearchConsoleDeviceRow {
  device: string
  clicks: number
  impressions: number
  ctr: number
}

export interface SearchConsoleOverview {
  clicks: number
  impressions: number
  ctr: number
  position: number
  clicksDeltaPct: number | null
  impressionsDeltaPct: number | null
  ctrDeltaPct: number | null
  positionDeltaPct: number | null
  dateRange: { startDate: string; endDate: string }
}

export interface SearchConsoleFullReport {
  overview: SearchConsoleOverview
  dailyTrends: SearchConsoleDateRow[]
  topQueries: SearchConsoleQueryRow[]
  topPages: SearchConsolePageRow[]
  devices: SearchConsoleDeviceRow[]
  siteUrl: string
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function getDateRangeForPeriod(period: "7d" | "28d" | "90d" = "28d") {
  const now = new Date()
  // GSC data typically has 2-3 days latency
  const end = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 28
  
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000)

  // Previous period for deltas
  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000)
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000)

  return {
    current: { startDate: formatDate(start), endDate: formatDate(end), days },
    previous: { startDate: formatDate(prevStart), endDate: formatDate(prevEnd), days }
  }
}

async function querySearchConsole(siteUrl: string, body: any) {
  const token = await getGoogleAccessToken()
  const encodedSite = encodeURIComponent(siteUrl)
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(2500),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error("Search Console API error:", errorText)
    throw new Error(`Google Search Console API (${res.status}): ${errorText}`)
  }

  const json = await res.json()
  return json.rows || []
}

/**
 * Consulta la lista de sitios a los que tiene acceso el token.
 */
export async function listSearchConsoleSites(): Promise<string[]> {
  try {
    const token = await getGoogleAccessToken()
    const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { "Authorization": `Bearer ${token}` },
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.siteEntry || []).map((s: any) => s.siteUrl)
  } catch (err) {
    console.error("Error listing Search Console sites:", err)
    return []
  }
}

/**
 * Obtiene el reporte consolidado de Search Console para el dashboard.
 */
export async function getSearchConsoleReport(
  period: "7d" | "28d" | "90d" = "28d"
): Promise<SearchConsoleFullReport> {
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  const siteUrl = config?.googleSearchConsoleSiteUrl || "https://vendetta.mx"

  const { current, previous } = getDateRangeForPeriod(period)

  // Ejecutamos consultas en paralelo:
  // 1. Días actuales (para tendencias y total actual)
  // 2. Días previos (para cálculo de deltas)
  // 3. Top queries
  // 4. Top landing pages
  // 5. Devices
  const [currentDayRows, prevDayRows, queryRows, pageRows, deviceRows] = await Promise.all([
    querySearchConsole(siteUrl, {
      startDate: current.startDate,
      endDate: current.endDate,
      dimensions: ["date"],
      rowLimit: 100
    }).catch(err => {
      console.warn("GSC current days query failed:", err.message)
      return []
    }),
    querySearchConsole(siteUrl, {
      startDate: previous.startDate,
      endDate: previous.endDate,
      dimensions: ["date"],
      rowLimit: 100
    }).catch(err => {
      console.warn("GSC previous days query failed:", err.message)
      return []
    }),
    querySearchConsole(siteUrl, {
      startDate: current.startDate,
      endDate: current.endDate,
      dimensions: ["query"],
      rowLimit: 25
    }).catch(err => {
      console.warn("GSC top queries query failed:", err.message)
      return []
    }),
    querySearchConsole(siteUrl, {
      startDate: current.startDate,
      endDate: current.endDate,
      dimensions: ["page"],
      rowLimit: 15
    }).catch(err => {
      console.warn("GSC top pages query failed:", err.message)
      return []
    }),
    querySearchConsole(siteUrl, {
      startDate: current.startDate,
      endDate: current.endDate,
      dimensions: ["device"],
      rowLimit: 10
    }).catch(err => {
      console.warn("GSC devices query failed:", err.message)
      return []
    })
  ])

  // Calcular agregados actuales
  let currentClicks = 0
  let currentImpressions = 0
  let currentPosSum = 0

  const dailyTrends: SearchConsoleDateRow[] = currentDayRows.map((r: any) => {
    const clicks = r.clicks || 0
    const impressions = r.impressions || 0
    const ctr = r.ctr || 0
    const position = Math.round((r.position || 0) * 10) / 10
    const date = r.keys?.[0] || ""

    currentClicks += clicks
    currentImpressions += impressions
    currentPosSum += position * impressions

    return { date, clicks, impressions, ctr, position }
  }).sort((a: SearchConsoleDateRow, b: SearchConsoleDateRow) => a.date.localeCompare(b.date))

  const currentCtr = currentImpressions > 0 ? currentClicks / currentImpressions : 0
  const currentPos = currentImpressions > 0 ? currentPosSum / currentImpressions : 0

  // Calcular agregados previos para deltas
  let prevClicks = 0
  let prevImpressions = 0
  let prevPosSum = 0

  prevDayRows.forEach((r: any) => {
    const clicks = r.clicks || 0
    const impressions = r.impressions || 0
    const position = r.position || 0
    prevClicks += clicks
    prevImpressions += impressions
    prevPosSum += position * impressions
  })

  const prevCtr = prevImpressions > 0 ? prevClicks / prevImpressions : 0
  const prevPos = prevImpressions > 0 ? prevPosSum / prevImpressions : 0

  const calcDelta = (cur: number, prev: number) => {
    if (prev <= 0) return null
    return Math.round(((cur - prev) / prev) * 100)
  }

  const overview: SearchConsoleOverview = {
    clicks: currentClicks,
    impressions: currentImpressions,
    ctr: Math.round(currentCtr * 1000) / 10, // e.g. 4.2%
    position: Math.round(currentPos * 10) / 10,
    clicksDeltaPct: calcDelta(currentClicks, prevClicks),
    impressionsDeltaPct: calcDelta(currentImpressions, prevImpressions),
    ctrDeltaPct: calcDelta(currentCtr, prevCtr),
    // For position, a negative delta is an improvement (e.g. from pos 10 to pos 5)
    positionDeltaPct: prevPos > 0 ? Math.round(((prevPos - currentPos) / prevPos) * 100) : null,
    dateRange: { startDate: current.startDate, endDate: current.endDate }
  }

  const topQueries: SearchConsoleQueryRow[] = queryRows.map((r: any) => ({
    query: r.keys?.[0] || "(desconocido)",
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: Math.round((r.ctr || 0) * 1000) / 10,
    position: Math.round((r.position || 0) * 10) / 10,
  })).sort((a: SearchConsoleQueryRow, b: SearchConsoleQueryRow) => b.clicks - a.clicks)

  const topPages: SearchConsolePageRow[] = pageRows.map((r: any) => ({
    page: r.keys?.[0] || "/",
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: Math.round((r.ctr || 0) * 1000) / 10,
    position: Math.round((r.position || 0) * 10) / 10,
  })).sort((a: SearchConsolePageRow, b: SearchConsolePageRow) => b.clicks - a.clicks)

  const devices: SearchConsoleDeviceRow[] = deviceRows.map((r: any) => ({
    device: r.keys?.[0] || "OTHER",
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: Math.round((r.ctr || 0) * 1000) / 10,
  })).sort((a: SearchConsoleDeviceRow, b: SearchConsoleDeviceRow) => b.clicks - a.clicks)

  return {
    overview,
    dailyTrends,
    topQueries,
    topPages,
    devices,
    siteUrl,
  }
}
