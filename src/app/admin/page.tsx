export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Banknote, FileText, TrendingUp, Music, Bell, ShieldAlert, CheckCircle2, AlertCircle, XCircle, ExternalLink } from "lucide-react"
import { IncomeChart } from "@/components/admin/IncomeChart"
import Link from "next/link"
import { formatDateMX } from "@/lib/utils"
import { FollowUpButton } from "@/components/admin/FollowUpButton"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

import { auth } from "@/lib/auth"

export default async function AdminDashboardPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const now = new Date()
  const thisMonthName = MONTHS[now.getMonth()]
  const thisYear = now.getFullYear()
  
  // -- Fetch en paralelo ------------------------------------------
  const [
    upcomingEvents,
    bandEvents,
    newEvents,
    pendingBookingRequests,
    pendingQuotes,
    expiredBookingRequests,
    allBookingRequests,
    confirmedBookings
  ] = await Promise.all([
    db.event.findMany({
      where: { date: { gte: now }, status: { not: "cancelado" } },
      orderBy: { date: "asc" },
      take: 5,
      include: { 
        client: { include: { user: true } }, 
        location: true, 
        package: true,
        contracts: true,
        bookingRequest: true
      }
    }),
    db.bandEvent.findMany({
      where: { status: { not: "cancelado" } },
      orderBy: [{ eventYear: "asc" }, { eventDate: "asc" }]
    }),
    db.event.findMany({
      where: { status: { notIn: ["cancelado", "cancelled"] } },
      orderBy: { date: "asc" }
    }),
    // Pipeline: Booking Requests (Web Funnel)
    db.bookingRequest.findMany({
      where: { status: { in: ["pending", "pendiente"] } },
      orderBy: { createdAt: "desc" },
    }),
    // Pipeline: Quotes Manuales
    db.quote.findMany({
      where: { status: "pendiente" },
      orderBy: { createdAt: "desc" },
      include: { client: { include: { user: true } } }
    }),
    // Para la vista de pérdida potencial
    db.bookingRequest.findMany({
      where: { status: "EXPIRED" },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    // Para Tasa de Cierre
    db.bookingRequest.count(),
    // Para el Semáforo de Producción (Robust Lookup)
    db.bookingRequest.findMany({
      where: { status: "agendado" },
      select: { id: true, eventId: true, clientName: true }
    })
  ])



  // -- Métricas de ingresos unificadas ------------------------------
  const allEventsIncome = [
    ...bandEvents.map(e => ({ month: e.eventMonth, year: e.eventYear, income: e.totalIncome })),
    ...newEvents.map(e => ({ 
      month: MONTHS[new Date(e.date).getMonth()], 
      year: new Date(e.date).getFullYear(), 
      income: e.totalIncome || e.amount || 0 
    }))
  ]

  const thisMonthEventsIncome = allEventsIncome.filter(e => e.month === thisMonthName && e.year === thisYear)
  const lastMonthDate = new Date(thisYear, now.getMonth() - 1, 1)
  const lastMonthName = MONTHS[lastMonthDate.getMonth()]
  const lastMonthYear = lastMonthDate.getFullYear()
  const lastMonthEventsIncome = allEventsIncome.filter(e => e.month === lastMonthName && e.year === lastMonthYear)

  const thisMonthTotal = thisMonthEventsIncome.reduce((s, e) => s + e.income, 0)
  const lastMonthTotal = lastMonthEventsIncome.reduce((s, e) => s + e.income, 0)
  const totalAllTime   = allEventsIncome.reduce((s, e) => s + e.income, 0)

  const monthDelta = lastMonthTotal > 0
    ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
    : null

  // -- Pipeline y Conversion Rate -------------------------------------
  const totalPipelineValue = 
    pendingBookingRequests.reduce((acc, req) => acc + (req.baseAmount || 0), 0) +
    pendingQuotes.reduce((acc, q) => acc + (q.totalEstimated || 0), 0);

  const activeLeadsCount = pendingBookingRequests.length + pendingQuotes.length;

  const confirmedBookingsCount = await db.bookingRequest.count({
    where: { status: "CONFIRMED" }
  })
  
  const conversionRate = allBookingRequests > 0 
    ? Math.round((confirmedBookingsCount / allBookingRequests) * 100) 
    : 0;

  const expiredValue = expiredBookingRequests.reduce((acc, req) => acc + (req.baseAmount || 0), 0);

  // -- Datos para la gráfica (agrupado por mes/año, últimos 6 meses) --
  const monthMap: Record<string, { total: number; count: number }> = {}
  allEventsIncome.forEach(e => {
    const key = `${e.month} ${e.year}`
    if (!monthMap[key]) monthMap[key] = { total: 0, count: 0 }
    monthMap[key].total += e.income
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

  const monthNames = chartDataRaw.map(d => d.month)
  const hasDupes   = monthNames.some((m, i) => monthNames.indexOf(m) !== i)

  const chartData = chartDataRaw.map(d => ({
    month: hasDupes ? `${d.month.slice(0, 3)} '${String(d.year).slice(2)}` : d.month,
    total: d.total,
    count: d.count,
  }))

  // -- Upcoming events próximos 7 días para alerta principal ---------
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const soonEvents = upcomingEvents.filter(e => e.date <= nextWeek)

  return (
    <div className="p-8 bg-background min-h-full">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Dashboard General</h1>
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
          isAdmin && {
            label: "Proyección del Mes",
            value: MXN(thisMonthTotal),
            sub: monthDelta !== null
              ? `${monthDelta >= 0 ? "↗" : "↘"} ${Math.abs(monthDelta)}% vs mes anterior`
              : "Ingresos consolidados",
            subColor: monthDelta !== null && monthDelta >= 0 ? "text-green-600" : "text-red-600",
            icon: Banknote,
            bg: "bg-white",
          },
          isAdmin && {
            label: "Valor del Pipeline",
            value: MXN(totalPipelineValue),
            sub: `${activeLeadsCount} leads activos`,
            subColor: "text-primary",
            icon: FileText,
            bg: "bg-white",
          },
          {
            label: "Tasa de Cierre",
            value: `${conversionRate}%`,
            sub: "Conversión Real",
            subColor: conversionRate > 20 ? "text-green-600" : "text-yellow-600",
            icon: TrendingUp,
            bg: "bg-white",
          },
          {
            label: "Shows Próximos",
            value: `${upcomingEvents.length}`,
            sub: "Agenda confirmada",
            subColor: "text-muted-foreground",
            icon: Music,
            bg: "bg-white",
          },
        ].filter(Boolean).map((kpi: any) => (
          <Card key={kpi.label} className={`${kpi.bg} border-border/40 shadow-sm hover:shadow-md transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                {kpi.label}
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black font-heading text-foreground tracking-tighter">{kpi.value}</div>
              <p className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${kpi.subColor}`}>{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* -- Gráfica + Pérdida Potencial -- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfica ingresos por mes */}
        <Card className={`${isAdmin ? "lg:col-span-2" : "lg:col-span-3"} bg-white border-border/40 shadow-sm`}>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/5 mb-4">
            <div>
              <CardTitle className="font-heading font-black text-xl">
                {isAdmin ? "Tendencia de Ingresos" : "Próximas Reservas"}
              </CardTitle>
              <CardDescription>
                {isAdmin ? "Historial de facturación — últimos 6 meses." : "Resumen de actividad reciente."}
              </CardDescription>
            </div>
            <Link href="/admin/ventas"
              className="px-4 py-2 bg-primary/5 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
               Ver detalle
            </Link>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <>
                <IncomeChart data={chartData} />
                <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-border/40">
                  <div className="text-center">
                    <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Acumulado Histórico</div>
                    <div className="text-xl font-black text-foreground mt-1">{MXN(totalAllTime)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Leads Totales</div>
                    <div className="text-xl font-black text-foreground mt-1">{allBookingRequests}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Promedio/Mes</div>
                    <div className="text-xl font-black text-foreground mt-1">{MXN(totalAllTime / 12)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <LayoutDashboard className="w-12 h-12 mx-auto opacity-10 mb-4" />
                <p className="text-sm">Vista operativa activada para Agentes.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Activo (Movido aquí) */}
        <Card className="bg-white border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/5 mb-4">
            <div>
              <CardTitle className="font-heading font-black text-xl">Pipeline Activo</CardTitle>
              <CardDescription>Cotizaciones y leads sin concretar.</CardDescription>
            </div>
            <Link href="/admin/ventas" className="px-3 py-1 bg-primary/5 text-primary rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
              Gestionar
            </Link>
          </CardHeader>
          <CardContent>
            {pendingBookingRequests.length === 0 && pendingQuotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
                Sin negociaciones activas.
              </div>
            ) : (
              <div className="space-y-4">
                {[...pendingBookingRequests, ...pendingQuotes].slice(0, 4).map(q => {
                  const isWebFunnel = "clientName" in q;
                  const clientName = isWebFunnel ? q.clientName : q.client?.user?.name ?? "Sin nombre";
                  const dateInfo = isWebFunnel ? q.requestedDate : q.eventDate;
                  const amount = isWebFunnel ? q.baseAmount : q.totalEstimated;
                  const createdAt = q.createdAt;
                  const daysAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

                  return (
                    <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/10 hover:border-primary/30 hover:bg-white transition-all shadow-sm group">
                      <div className="w-10 h-10 rounded-lg bg-white border border-border/40 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-foreground text-sm truncate uppercase tracking-tight">
                          {clientName}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                          {isWebFunnel ? "Lead Web" : "Manual"}
                          {dateInfo ? ` · ${formatDateMX(dateInfo, "d MMM")}` : ""}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="text-xs font-black text-foreground">
                          {MXN(amount)}
                        </div>
                        <FollowUpButton 
                          id={q.id}
                          type={isWebFunnel ? "booking" : "quote"}
                          phone={isWebFunnel ? (q as any).clientPhone : (q as any).client?.clientProfile?.whatsapp || (q as any).client?.clientProfile?.phone || ""}
                          clientName={clientName}
                          currentCount={(q as any).followUpCount || 0}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* -- Semáforo de Producción (Sección Inferior Completa) -- */}
      <div className="mt-8">
        <Card className="bg-white border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/5 mb-4">
            <div>
              <CardTitle className="font-heading font-black text-xl uppercase tracking-tight">Semáforo de Producción</CardTitle>
              <CardDescription>Auditoría de próximos shows confirmados y estatus de logística.</CardDescription>
            </div>
            <Link href="/admin/eventos" className="px-4 py-2 bg-primary/5 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">
              Ver Agenda Completa
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
                Sin eventos próximos en agenda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map(ev => {
                  const daysUntil = Math.ceil((ev.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  const hasContract = ev.contracts && ev.contracts.length > 0
                  const isPaid = ev.balance <= 0
                  const hasDeposit = ev.deposit > 0
                  const hasAudio = !!ev.audioEngineer
                  
                  const isUrgent = daysUntil <= 7
                  const isReady = hasContract && isPaid && hasAudio
                  
                  // Lógica de color de la tarjeta (Semáforo Principal)
                  // Verde: Todo listo. 
                  // Rojo: Falta algo y es urgente (<= 7 días).
                  // Amarillo/Normal: Falta algo pero hay tiempo.
                  const cardBorder = isReady 
                    ? "border-green-500/40 shadow-green-500/5 bg-green-50/20" 
                    : isUrgent 
                      ? "border-red-500/50 shadow-red-500/10 bg-red-50/50" 
                      : "border-border/40 bg-white shadow-sm"

                  const dateBlockColor = isReady
                    ? "bg-green-600 text-white border-green-700"
                    : isUrgent
                      ? "bg-red-600 text-white border-red-700"
                      : "bg-primary text-white border-primary"

                  const linkedBooking = ev.bookingRequest || (confirmedBookings as any[]).find(b => 
                    b.eventId === ev.id || 
                    (b.clientName && (
                      (ev.client?.user?.name && b.clientName.toLowerCase().includes(ev.client.user.name.toLowerCase())) ||
                      (ev.customName && b.clientName.toLowerCase().includes(ev.customName.toLowerCase())) ||
                      (ev.client?.user?.name && ev.client.user.name.toLowerCase().includes(b.clientName.toLowerCase())) ||
                      (ev.customName && ev.customName.toLowerCase().includes(b.clientName.toLowerCase()))
                    ))
                  )
                  const bookingId = linkedBooking?.id

                  return (
                    <a 
                      key={ev.id}
                      href={bookingId ? `/admin/ventas/${bookingId}` : `/admin/eventos`}
                      className={`flex flex-col h-full gap-4 p-5 rounded-2xl border ${cardBorder} transition-all hover:shadow-lg active:scale-[0.95] group cursor-pointer no-underline text-inherit`}
                      title={bookingId ? "Ver detalles de venta" : "Ver detalles de evento"}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border-2 ${dateBlockColor} shadow-lg transition-transform group-hover:scale-105`}>
                          <span className="text-[10px] font-black uppercase leading-none opacity-80">
                            {ev.date.toLocaleString("es-MX", { month: "short" })}
                          </span>
                          <span className="text-xl font-black leading-none mt-1">{ev.date.getDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-black text-foreground text-sm truncate uppercase tracking-tight flex items-center gap-1.5">
                            {ev.client?.user?.name ?? ev.customName ?? "Cliente"}
                            {ev.bookingRequest && <ExternalLink className="w-3 h-3 opacity-30" />}
                          </div>
                          <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${isUrgent && !isReady ? 'bg-red-100 border-red-200 text-red-700' : isReady ? 'bg-green-100 border-green-200 text-green-700' : 'bg-muted/50 text-muted-foreground'}`}>
                            {daysUntil === 0 ? "HOY" : daysUntil === 1 ? "MAÑANA" : `EN ${daysUntil} DÍAS`}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 relative z-10">
                        {/* CONTRATO: Rojo si no hay, Verde si hay */}
                        <div className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-[8px] font-black uppercase tracking-widest ${hasContract ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                          {hasContract ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} Contrato
                        </div>

                        {/* PAGO: Rojo si 0, Amarillo si hay algo, Verde si completo */}
                        <div className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
                          isPaid 
                            ? "bg-green-50 border-green-200 text-green-700" 
                            : hasDeposit 
                              ? "bg-yellow-50 border-yellow-200 text-yellow-700" 
                              : "bg-red-50 border-red-200 text-red-700"
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : hasDeposit ? <AlertCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} Pago
                        </div>

                        {/* AUDIO: Rojo si no hay inge, Verde si hay */}
                        <div className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-[8px] font-black uppercase tracking-widest ${hasAudio ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                          {hasAudio ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} Audio
                        </div>
                      </div>

                      <div className="mt-auto space-y-2 relative z-10">
                        {ev.balance > 0 && (
                          <div className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border text-center ${isUrgent ? "bg-red-100 border-red-200 text-red-700" : "bg-muted/30 border-border/10 text-muted-foreground"}`}>
                            Saldo Pendiente: {MXN(ev.balance)}
                          </div>
                        )}
                        {isReady && (
                          <div className="text-[10px] font-bold bg-green-100 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5">
                             <CheckCircle2 className="w-3 h-3" /> LISTO PARA EL SHOW
                          </div>
                        )}
                      </div>
                    </a>
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
