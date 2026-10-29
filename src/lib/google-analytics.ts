import { getGoogleAccessToken } from "@/lib/google-auth"
import { db } from "@/lib/db"

export interface GA4Overview {
  activeUsers: number
  sessions: number
  screenPageViews: number
  bounceRate: number
  averageSessionDuration: number
  engagedSessions: number
  activeUsersDeltaPct: number | null
  sessionsDeltaPct: number | null
  pageViewsDeltaPct: number | null
  realtimeActiveUsers: number
  periodDays: number
}

export interface GA4DailyTrend {
  date: string
  activeUsers: number
  sessions: number
  pageViews: number
}

export interface GA4PageRow {
  pagePath: string
  pageTitle: string
  pageViews: number
  activeUsers: number
}

export interface GA4ChannelRow {
  channel: string
  sessions: number
  activeUsers: number
  percentage: number
}

export interface GA4DeviceRow {
  deviceCategory: string
  sessions: number
  activeUsers: number
  percentage: number
}

export interface GA4FullReport {
  overview: GA4Overview
  dailyTrends: GA4DailyTrend[]
  topPages: GA4PageRow[]
  trafficSources: GA4ChannelRow[]
  devices: GA4DeviceRow[]
  propertyId: string
  measurementId: string | null
}

function normalizePropertyId(propertyId: string): string {
  const trimmed = propertyId.trim()
  return trimmed.startsWith("properties/") ? trimmed : `properties/${trimmed}`
}

async function runGA4Report(propertyId: string, body: any) {
  const token = await getGoogleAccessToken()
  const cleanId = normalizePropertyId(propertyId)
  const url = `https://analyticsdata.googleapis.com/v1beta/${cleanId}:runReport`

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
    const errText = await res.text()
    console.error("GA4 RunReport error:", errText)
    throw new Error(`Google Analytics API (${res.status}): ${errText}`)
  }

  return res.json()
}

async function runGA4Realtime(propertyId: string): Promise<number> {
  try {
    const token = await getGoogleAccessToken()
    const cleanId = normalizePropertyId(propertyId)
    const url = `https://analyticsdata.googleapis.com/v1beta/${cleanId}:runRealtimeReport`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metrics: [{ name: "activeUsers" }],
      }),
      signal: AbortSignal.timeout(2500),
    })

    if (!res.ok) return 0
    const json = await res.json()
    const val = json.rows?.[0]?.metricValues?.[0]?.value
    return val ? parseInt(val, 10) : 0
  } catch (err) {
    console.warn("GA4 Realtime report failed:", err)
    return 0
  }
}

