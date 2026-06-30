export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IncomeChart } from "@/components/admin/IncomeChart"
import { 
  ArrowLeft, Wallet, Calendar, TrendingUp, DollarSign, 
  Tag, Activity, ChevronRight 
} from "lucide-react"

const MXN = (v: number) => 
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export default async function AdminFinanzasPage() {
  const session = await auth()
  
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const now = new Date()
  const thisYear = now.getFullYear()

  // 1. Fetch de todos los eventos del año actual
  const [bandEvents, dbEvents] = await Promise.all([
    db.bandEvent.findMany({
      where: {
        eventYear: thisYear,
        status: { notIn: ["cancelado", "cancelled", "pendiente", "pending"] }
      }
    }),
    db.event.findMany({
      where: {
        status: { notIn: ["cancelado", "cancelled", "pendiente", "pending"] },
        date: {
          gte: new Date(`${thisYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${thisYear}-12-31T23:59:59.999Z`)
        }
      },
      include: {
        package: true
      }
    })
  ])

  // 2. Pre-inicializar los 12 meses del año en curso con $0 y 0 shows
  const monthlyData = MONTHS.map(m => ({
    month: m,
    total: 0,
    count: 0
  }))

  // 3. Acumular ingresos de BandEvents (shows manuales cargados previamente)
  bandEvents.forEach(e => {
    const idx = MONTHS.indexOf(e.eventMonth)
    if (idx !== -1) {
      monthlyData[idx].total += e.totalIncome || 0
      monthlyData[idx].count += 1
    }
  })

  // 4. Acumular ingresos de Events (reservas del nuevo funnel y manuales confirmadas)
  dbEvents.forEach(e => {
    const m = MONTHS[new Date(e.date).getMonth()]
    const idx = MONTHS.indexOf(m)
    if (idx !== -1) {
      monthlyData[idx].total += e.totalIncome || e.amount || 0
      monthlyData[idx].count += 1
    }
  })

  // 5. Cálculos para KPIs anuales
  const totalRevenue = monthlyData.reduce((acc, curr) => acc + curr.total, 0)
  const totalShows = monthlyData.reduce((acc, curr) => acc + curr.count, 0)
  const averageTicket = totalShows > 0 ? totalRevenue / totalShows : 0

  // 6. Proyecciones (Futuro vs Pasado basado en la fecha de hoy)
  let pastRevenue = 0
  let futureRevenue = 0
  let pastShows = 0
  let futureShows = 0

  dbEvents.forEach(e => {
    const isFuture = new Date(e.date) >= now
    const income = e.totalIncome || e.amount || 0
    if (isFuture) {
      futureRevenue += income
      futureShows += 1
    } else {
      pastRevenue += income
      pastShows += 1
    }
  })

  bandEvents.forEach(e => {
    const isFuture = e.eventDate >= now
    const income = e.totalIncome || 0
    if (isFuture) {
      futureRevenue += income
      futureShows += 1
    } else {
      pastRevenue += income
      pastShows += 1
    }
  })

  // 7. Distribución por Paquete / Categoría
  const packageMap: Record<string, { total: number; count: number }> = {}
  
  dbEvents.forEach(e => {
    const name = e.package?.name || e.ceremonyType || "Personalizado"
    if (!packageMap[name]) packageMap[name] = { total: 0, count: 0 }
    packageMap[name].total += e.totalIncome || e.amount || 0
    packageMap[name].count += 1
  })

  bandEvents.forEach(e => {
    const name = e.eventType || "Show general"
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1)
    if (!packageMap[capitalized]) packageMap[capitalized] = { total: 0, count: 0 }
    packageMap[capitalized].total += e.totalIncome || 0
    packageMap[capitalized].count += 1
  })

  const packagesBreakdown = Object.entries(packageMap)
    .map(([name, v]) => ({
      name,
      total: v.total,
      count: v.count,
      pct: totalRevenue > 0 ? Math.round((v.total / totalRevenue) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="p-8 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <Link href="/admin" className="hover:text-primary flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Dashboard
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span>Finanzas</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            Análisis Financiero {thisYear}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Informe anual de ingresos, promedio de facturación y proyecciones de shows.
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Facturación Anual
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-heading text-foreground tracking-tighter">
              {MXN(totalRevenue)}
            </div>
            <p className="text-[10px] mt-1 font-bold uppercase tracking-wider text-muted-foreground">
              Ingreso consolidado {thisYear}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Shows Realizados
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-heading text-foreground tracking-tighter">
              {totalShows}
            </div>
            <p className="text-[10px] mt-1 font-bold uppercase tracking-wider text-green-600">
              {pastShows} ejecutados · {futureShows} programados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Ticket Promedio
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-heading text-foreground tracking-tighter">
              {MXN(averageTicket)}
            </div>
            <p className="text-[10px] mt-1 font-bold uppercase tracking-wider text-muted-foreground">
              Promedio cobrado por show
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Cartera Proyectada
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-heading text-foreground tracking-tighter text-blue-600">
              {MXN(futureRevenue)}
            </div>
            <p className="text-[10px] mt-1 font-bold uppercase tracking-wider text-blue-500 font-bold">
              Por cobrar en shows futuros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Row */}
      <div className="mb-8">
        <Card className="bg-white border-border/40 shadow-sm">
          <CardHeader className="border-b border-border/5 mb-4">
            <CardTitle className="font-heading font-black text-xl">Tendencia Mensual Completa</CardTitle>
            <CardDescription>Facturación y número de shows de Enero a Diciembre de {thisYear}.</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeChart data={monthlyData} />
          </CardContent>
        </Card>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Column */}
        <Card className="lg:col-span-2 bg-white border-border/40 shadow-sm">
          <CardHeader className="border-b border-border/5 mb-4">
            <CardTitle className="font-heading font-black text-xl">Detalle Mensual</CardTitle>
            <CardDescription>Resumen de métricas tabulado por mes.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Mes</th>
                  <th className="py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest text-center">Shows</th>
                  <th className="py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest text-right">Total Ingresos</th>
                  <th className="py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-widest text-right">Ticket Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {monthlyData.map((d) => {
                  const monthlyAvg = d.count > 0 ? d.total / d.count : 0
                  const isCurrentMonth = MONTHS[now.getMonth()] === d.month
                  
                  return (
                    <tr 
                      key={d.month} 
                      className={`hover:bg-muted/10 transition-colors ${isCurrentMonth ? "bg-primary/5 font-bold" : ""}`}
                    >
                      <td className="py-3 px-4 text-sm font-semibold text-foreground flex items-center gap-2">
                        {d.month}
                        {isCurrentMonth && (
                          <span className="text-[8px] bg-primary text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Actual
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground text-center font-bold">
                        {d.count}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground text-right font-bold">
                        {MXN(d.total)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground text-right font-medium">
                        {MXN(monthlyAvg)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Breakdown Column */}
        <Card className="bg-white border-border/40 shadow-sm">
          <CardHeader className="border-b border-border/5 mb-4">
            <CardTitle className="font-heading font-black text-xl">Distribución por Paquete</CardTitle>
            <CardDescription>Principales fuentes de rentabilidad.</CardDescription>
          </CardHeader>
          <CardContent>
            {packagesBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-12">
                Sin datos de distribución de paquetes.
              </p>
            ) : (
              <div className="space-y-6">
                {packagesBreakdown.map((pkg) => (
                  <div key={pkg.name} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-black text-foreground truncate max-w-[140px]">{pkg.name}</span>
                        <span className="text-[10px] text-muted-foreground font-bold shrink-0">({pkg.count} show{pkg.count !== 1 ? "s" : ""})</span>
                      </div>
                      <span className="font-bold text-foreground shrink-0">{MXN(pkg.total)}</span>
                    </div>
                    {/* Custom progress bar */}
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" 
                        style={{ width: `${pkg.pct}%` }}
                      />
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] text-primary font-bold">{pkg.pct}% del total</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
