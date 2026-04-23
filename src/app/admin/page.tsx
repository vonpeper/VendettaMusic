export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Banknote, FileText, TrendingUp, Music, Bell } from "lucide-react"
import { IncomeChart } from "@/components/admin/IncomeChart"
import Link from "next/link"
import { formatDateMX } from "@/lib/utils"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

export default async function AdminDashboardPage() {
  const now = new Date()
  const thisMonthName = MONTHS[now.getMonth()]
  const thisYear = now.getFullYear()
  const startOfMonth = new Date(thisYear, now.getMonth(), 1)
  const startOfNextMonth = new Date(thisYear, now.getMonth() + 1, 1)
  // 🔍 AGENTE ANTIGRAVITY - DIAGNÓSTICO DE CONEXIÓN
  console.log("VENDETTA_DB_DIAG: Iniciando fetch de datos para el dashboard...");
  
  // -- Fetch en paralelo ------------------------------------------
  const [
    totalClients,
    pendingQuotes,
    upcomingEvents,
    recentQuotes,
    bandEvents,
    notifications,
    expiredStats
  ] = await Promise.all([
    db.clientProfile.count(),
    db.quote.count({ where: { status: "pendiente" } }),
    db.event.findMany({
      where: { date: { gte: now }, status: { not: "cancelado" } },
      orderBy: { date: "asc" },
      take: 5,
      include: { client: { include: { user: true } }, location: true, package: true }
    }),
    db.quote.findMany({
      where: { status: "pendiente" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: { include: { user: true } } }
    }),
    db.bandEvent.findMany({
      where: { status: { not: "cancelado" } },
      orderBy: [{ eventYear: "asc" }, { eventDate: "asc" }]
    }),
    db.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.bookingRequest.aggregate({
      _sum: { baseAmount: true },
      where: { status: "EXPIRED" }
    })
  ])

  const potentialLoss = expiredStats?._sum?.baseAmount || 0 

  // -- Métricas de ingresos ----------------------------------------
  const thisMonthEvents = bandEvents.filter(e => e.eventMonth === thisMonthName && e.eventYear === thisYear)
  const lastMonthDate = new Date(thisYear, now.getMonth() - 1, 1)
  const lastMonthName = MONTHS[lastMonthDate.getMonth()]
  const lastMonthYear = lastMonthDate.getFullYear()
  const lastMonthEvents = bandEvents.filter(e => e.eventMonth === lastMonthName && e.eventYear === lastMonthYear)

  const thisMonthTotal = thisMonthEvents.reduce((s, e) => s + e.totalIncome, 0)
  const lastMonthTotal = lastMonthEvents.reduce((s, e) => s + e.totalIncome, 0)
  const totalAllTime   = bandEvents.reduce((s, e) => s + e.totalIncome, 0)
  const totalShows     = bandEvents.length
  const avgPerShow     = totalShows > 0 ? totalAllTime / totalShows : 0

  const monthDelta = lastMonthTotal > 0
    ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
    : null

  // -- Datos para la gráfica (agrupado por mes/año, últimos 6 meses) --
  const monthMap: Record<string, { total: number; count: number }> = {}
  bandEvents.forEach(e => {
    const key = `${e.eventMonth} ${e.eventYear}`
    if (!monthMap[key]) monthMap[key] = { total: 0, count: 0 }
    monthMap[key].total += e.totalIncome
    monthMap[key].count += 1
  })

  // Ordenar cronológicamente y tomar los últimos 6 meses únicos
  const chartDataRaw = Object.entries(monthMap)
    .map(([key, v]) => {
      const [month, year] = key.split(" ")
      return { month, year: parseInt(year), total: v.total, count: v.count }
    })
    .sort((a, b) => a.year !== b.year ? a.year - b.year : MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month))
    .slice(-6)

  // Si hay meses duplicados (mismo nombre, distinto año), mostrar "'YY" junto al mes
  const monthNames = chartDataRaw.map(d => d.month)
  const hasDupes   = monthNames.some((m, i) => monthNames.indexOf(m) !== i)

  const chartData = chartDataRaw.map(d => ({
    month: hasDupes ? `${d.month.slice(0, 3)} '${String(d.year).slice(2)}` : d.month,
    total: d.total,
    count: d.count,
  }))

  // -- Upcoming events próximos 7 días ------------------------------
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const soonEvents = upcomingEvents.filter(e => e.date <= nextWeek)

  return (
    <div className="p-8 bg-background min-h-full">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Dashboard General</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatDateMX(now, "PPPP")}
          </p>
        </div>
        {soonEvents.length > 0 && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-4 py-2">
            <Bell className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm text-primary font-bold">
              {soonEvents.length} show{soonEvents.length > 1 ? "s" : ""} esta semana
            </span>
          </div>
        )}
      </div>

      {/* -- KPIs Row -- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Ingresos del Mes",
            value: MXN(thisMonthTotal),
            sub: monthDelta !== null
              ? `${monthDelta >= 0 ? "+" : ""}${monthDelta}% vs mes anterior`
              : "Sin datos del mes anterior",
            subColor: monthDelta !== null && monthDelta >= 0 ? "text-green-400" : "text-red-400",
            icon: Banknote,
          },
          {
            label: "Shows Totales",
            value: `${totalShows}`,
            sub: `${thisMonthEvents.length} este mes`,
            subColor: "text-muted-foreground",
            icon: Music,
          },
          {
            label: "Cotizaciones Activas",
            value: `${pendingQuotes}`,
            sub: "Requieren seguimiento",
            subColor: pendingQuotes > 0 ? "text-primary" : "text-muted-foreground",
            icon: FileText,
          },
          {
            label: "Total de Clientes",
            value: `${totalClients}`,
            sub: `Promedio por show: ${MXN(avgPerShow)}`,
            subColor: "text-muted-foreground",
            icon: Users,
          },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-card/50 border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black font-heading text-white">{kpi.value}</div>
              <p className={`text-xs mt-1 font-medium ${kpi.subColor}`}>{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* -- Gráfica + Stats secundarios -- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfica ingresos por mes */}
        <Card className="lg:col-span-2 bg-card/50 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading">Ingresos por Mes</CardTitle>
              <CardDescription>Historial de ingresos de la banda — últimos {chartData.length} meses.</CardDescription>
            </div>
            <Link href="/admin/eventualidades"
              className="text-xs text-primary hover:underline flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Ver detalle
            </Link>
          </CardHeader>
          <CardContent>
            <IncomeChart data={chartData} />
            {/* Totales rápidos */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Acumulado Total</div>
                <div className="text-lg font-black text-white mt-1">{MXN(totalAllTime)}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Este mes</div>
                <div className="text-lg font-black text-primary mt-1">{MXN(thisMonthTotal)}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Mes anterior</div>
                <div className="text-lg font-black text-white/60 mt-1">{MXN(lastMonthTotal)}</div>
              </div>
              <div className="text-center col-span-3 border-t border-white/5 pt-3 mt-1">
                <div className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Pérdida Potencial (Funnel Expirado)</div>
                <div className="text-xl font-black text-red-500/80">{MXN(potentialLoss)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Minilog de Notificaciones */}
        <Card className="bg-card/50 border-border/40">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Notificaciones Recientes
            </CardTitle>
            <CardDescription>Últimos avisos enviados a músicos.</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Sin notificaciones aún.<br />
                <span className="text-xs">Se generan al crear eventos.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/40 border border-white/5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.status === "sent" ? "bg-green-400" : n.status === "failed" ? "bg-red-400" : "bg-yellow-400"}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white capitalize">{n.type.replace("_", " ")}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{n.recipient ?? "Sin destinatario"}</div>
                      <div className="text-[10px] text-muted-foreground/50">
                        {formatDateMX(n.createdAt, "dd MMM HH:mm")}
                      </div>
                    </div>
                    <Badge className={`text-[9px] shrink-0 ${n.status === "sent" ? "bg-green-900/50 text-green-300 border-green-600/30" : "bg-yellow-900/50 text-yellow-300 border-yellow-600/30"} border`}>
                      {n.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* -- Próximos Eventos + Cotizaciones pendientes -- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Eventos */}
        <Card className="bg-card/50 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading">Próximos Shows</CardTitle>
              <CardDescription>Fechas confirmadas más cercanas.</CardDescription>
            </div>
            <Link href="/admin/eventos" className="text-xs text-primary hover:underline">Ver todos →</Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Sin eventos próximos registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(ev => {
                  const daysUntil = Math.ceil((ev.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-white/5 hover:border-primary/20 transition-colors">
                      <div className="bg-primary/20 text-primary w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold uppercase leading-none">
                          {ev.date.toLocaleString("es-MX", { month: "short" })}
                        </span>
                        <span className="text-base font-black leading-none">{ev.date.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm truncate">
                          {ev.client?.user?.name ?? "Cliente no especificado"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {ev.location?.name ?? "Ubicación por confirmar"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {daysUntil <= 7 ? (
                          <Badge className="text-[9px] bg-primary/20 text-primary border-primary/40 border">
                            {daysUntil === 0 ? "¡Hoy!" : daysUntil === 1 ? "Mañana" : `${daysUntil}d`}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{daysUntil}d</span>
                        )}
                        {ev.package && (
                          <div className="text-[10px] text-primary/60 mt-0.5">{ev.package.name}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cotizaciones pendientes */}
        <Card className="bg-card/50 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading">Cotizaciones Pendientes</CardTitle>
              <CardDescription>Solicitudes que requieren respuesta.</CardDescription>
            </div>
            <Link href="/admin/ventas" className="text-xs text-primary hover:underline">Ver todas →</Link>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Sin cotizaciones pendientes. ✅
              </div>
            ) : (
              <div className="space-y-3">
                {recentQuotes.map(q => {
                  const daysAgo = Math.floor((now.getTime() - q.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={q.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-white/5 hover:border-yellow-500/20 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-yellow-900/30 border border-yellow-600/20 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm truncate">
                          {q.client?.user?.name ?? "Cliente no especificado"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {q.ceremonyType ? q.ceremonyType.replace("_", " ") : "Tipo no especificado"}
                          {q.eventDate ? ` · ${formatDateMX(q.eventDate, "d MMM")}` : ""}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-white">
                          {MXN(q.totalEstimated)}
                        </div>
                        <div className={`text-[10px] ${daysAgo > 3 ? "text-red-400" : "text-muted-foreground"}`}>
                          {daysAgo === 0 ? "Hoy" : daysAgo === 1 ? "Ayer" : `hace ${daysAgo}d`}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