export async function getGoogleAnalyticsReport(
  period: "7d" | "28d" | "90d" = "28d"
): Promise<GA4FullReport> {
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  const propertyId = config?.googleAnalyticsPropertyId

  if (!propertyId) {
    throw new Error("El ID de Propiedad de Google Analytics (GA4) no está configurado.")
  }

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 28

  // Consultas en paralelo:
  // 1. Tendencia diaria y acumulados del periodo actual
  // 2. Acumulados del periodo anterior para deltas
  // 3. Páginas más visitadas
  // 4. Canales de tráfico
  // 5. Dispositivos
  // 6. Tiempo real (últimos 30 min)
  const [currentReport, prevReport, pagesReport, channelsReport, devicesReport, realtimeUsers] = await Promise.all([
    runGA4Report(propertyId, {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
        { name: "engagedSessions" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
    }).catch(err => {
      console.warn("GA4 current report error:", err.message)
      return null
    }),
    runGA4Report(propertyId, {
      dateRanges: [{ startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
    }).catch(err => {
      console.warn("GA4 prev report error:", err.message)
      return null
    }),
    runGA4Report(propertyId, {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 15,
    }).catch(err => {
      console.warn("GA4 pages report error:", err.message)
      return null
    }),
    runGA4Report(propertyId, {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }).catch(err => {
      console.warn("GA4 channels report error:", err.message)
      return null
    }),
    runGA4Report(propertyId, {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 5,
    }).catch(err => {
      console.warn("GA4 devices report error:", err.message)
      return null
    }),
    runGA4Realtime(propertyId),
  ])

  // Procesar métricas actuales
  let totalActiveUsers = 0
  let totalSessions = 0
  let totalPageViews = 0
  let totalEngagedSessions = 0
  let weightedDurationSum = 0
  let bounceRateSum = 0
  let rowCount = 0

  const dailyTrends: GA4DailyTrend[] = (currentReport?.rows || []).map((row: any) => {
    const rawDate = row.dimensionValues?.[0]?.value || ""
    // Formato de fecha GA4: YYYYMMDD -> YYYY-MM-DD
    const formattedDate = rawDate.length === 8 
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : rawDate

    const activeUsers = parseInt(row.metricValues?.[0]?.value || "0", 10)
    const sessions = parseInt(row.metricValues?.[1]?.value || "0", 10)
    const pageViews = parseInt(row.metricValues?.[2]?.value || "0", 10)
    const bounceRate = parseFloat(row.metricValues?.[3]?.value || "0")
    const avgDuration = parseFloat(row.metricValues?.[4]?.value || "0")
    const engaged = parseInt(row.metricValues?.[5]?.value || "0", 10)

    totalActiveUsers += activeUsers
    totalSessions += sessions
    totalPageViews += pageViews
    totalEngagedSessions += engaged
    weightedDurationSum += avgDuration * sessions
    bounceRateSum += bounceRate
    rowCount++

    return {
      date: formattedDate,
      activeUsers,
      sessions,
      pageViews,
    }
  })

  // Periodo anterior para deltas
  const prevUsers = parseInt(prevReport?.rows?.[0]?.metricValues?.[0]?.value || "0", 10)
  const prevSessions = parseInt(prevReport?.rows?.[0]?.metricValues?.[1]?.value || "0", 10)
  const prevPageViews = parseInt(prevReport?.rows?.[0]?.metricValues?.[2]?.value || "0", 10)

  const calcDelta = (cur: number, prev: number) => {
    if (prev <= 0) return null
    return Math.round(((cur - prev) / prev) * 100)
  }

  const avgDuration = totalSessions > 0 ? Math.round(weightedDurationSum / totalSessions) : 0
  const avgBounceRate = rowCount > 0 ? Math.round((bounceRateSum / rowCount) * 1000) / 10 : 0

  const overview: GA4Overview = {
    activeUsers: totalActiveUsers,
    sessions: totalSessions,
    screenPageViews: totalPageViews,
    bounceRate: avgBounceRate,
    averageSessionDuration: avgDuration,
    engagedSessions: totalEngagedSessions,
    activeUsersDeltaPct: calcDelta(totalActiveUsers, prevUsers),
    sessionsDeltaPct: calcDelta(totalSessions, prevSessions),
    pageViewsDeltaPct: calcDelta(totalPageViews, prevPageViews),
    realtimeActiveUsers: realtimeUsers,
    periodDays: days,
  }

  // Top Pages
  const topPages: GA4PageRow[] = (pagesReport?.rows || []).map((row: any) => ({
    pagePath: row.dimensionValues?.[0]?.value || "/",
    pageTitle: row.dimensionValues?.[1]?.value || "(sin título)",
    pageViews: parseInt(row.metricValues?.[0]?.value || "0", 10),
    activeUsers: parseInt(row.metricValues?.[1]?.value || "0", 10),
  }))

  // Traffic Sources / Channels
  const channelTotalSessions = (channelsReport?.rows || []).reduce((acc: number, row: any) => {
    return acc + parseInt(row.metricValues?.[0]?.value || "0", 10)
  }, 0)

  const trafficSources: GA4ChannelRow[] = (channelsReport?.rows || []).map((row: any) => {
    const s = parseInt(row.metricValues?.[0]?.value || "0", 10)
    return {
      channel: row.dimensionValues?.[0]?.value || "Direct",
      sessions: s,
      activeUsers: parseInt(row.metricValues?.[1]?.value || "0", 10),
      percentage: channelTotalSessions > 0 ? Math.round((s / channelTotalSessions) * 100) : 0,
    }
  })

  // Devices
  const deviceTotalSessions = (devicesReport?.rows || []).reduce((acc: number, row: any) => {
    return acc + parseInt(row.metricValues?.[0]?.value || "0", 10)
  }, 0)

  const devices: GA4DeviceRow[] = (devicesReport?.rows || []).map((row: any) => {
    const s = parseInt(row.metricValues?.[0]?.value || "0", 10)
    return {
      deviceCategory: row.dimensionValues?.[0]?.value || "desktop",
      sessions: s,
      activeUsers: parseInt(row.metricValues?.[1]?.value || "0", 10),
      percentage: deviceTotalSessions > 0 ? Math.round((s / deviceTotalSessions) * 100) : 0,
    }
  })

  return {
    overview,
    dailyTrends,
    topPages,
    trafficSources,
    devices,
    propertyId,
    measurementId: config?.googleAnalyticsMeasurementId || null,
  }
}
