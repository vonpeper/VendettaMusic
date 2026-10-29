import { getGoogleMetricsAction } from "@/actions/google-metrics"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Search, MousePointerClick, Eye, Users, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export function GoogleMetricsSkeleton() {
  return (
    <Card className="bg-card/70 border-border/40 shadow-sm overflow-hidden mb-8 animate-pulse">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-muted/60" />
            <div className="space-y-2">
              <div className="h-4 w-48 bg-muted/60 rounded" />
              <div className="h-3 w-72 bg-muted/40 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-8 w-20 bg-muted/50 rounded" />
            <div className="h-8 w-20 bg-muted/50 rounded" />
            <div className="h-8 w-24 bg-muted/50 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export async function GoogleMetricsWidget() {
  const res = await getGoogleMetricsAction("28d").catch(() => ({
    success: false,
    data: undefined
  }))
  const data = res.data

  const isLinked = Boolean(res.success && data?.status?.isLinked)
  const sc = data?.searchConsole
  const ga = data?.analytics

  return (
    <Card className="bg-card/70 border-border/40 shadow-sm overflow-hidden mb-8">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-emerald-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-foreground text-base">
                  Presencia Digital & Tráfico Web
                </h3>
                {isLinked ? (
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold py-0">
                    En Vivo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-bold py-0">
                    No Vinculado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLinked
                  ? "Rendimiento consolidado en Google Search Console y Google Analytics 4 (Últimos 28 días)."
                  : "Conecta tu cuenta de Google para visualizar visitas, clics en buscador y keywords de vendetta.mx."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap md:flex-nowrap justify-between md:justify-end">
            {isLinked ? (
              <div className="flex items-center gap-6 text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3 text-blue-400" /> Clics Google
                  </span>
                  <div className="text-lg font-heading font-black text-foreground font-mono">
                    {sc ? sc.overview.clicks.toLocaleString("es-MX") : "--"}
                  </div>
                </div>

                <div className="hidden sm:block">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Eye className="w-3 h-3 text-indigo-400" /> Impresiones
                  </span>
                  <div className="text-lg font-heading font-black text-foreground font-mono">
                    {sc ? sc.overview.impressions.toLocaleString("es-MX") : "--"}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-400" /> Usuarios GA4
                  </span>
                  <div className="text-lg font-heading font-black text-emerald-400 font-mono">
                    {ga ? ga.overview.activeUsers.toLocaleString("es-MX") : "--"}
                  </div>
                </div>
              </div>
            ) : null}

            <Link
              href="/admin/analytics"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shrink-0"
            >
              {isLinked ? "Ver Analíticas" : "Configurar Google"}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
