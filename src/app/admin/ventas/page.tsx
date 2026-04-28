import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ShoppingBag, 
  FileText, 
  CheckCircle2, 
  TrendingDown, 
  Plus, 
  Calendar, 
  Download, 
  Clock, 
  User, 
  AlertCircle 
} from "lucide-react"
import { VentasTableClient } from "@/components/admin/VentasTableClient"
import { MarkCompletedButton } from "@/components/admin/MarkCompletedButton"
import Link from "next/link"
import { formatDateMX } from "@/lib/utils"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { 
  style: "currency", 
  currency: "MXN", 
  maximumFractionDigits: 0 
}).format(v)

export default async function AdminVentasPage() {
  const now = new Date()
  const expirationThreshold = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)

  // 1. Saneamiento automático
  await db.bookingRequest.updateMany({
    where: { status: "pendiente", createdAt: { lt: expirationThreshold } },
    data: { status: "EXPIRED" }
  })

  // 2. Mover contratos agendados a completados si la fecha del evento ya pasó
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(23, 59, 59, 999)

  await db.bookingRequest.updateMany({
    where: { status: "agendado", requestedDate: { lt: yesterday } },
    data: { status: "completado" }
  })

  // 3. Fetch de datos unificados
  const [bookings, quotes, expiredStats, config] = await Promise.all([
    db.bookingRequest.findMany({ 
      orderBy: { createdAt: "desc" }
    }),
    db.quote.findMany({ include: { client: { include: { user: true } } }, orderBy: { createdAt: "desc" } }),
    db.bookingRequest.aggregate({
      _sum: { baseAmount: true },
      where: { status: "EXPIRED" }
    }),
    db.globalConfig.findUnique({ where: { id: "singleton" } })
  ])

  // Filtrado por fuente
  const webBookings = bookings.filter(b => (b as any).source !== "manual") // Ajuste si aún no está la columna
  const manualQuotes = bookings.filter(b => (b as any).source === "manual")
  const confirmed = bookings.filter(b => b.status === "agendado")
  const completados = bookings.filter(b => b.status === "completado")
  
  const potentialLoss = expiredStats._sum.baseAmount || 0

  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-heading font-black text-foreground tracking-tight">Centro de <span className="text-primary">Ventas</span></h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestiona pedidos web, cotizaciones manuales y contratos legales.</p>
        </div>
        <Link href="/admin/ventas/manual">
          <Button className="bg-primary hover:bg-primary/90 gap-2 h-11 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 text-white">
            <Plus className="w-5 h-5" /> Nueva Cotización Manual
          </Button>
        </Link>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card border-border/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-red-400">Pérdida Potencial (Expirados)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{MXN(potentialLoss)}</div>
            <p className="text-xs text-muted-foreground mt-1">Oportunidades no cerradas (+15d)</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">Conversión Funnel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">
              {Math.round((confirmed.length / (bookings.length || 1)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">De solicitud a evento confirmado</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-green-400">Contratos Activos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{confirmed.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Documentos legales generados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList className="bg-card border border-border/40 p-1 h-12 rounded-xl">
          <TabsTrigger value="bookings" className="gap-2 px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-foreground">
            <ShoppingBag className="w-4 h-4" /> Bookings (Web)
          </TabsTrigger>
          <TabsTrigger value="cotizaciones" className="gap-2 px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-foreground">
            <FileText className="w-4 h-4" /> Cotizaciones (Manual)
          </TabsTrigger>
          <TabsTrigger value="contratos" className="gap-2 px-6 rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-foreground">
            <CheckCircle2 className="w-4 h-4" /> Contratos
          </TabsTrigger>
          <TabsTrigger value="completados" className="gap-2 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-foreground">
            <CheckCircle2 className="w-4 h-4" /> Completados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <VentasTableClient items={webBookings} followUpTemplate={config?.msgTemplateFollowUp} />
        </TabsContent>

        <TabsContent value="cotizaciones" className="space-y-4">
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center gap-4">
              <AlertCircle className="text-primary w-5 h-5" />
              <p className="text-sm text-muted-foreground">Aquí se listan las cotizaciones creadas manualmente por el equipo de Vendetta y registros legacy (Quotes).</p>
            </div>
            <VentasTableClient items={manualQuotes} followUpTemplate={config?.msgTemplateFollowUp} />
            {quotes.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Registros Legacy (Quotes)</h3>
                <div className="opacity-60 grayscale scale-95 origin-left">
                  {/* Simplificado para no alargar el archivo demasiado, replicando estructura básica */}
                  <div className="bg-card border border-border/40 rounded-xl p-4">
                    {quotes.length} registros antiguos encontrados en la base de datos `Quote`.
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contratos" className="space-y-4">
          <ContratosGrid items={confirmed} isCompleted={false} />
        </TabsContent>

        <TabsContent value="completados" className="space-y-4">
          <ContratosGrid items={completados} isCompleted={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ContratosGrid({ items, isCompleted }: { items: any[], isCompleted: boolean }) {
  if (items.length === 0) return (
    <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl">
      <p className="text-muted-foreground">
        {isCompleted ? "No hay contratos completados." : "Aún no hay contratos generados (eventos confirmados)."}
      </p>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(c => (
        <Card key={c.id} className="bg-card border-border/20 group hover:border-green-500/30 transition-all">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              {isCompleted ? (
                <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400 bg-blue-500/5">COMPLETADO</Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-400 bg-green-500/5">AGENDADO</Badge>
              )}
              <div className="text-right">
                <span className="text-[10px] font-mono text-muted-foreground">{c.shortId}</span>
              </div>
            </div>
            <CardTitle className="text-base mt-2 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> {c.clientName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 text-muted-foreground" /> {formatDateMX(c.requestedDate, "d 'de' MMMM")}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 text-muted-foreground" /> {c.startTime} a {c.endTime} HRS
              </div>
            </div>
            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <div className="text-sm font-black text-foreground">{MXN(c.baseAmount + (c.viaticosAmount || 0))}</div>
              <div className="flex gap-2">
                {!isCompleted && (
                  <MarkCompletedButton bookingId={c.id} />
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 gap-2 border-green-600/30 text-green-400 hover:bg-green-600 hover:text-foreground" 
                  render={
                    <a href={`/api/admin/contract/${c.id}`}>
                      <Download className="w-3 h-3" /> Contrato PDF
                    </a>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    pendiente: { color: "text-yellow-400 border-yellow-700/40 bg-yellow-900/20", label: "Pendiente" },
    agendado:  { color: "text-green-400 border-green-700/40 bg-green-900/20", label: "Agendado" },
    cancelado: { color: "text-red-400 border-red-700/40 bg-red-900/20", label: "Cancelado" },
    EXPIRED:   { color: "text-muted-foreground border-gray-700 bg-gray-800/50", label: "Expirado" },
  }
  const cfg = configs[status] || configs.pendiente
  return (
    <Badge className={`${cfg.color} border px-2 py-0.5 text-[10px]`}>
      {cfg.label}
    </Badge>
  )
}
