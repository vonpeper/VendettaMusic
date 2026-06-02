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
  Users,
  AlertCircle,
  User,
  Clock,
  Plus,
  Calendar,
  Download
} from "lucide-react"
import { VentasTableClient } from "@/components/admin/VentasTableClient"
import { MarkCompletedButton } from "@/components/admin/MarkCompletedButton"
import { ContractStatusSwitcher } from "@/components/admin/ContractStatusSwitcher"
import { CancelBookingButton } from "@/components/admin/CancelBookingButton"
import Link from "next/link"
import { formatDateMX, cn } from "@/lib/utils"
// Temporary diagnostics
console.log("[DB URL]", process.env.DATABASE_URL)

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

  const toComplete = await db.bookingRequest.findMany({
    where: { status: "agendado", requestedDate: { lt: yesterday } },
    select: { id: true, eventId: true }
  })

  if (toComplete.length > 0) {
    const ids = toComplete.map(b => b.id)
    const eventIds = toComplete.map(b => b.eventId).filter(Boolean) as string[]

    await db.$transaction([
      db.bookingRequest.updateMany({
        where: { id: { in: ids } },
        data: { status: "completado", paymentStatus: "paid" }
      }),
      db.event.updateMany({
        where: { id: { in: eventIds } },
        data: { status: "completado" }
      })
    ])
  }

  // 3. Fetch de datos unificados
  const [bookings, quotes, expiredStats, config] = await Promise.all([
    db.bookingRequest.findMany({ 
      orderBy: { createdAt: "desc" },
      include: {
        client: { include: { user: true } },
        payments: true,
        event: {
          include: {
            musicians: true,
            contracts: true
          }
        }
      }
    }),
    db.quote.findMany({
      orderBy: { createdAt: "desc" }
    }),
    db.bookingRequest.aggregate({
      _count: true,
      _sum: { baseAmount: true },
      where: { status: "EXPIRED" }
    }),
    db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  ])

  // 4. Obtener estados de notificaciones para el semáforo
  const bookingIds = bookings.map(b => b.id)
  const notifications = await db.notification.findMany({
    where: { bookingRequestId: { in: bookingIds } },
    select: { bookingRequestId: true, type: true, status: true },
    orderBy: { createdAt: 'desc' }
  })

  // Agrupar notificaciones por booking
  const itemsWithNotifications = bookings.map(b => {
    const bNotifs = notifications.filter(n => n.bookingRequestId === b.id)
    return {
      ...b,
      notifications: {
        admin: bNotifs.find(n => n.type === 'ADMIN_NEW_BOOKING')?.status || 'none',
        client: bNotifs.find(n => n.type === 'CLIENT_FOLLOWUP' || n.type === 'CLIENT_CONFIRMED')?.status || 'none',
        musicians: bNotifs.find(n => n.type === 'MUSICIAN_GIG_ANNOUNCE')?.status || 'none'
      },
      contractStatus: b.event?.contracts?.[0]?.status || 'pending'
    }
  })

  // Filtrado por fuente - Ahora más robusto
  const webBookings = itemsWithNotifications.filter(b => (b as any).source === "web" || !(b as any).source)
  const manualQuotes = itemsWithNotifications.filter(b => (b as any).source === "manual" || (b as any).source === "eventualidad")
  const confirmed = itemsWithNotifications.filter(b => b.status === "agendado")
  const completados = itemsWithNotifications.filter(b => b.status === "completado")
  
  const potentialLoss = expiredStats._sum.baseAmount || 0

  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-heading font-black text-foreground tracking-tight">Centro de <span className="text-blue-600">Ventas</span></h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestiona pedidos web, cotizaciones manuales y contratos legales.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            asChild
            className="bg-muted-foreground/10 hover:bg-muted-foreground/20 text-foreground border border-border/40 gap-2 h-11 px-6 rounded-xl font-bold transition-all"
          >
            <a href="/api/admin/export?type=bookings" download>
              <Download className="w-5 h-5" /> Exportar Excel
            </a>
          </Button>
          <Link href="/admin/ventas/manual">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2 h-11 px-6 rounded-xl font-bold shadow-lg shadow-blue-600/20 text-white">
              <Plus className="w-5 h-5" /> Nueva Cotización Manual
            </Button>
          </Link>
        </div>
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
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Conversión Funnel</CardDescription>
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
        <TabsList className="flex flex-row overflow-x-auto hide-scrollbar snap-x snap-mandatory bg-card border border-border/40 p-1 h-auto min-h-12 rounded-xl justify-start w-full">
          <TabsTrigger value="bookings" className="shrink-0 whitespace-nowrap snap-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <ShoppingBag className="w-4 h-4" /> Pedidos Web
          </TabsTrigger>
          <TabsTrigger value="cotizaciones" className="shrink-0 whitespace-nowrap snap-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-800 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <FileText className="w-4 h-4" /> Ventas Manuales
          </TabsTrigger>
          <TabsTrigger value="contratos" className="shrink-0 whitespace-nowrap snap-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <CheckCircle2 className="w-4 h-4" /> Contratos
          </TabsTrigger>
          <TabsTrigger value="completados" className="shrink-0 whitespace-nowrap snap-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <CheckCircle2 className="w-4 h-4" /> Completados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <VentasTableClient items={webBookings} followUpTemplate={config?.msgTemplateFollowUp} />
        </TabsContent>

        <TabsContent value="cotizaciones" className="space-y-4">
          <div className="space-y-6">
            <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-xl flex items-center gap-4">
              <AlertCircle className="text-blue-600 w-5 h-5" />
              <p className="text-sm text-muted-foreground">Aquí se listan las ventas creadas manualmente (como Alquimia 73) y registros antiguos. Usa los filtros de columna para buscar rápido.</p>
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

  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const grouped: Record<string, any[]> = {}
  items.forEach(c => {
    const d = new Date(c.requestedDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(c)
  })

  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      {sortedKeys.map(key => {
        const [year, monthStr] = key.split('-')
        const monthName = MONTHS[parseInt(monthStr, 10) - 1]
        const isOpen = key === currentMonthKey || sortedKeys.length === 1 || sortedKeys[0] === key

        return (
          <details key={key} open={isOpen} className="group border border-border/40 bg-card rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between cursor-pointer p-4 hover:bg-muted/50 transition-colors list-none select-none">
              <div className="flex items-center gap-3">
                <span className="font-bold text-foreground capitalize text-lg">{monthName} {year}</span>
                <Badge variant="secondary" className="text-xs">{grouped[key].length}</Badge>
              </div>
              <div className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </summary>
            <div className="p-4 pt-0 border-t border-border/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {grouped[key].map(c => (
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
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          {(c as any).event?.customName ? (
                            <>
                              <span className="font-black">{(c as any).event.customName}</span>
                              <span className="text-xs text-muted-foreground font-normal ml-1">· {c.clientName}</span>
                            </>
                          ) : (
                            c.clientName
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 text-muted-foreground" /> {formatDateMX(c.requestedDate, "d 'de' MMMM")}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 text-muted-foreground" /> {c.startTime} a {c.endTime} HRS
                        </div>
                        
                        {/* Semáforo de Staff */}
                        <div className="pt-2">
                          {c.event?.musicians && c.event.musicians.length > 0 ? (
                            <div className="flex items-center justify-between bg-muted/20 p-2 rounded-lg border border-border/20">
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Logística Staff</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className={cn(
                                  "h-1.5 w-1.5 rounded-full animate-pulse",
                                  c.event.musicians.every((m: any) => m.status === "confirmed") ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                                )} />
                                <span className={cn(
                                  "text-[10px] font-bold",
                                  c.event.musicians.every((m: any) => m.status === "confirmed") ? "text-green-500" : "text-yellow-500"
                                )}>
                                  {c.event.musicians.filter((m: any) => m.status === "confirmed").length}/{c.event.musicians.length}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted/10 p-2 rounded-lg border border-dashed border-border/40">
                              <AlertCircle className="w-3 h-3" /> Sin staff asignado
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/40 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-black text-foreground">
                            {(() => {
                              const base = c.baseAmount + (c.viaticosAmount || 0)
                              const ivaAmt = c.event?.invoice ? (c.event.ivaAmount || base * 0.16) : 0
                              return MXN(base + ivaAmt)
                            })()}
                          </div>
                          <ContractStatusSwitcher bookingId={c.id} status={c.contractStatus || "pending"} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            asChild
                            className="h-9 gap-2 border-green-600/30 text-green-400 hover:bg-green-600 hover:text-foreground" 
                          >
                            <a href={`/api/admin/contract/${c.id}`}>
                              <Download className="w-3 h-3" /> Contrato
                            </a>
                          </Button>

                          {!isCompleted && (
                            <MarkCompletedButton bookingId={c.id} />
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="h-9 gap-2 border-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-foreground"
                          >
                            <Link href={`/admin/ventas/${c.id}`}>
                              <FileText className="w-3 h-3" /> Info/Editar
                            </Link>
                          </Button>

                          <CancelBookingButton bookingId={c.id} shortId={c.shortId || "S/F"} hasEvent={true} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </details>
        )
      })}
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
