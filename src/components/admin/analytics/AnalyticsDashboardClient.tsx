"use client"

import { useState, useTransition } from "react"
import { GoogleMetricsCombined, getGoogleMetricsAction, saveGoogleSuiteConfigAction, testGoogleSuiteConnectionAction } from "@/actions/google-metrics"
import { DualTrendChart, HorizontalBarList } from "./AnalyticsCharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, Search, RefreshCw, ExternalLink, Globe, Users, 
  MousePointerClick, Eye, TrendingUp, ArrowUpRight, ArrowDownRight, 
  Smartphone, Monitor, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, 
  Layers, Radio, HelpCircle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Props {
  initialData: GoogleMetricsCombined
  initialPeriod?: "7d" | "28d" | "90d"
}

export function AnalyticsDashboardClient({ initialData, initialPeriod = "28d" }: Props) {
  const [data, setData] = useState<GoogleMetricsCombined>(initialData)
  const [period, setPeriod] = useState<"7d" | "28d" | "90d">(initialPeriod)
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState("search-console")
  const [testResult, setTestResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)

  const handlePeriodChange = (newPeriod: "7d" | "28d" | "90d") => {
    setPeriod(newPeriod)
    startTransition(async () => {
      const res = await getGoogleMetricsAction(newPeriod, false)
      if (res.success && res.data) {
        setData(res.data)
      } else {
        toast.error(res.message || "Error al cargar periodo")
      }
    })
  }

  const handleForceRefresh = () => {
    startTransition(async () => {
      const res = await getGoogleMetricsAction(period, true)
      if (res.success && res.data) {
        setData(res.data)
        toast.success("Métricas actualizadas desde Google")
      } else {
        toast.error(res.message || "Error al actualizar")
      }
    })
  }

  const handleRunTest = async () => {
    setIsTesting(true)
    try {
      const res = await testGoogleSuiteConnectionAction()
      setTestResult(res)
      if (res.success) {
        toast.success("Prueba de conexión completada")
      } else {
        toast.error(res.message || "Error en la prueba")
      }
    } catch (e: any) {
      toast.error(e.message || "Error inesperado")
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await saveGoogleSuiteConfigAction(formData)
      if (res.success) {
        toast.success(res.message)
        const updated = await getGoogleMetricsAction(period, true)
        if (updated.success && updated.data) {
          setData(updated.data)
        }
      } else {
        toast.error(res.message)
      }
    })
  }

  const sc = data.searchConsole
  const ga = data.analytics
  const status = data.status

  const scTrends = (sc?.dailyTrends || []).map(t => ({
    date: t.date,
    val1: t.clicks,
    val2: t.impressions,
  }))

  const gaTrends = (ga?.dailyTrends || []).map(t => ({
    date: t.date,
    val1: t.activeUsers,
    val2: t.sessions,
  }))

  const renderDelta = (delta: number | null, invertColor = false) => {
    if (delta === null || delta === undefined) {
      return <span className="text-[11px] text-muted-foreground font-mono">--</span>
    }
    const isPositive = delta > 0
    const isNeutral = delta === 0
    let colorClass = isPositive ? "text-emerald-400" : "text-rose-400"
    if (invertColor) {
      // Para métricas como posición en Google, mejorar significa menor número
      colorClass = isPositive ? "text-emerald-400" : "text-rose-400"
    }

    if (isNeutral) {
      return <span className="text-[11px] text-muted-foreground font-mono">0%</span>
    }

    return (
      <span className={`inline-flex items-center text-[11px] font-bold font-mono ${colorClass}`}>
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
        {Math.abs(delta)}%
      </span>
    )
  }

  const getPositionBadge = (pos: number) => {
    if (pos <= 3.0) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    if (pos <= 10.0) return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    if (pos <= 20.0) return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    return "bg-slate-500/15 text-slate-400 border-slate-500/30"
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1.5">
            <BarChart3 className="w-4 h-4" />
            <span>Google Marketing & SEO Suite</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            Métricas de Tráfico y Posicionamiento
            {status.isLinked && (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Google Conectado
              </Badge>
            )}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Datos en tiempo real y tendencias consolidadas de Google Search Console y Google Analytics (GA4).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="bg-card border border-border/40 p-1 rounded-xl flex items-center gap-1">
            {(["7d", "28d", "90d"] as const).map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                disabled={isPending}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  period === p
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/80"
                }`}
              >
                {p === "7d" ? "7 Días" : p === "28d" ? "28 Días" : "90 Días"}
              </button>
            ))}
          </div>

          {/* Force Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceRefresh}
            disabled={isPending}
            className="h-9 border-border/40 hover:bg-primary/10 text-foreground text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPending ? "animate-spin text-primary" : ""}`} />
            Actualizar
          </Button>

          {/* Reconnect / Link Google */}
          <Button
            size="sm"
            asChild
            className="h-9 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
          >
            <a href="/api/auth/google?returnTo=/admin/analytics">
              {status.isLinked ? "Reconectar Google" : "Vincular Google"}
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Warning Banner if not fully configured */}
      {(!status.isLinked || !status.hasAnalytics || !status.hasSearchConsole) && (
        <div className="bg-gradient-to-r from-blue-950/40 via-card to-amber-950/20 border border-blue-500/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">
                {!status.isLinked 
                  ? "Vincula tu cuenta de Google para habilitar las métricas" 
                  : "Configuración pendiente de IDs de Google"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-2xl">
                {!status.isLinked
                  ? "Haz clic en 'Vincular Google' para autorizar la lectura de Search Console y Google Analytics con tu cuenta de Vendetta."
                  : `Se requiere ${!status.hasAnalytics ? "el GA4 Property ID " : ""}${!status.hasAnalytics && !status.hasSearchConsole ? "y " : ""}${!status.hasSearchConsole ? "la URL de Search Console " : ""}en la pestaña 'Configuración'.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("connection")}
              className="text-xs font-bold border-border/40"
            >
              Configurar IDs
            </Button>
            {!status.isLinked && (
              <Button
                size="sm"
                asChild
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                <a href="/api/auth/google?returnTo=/admin/analytics">Vincular Cuenta</a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Search Console: Clicks */}
        <Card className="bg-card/70 border-border/40 shadow-sm backdrop-blur-sm">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MousePointerClick className="w-3 h-3 text-blue-400" /> Clics Google
              </span>
              {renderDelta(sc?.overview.clicksDeltaPct ?? null)}
            </div>
            <div className="text-2xl font-heading font-black text-foreground">
              {sc ? sc.overview.clicks.toLocaleString("es-MX") : "--"}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">Visitas desde el buscador</p>
          </CardContent>
        </Card>

        {/* Search Console: Impressions */}
        <Card className="bg-card/70 border-border/40 shadow-sm backdrop-blur-sm">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3 text-indigo-400" /> Impresiones
              </span>
              {renderDelta(sc?.overview.impressionsDeltaPct ?? null)}
            </div>
            <div className="text-2xl font-heading font-black text-foreground">
              {sc ? sc.overview.impressions.toLocaleString("es-MX") : "--"}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">Apariciones en búsquedas</p>
          </CardContent>
        </Card>

        {/* Search Console: CTR */}
        <Card className="bg-card/70 border-border/40 shadow-sm backdrop-blur-sm">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> CTR Medio
              </span>
              {renderDelta(sc?.overview.ctrDeltaPct ?? null)}
            </div>
            <div className="text-2xl font-heading font-black text-foreground">
              {sc ? `${sc.overview.ctr}%` : "--"}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">Porcentaje de clics</p>
          </CardContent>
        </Card>

        {/* Search Console: Posición */}
        <Card className="bg-card/70 border-border/40 shadow-sm backdrop-blur-sm">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-amber-400" /> Posición Media
              </span>
              {renderDelta(sc?.overview.positionDeltaPct ?? null, true)}
            </div>
            <div className="text-2xl font-heading font-black text-foreground">
              {sc ? `#${sc.overview.position}` : "--"}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">Ranking promedio SERP</p>
          </CardContent>
        </Card>

        {/* GA4: Active Users */}
        <Card className="bg-card/70 border-border/40 shadow-sm backdrop-blur-sm">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" /> Usuarios (GA4)
              </span>
              {renderDelta(ga?.overview.activeUsersDeltaPct ?? null)}
            </div>
            <div className="text-2xl font-heading font-black text-foreground">
              {ga ? ga.overview.activeUsers.toLocaleString("es-MX") : "--"}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">Visitantes únicos en web</p>
          </CardContent>
        </Card>

        {/* GA4: Realtime / Sessions */}
        <Card className="bg-card/70 border-border/40 shadow-sm backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" /> En Vivo
              </span>
            </div>
            <div className="text-2xl font-heading font-black text-emerald-400">
              {ga ? ga.overview.realtimeActiveUsers : "0"}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {ga ? `${ga.overview.sessions.toLocaleString("es-MX")} sesiones en ${period}` : "Usuarios ahora (30m)"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border/40 p-1 rounded-2xl gap-2 w-full md:w-auto justify-start">
          <TabsTrigger
            value="search-console"
            className="rounded-xl px-4 py-2 font-bold text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Search className="w-3.5 h-3.5 mr-2" />
            Google Search Console
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-xl px-4 py-2 font-bold text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-2" />
            Google Analytics 4
          </TabsTrigger>
          <TabsTrigger
            value="connection"
            className="rounded-xl px-4 py-2 font-bold text-xs data-[state=active]:bg-card/90"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-2 text-primary" />
            Ajustes de Conexión
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GOOGLE SEARCH CONSOLE */}
        <TabsContent value="search-console" className="space-y-6 mt-6">
          {data.errors.searchConsole && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{data.errors.searchConsole}</span>
            </div>
          )}

          {/* Trend Chart */}
          <Card className="bg-card/70 border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
                <span>Rendimiento en Búsquedas de Google (Clics vs Impresiones)</span>
                <span className="text-xs font-mono text-muted-foreground font-normal">
                  {sc?.overview.dateRange.startDate} al {sc?.overview.dateRange.endDate}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Evolución diaria de las impresiones orgánicas de Vendetta y los clics recibidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <DualTrendChart
                data={scTrends}
                label1="Clics"
                label2="Impresiones"
                color1="#3b82f6"
                color2="#818cf8"
                height={230}
              />
            </CardContent>
          </Card>

          {/* 2 Column Layout: Keywords & Top Landing Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Keywords / Queries */}
            <Card className="bg-card/70 border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                  <span>Top Palabras Clave en Google</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    {sc?.topQueries.length || 0} consultas registradas
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Términos que los usuarios escriben en Google para encontrar a Vendetta.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-card/40 text-muted-foreground text-[10px] uppercase tracking-wider">
                        <th className="text-left py-2.5 px-4 font-bold">Consulta / Keyword</th>
                        <th className="text-right py-2.5 px-3 font-bold">Clics</th>
                        <th className="text-right py-2.5 px-3 font-bold">Impresiones</th>
                        <th className="text-right py-2.5 px-3 font-bold">CTR</th>
                        <th className="text-center py-2.5 px-4 font-bold">Posición</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 font-mono">
                      {sc?.topQueries && sc.topQueries.length > 0 ? (
                        sc.topQueries.slice(0, 15).map((q, idx) => (
                          <tr key={idx} className="hover:bg-card/40 transition-colors">
                            <td className="py-2.5 px-4 font-sans font-medium text-foreground max-w-[200px] truncate" title={q.query}>
                              {q.query}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-blue-400">
                              {q.clicks}
                            </td>
                            <td className="py-2.5 px-3 text-right text-muted-foreground">
                              {q.impressions.toLocaleString("es-MX")}
                            </td>
                            <td className="py-2.5 px-3 text-right text-foreground/80">
                              {q.ctr}%
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getPositionBadge(q.position)}`}>
                                #{q.position}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground font-sans italic">
                            No se encontraron consultas en este periodo o faltan datos de Search Console.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Top Landing Pages from Search */}
            <Card className="bg-card/70 border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                  <span>Páginas de Destino en Google</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    {sc?.topPages.length || 0} URLs activas
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  URLs del sitio con mayor tráfico orgánico y clics en el buscador.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-card/40 text-muted-foreground text-[10px] uppercase tracking-wider">
                        <th className="text-left py-2.5 px-4 font-bold">Página</th>
                        <th className="text-right py-2.5 px-3 font-bold">Clics</th>
                        <th className="text-right py-2.5 px-3 font-bold">Impresiones</th>
                        <th className="text-center py-2.5 px-4 font-bold">Posición</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 font-mono">
                      {sc?.topPages && sc.topPages.length > 0 ? (
                        sc.topPages.slice(0, 15).map((p, idx) => {
                          let cleanPath = p.page
                          try {
                            cleanPath = new URL(p.page).pathname
                          } catch {
                            // keep
                          }
                          return (
                            <tr key={idx} className="hover:bg-card/40 transition-colors">
                              <td className="py-2.5 px-4 font-sans font-medium text-foreground max-w-[200px] truncate" title={p.page}>
                                <span className="font-mono text-xs text-blue-400">{cleanPath}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                                {p.clicks}
                              </td>
                              <td className="py-2.5 px-3 text-right text-muted-foreground">
                                {p.impressions.toLocaleString("es-MX")}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getPositionBadge(p.position)}`}>
                                  #{p.position}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground font-sans italic">
                            Sin páginas registradas en este periodo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: GOOGLE ANALYTICS 4 */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          {data.errors.analytics && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{data.errors.analytics}</span>
            </div>
          )}

          {/* Trend Chart: Users & Sessions */}
          <Card className="bg-card/70 border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
                <span>Tráfico de Audiencia (Usuarios Activos vs Sesiones)</span>
                <span className="text-xs font-mono text-muted-foreground font-normal">
                  Últimos {period === "7d" ? 7 : period === "28d" ? 28 : 90} días
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Volumen de visitantes e interacciones registradas por Google Analytics 4.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <DualTrendChart
                data={gaTrends}
                label1="Usuarios Activos"
                label2="Sesiones"
                color1="#10b981"
                color2="#06b6d4"
                height={230}
              />
            </CardContent>
          </Card>

          {/* 3 Column Grid: Channels, Top Pages, Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Acquisition Channels */}
            <Card className="bg-card/70 border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Canales de Adquisición
                </CardTitle>
                <CardDescription className="text-xs">
                  Origen de las sesiones de los visitantes.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <HorizontalBarList
                  items={(ga?.trafficSources || []).map(ch => ({
                    label: ch.channel,
                    value: ch.sessions,
                    total: ga?.overview.sessions || 1,
                    color: ch.channel.toLowerCase().includes("organic") ? "#10b981" : "#3b82f6",
                  }))}
                />
              </CardContent>
            </Card>

            {/* Devices Breakdown */}
            <Card className="bg-card/70 border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  Dispositivos
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribución móvil, desktop y tablet.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <HorizontalBarList
                  items={(ga?.devices || []).map(dev => ({
                    label: dev.deviceCategory.toUpperCase(),
                    value: dev.sessions,
                    total: ga?.overview.sessions || 1,
                    color: dev.deviceCategory.toLowerCase() === "mobile" ? "#06b6d4" : "#8b5cf6",
                  }))}
                />
                {ga && (
                  <div className="mt-6 pt-4 border-t border-border/30 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tasa de Rebote:</span>
                      <span className="font-mono font-bold text-foreground">{ga.overview.bounceRate}%</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Duración Media:</span>
                      <span className="font-mono font-bold text-foreground">{Math.round(ga.overview.averageSessionDuration)}s</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Visited Pages in GA4 */}
            <Card className="bg-card/70 border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Páginas Más Vistas
                </CardTitle>
                <CardDescription className="text-xs">
                  Vistas de página por sección web.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-border/20">
                  {ga?.topPages && ga.topPages.length > 0 ? (
                    ga.topPages.map((p, idx) => (
                      <div key={idx} className="p-3 hover:bg-card/40 transition-colors flex items-center justify-between text-xs">
                        <div className="truncate max-w-[170px]" title={p.pageTitle}>
                          <p className="font-medium text-foreground truncate">{p.pageTitle}</p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">{p.pagePath}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-mono font-bold text-emerald-400">
                            {p.pageViews.toLocaleString("es-MX")}
                          </span>
                          <p className="text-[9px] text-muted-foreground">vistas</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-muted-foreground text-xs italic">
                      Sin datos de páginas en este periodo.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: CONFIGURATION & DIAGNOSTICS */}
        <TabsContent value="connection" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Settings Form */}
            <Card className="bg-card/70 border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Configuración de Identificadores Google
                </CardTitle>
                <CardDescription className="text-xs">
                  Ingresa las propiedades de Google Analytics y Search Console de Vendetta Music.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyId" className="text-xs font-semibold">
                      GA4 Property ID (ID Numérico)
                    </Label>
                    <Input
                      id="propertyId"
                      name="propertyId"
                      defaultValue={status.propertyId || ""}
                      placeholder="Ej: 439281729 (sin prefijo properties/)"
                      className="bg-card border-border/40 font-mono text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Lo encuentras en: <em>Google Analytics &gt; Administrador &gt; Propiedad &gt; Detalles de la propiedad</em>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="measurementId" className="text-xs font-semibold">
                      GA4 Measurement ID (Tracking Frontend)
                    </Label>
                    <Input
                      id="measurementId"
                      name="measurementId"
                      defaultValue={status.measurementId || ""}
                      placeholder="Ej: G-XXXXXXXXXX"
                      className="bg-card border-border/40 font-mono text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Etiqueta web para registrar automáticamente visitas en `vendetta.mx`.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteUrl" className="text-xs font-semibold">
                      Search Console Site URL
                    </Label>
                    <Input
                      id="siteUrl"
                      name="siteUrl"
                      defaultValue={status.siteUrl || "https://vendetta.mx"}
                      placeholder="Ej: https://vendetta.mx o sc-domain:vendetta.mx"
                      className="bg-card border-border/40 font-mono text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      URL exacta de la propiedad verificada en search.google.com.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-primary hover:bg-primary/90 font-bold text-xs h-10 mt-2 text-white"
                  >
                    {isPending ? "Guardando..." : "Guardar Identificadores"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Live Connection Diagnostics */}
            <Card className="bg-card/70 border-border/40 shadow-sm flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-400" />
                    Diagnóstico de Conexión en Vivo
                  </span>
                  <Badge variant="outline" className={`text-xs ${status.isLinked ? "border-emerald-500/30 text-emerald-400" : "border-rose-500/30 text-rose-400"}`}>
                    {status.isLinked ? "OAuth Activo" : "Desconectado"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Prueba la validez del token y los permisos concedidos por Google Cloud.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-card border border-border/40 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cuenta Google Vinculada:</span>
                    <span className="font-bold font-mono">{status.isLinked ? "Sí (Refresh Token presente)" : "No"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Scope Google Calendar:</span>
                    <span className="text-emerald-400 font-bold">Activo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Scope Search Console:</span>
                    <span className={status.isLinked ? "text-emerald-400 font-bold" : "text-muted-foreground"}>
                      {status.isLinked ? "Autorizado" : "Pendiente"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Scope Google Analytics:</span>
                    <span className={status.isLinked ? "text-emerald-400 font-bold" : "text-muted-foreground"}>
                      {status.isLinked ? "Autorizado" : "Pendiente"}
                    </span>
                  </div>
                </div>

                {testResult && (
                  <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                    testResult.success ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                  }`}>
                    <p className="font-bold flex items-center gap-1.5">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      Resultado de la prueba:
                    </p>
                    {testResult.searchConsole && (
                      <p>
                        Sitios encontrados en Search Console: <strong>{testResult.searchConsole.accessibleSites?.length || 0}</strong>
                        {testResult.searchConsole.accessibleSites?.length > 0 && ` (${testResult.searchConsole.accessibleSites.join(", ")})`}
                      </p>
                    )}
                    {testResult.analytics && (
                      <p>
                        Google Analytics Data API: <strong>{testResult.analytics.isWorking ? "Correcto" : `Error: ${testResult.analytics.error || "No responde"}`}</strong>
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRunTest}
                    disabled={isTesting || !status.isLinked}
                    className="w-full text-xs font-bold border-border/40 hover:bg-card h-10"
                  >
                    {isTesting ? "Verificando..." : "Ejecutar Diagnóstico de APIs Google"}
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full text-xs font-bold border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-10"
                  >
                    <Link href="/admin/configuracion?tab=integraciones">
                      Abrir Ajustes Maestros
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
