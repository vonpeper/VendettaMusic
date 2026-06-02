export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookingActions } from "@/components/admin/BookingActions"
import { ClientWhatsappActions } from "@/components/admin/ClientWhatsappActions"
import { VenueTypeSwitcher } from "@/components/admin/VenueTypeSwitcher"
import { AdminManagementTools } from "@/components/admin/AdminManagementTools"
import { BookingStatusSwitcher } from "@/components/admin/BookingStatusSwitcher"
import { LiquidarButton } from "@/components/admin/LiquidarButton"
import { ConfirmarAnticipoButton } from "@/components/admin/ConfirmarAnticipoButton"
import { ContractStatusSwitcher } from "@/components/admin/ContractStatusSwitcher"
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Package, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  ExternalLink,
  Download,
  Disc,
  Music2,
  Sparkles,
  Users,
  ChevronRight,
  LayoutList
} from "lucide-react"
import Link from "next/link"
import { formatDateMX, cn } from "@/lib/utils"
import { MusicianStatusList } from "@/components/admin/MusicianStatusList"
import { EditEventoButton } from "@/components/admin/EventActions"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { 
  style: "currency", 
  currency: "MXN", 
  maximumFractionDigits: 0 
}).format(v)

export default async function DetalleSolicitudPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Intentar buscar en BookingRequest (Web / Manual Moderno)
  let booking = await db.bookingRequest.findUnique({
    where: { id: id },
    include: { 
      client: { include: { user: true } },
      payments: { orderBy: { createdAt: "desc" } },
      event: { 
        include: { 
          contracts: true,
          musicians: { 
            include: { 
              musician: { 
                include: { user: true } 
              } 
            } 
          }
        } 
      } 
    }
  })

  // Si no se encuentra, intentar buscar en Quote (Legacy)
  if (!booking) {
    const quote = await db.quote.findUnique({
      where: { id: id },
      include: { client: { include: { user: true } } }
    })
    
    if (quote) {
      // Mapear Quote Legacy a estructura de Booking para la vista
      booking = {
        id: quote.id,
        shortId: (quote as any).shortId || quote.id.slice(0, 8).toUpperCase(),
        clientName: quote.client?.user?.name || "Cliente Legacy",
        clientEmail: (quote as any).clientEmail || quote.client?.user?.email || "",
        clientPhone: (quote as any).clientPhone || "",
        status: quote.status,
        packageName: (quote as any).packageId || "Paquete Personalizado",
        requestedDate: quote.eventDate,
        startTime: (quote as any).startTime || "00:00",
        endTime: (quote as any).endTime || "00:00",
        address: (quote as any).location || "Dirección no especificada",
        city: "",
        state: "",
        baseAmount: quote.totalEstimated,
        depositAmount: 0,
        paymentStatus: "pendiente",
        createdAt: quote.createdAt,
        source: "legacy",
      } as any
    }
  }

  const [config, musicianProfiles, clients, locations, packages] = await Promise.all([
    db.globalConfig.findUnique({ where: { id: "vendetta_config" } }),
    db.musicianProfile.findMany({
      where: { 
        whatsapp: { not: null }, 
        status: "active"
      },
      include: { user: true },
      orderBy: { instrument: 'asc' }
    }),
    db.clientProfile.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } }
    }),
    db.$queryRawUnsafe<any[]>(`SELECT * FROM Location ORDER BY name ASC`),
    db.package.findMany({ orderBy: { name: "asc" } }),
  ])

  // Aplanar para BookingActions (espera m.name, m.instrument)
  const musicians = musicianProfiles.map(m => ({
    id:         m.id,
    name:       m.user?.name || "Músico",
    instrument: m.instrument || null,
    whatsapp:   m.whatsapp,
    isTitular:  m.isTitular,
    status:     m.status,
  }))

  const clientsMapped = clients.map(c => ({ id: c.id, name: c.user.name ?? c.user.email ?? "Sin nombre" }))
  
  const staffMapped = musicianProfiles
    .filter(p => 
      p.instrument?.toLowerCase().includes("ingeniero") || 
      p.instrument?.toLowerCase().includes("staff")
    )
    .map(p => ({ id: p.id, name: p.user.name ?? "Sin nombre" }))

  const allMusiciansMapped = musicianProfiles.map(p => ({ 
    id: p.id, 
    name: p.user.name ?? "Sin nombre",
    instrument: p.instrument || "Músico",
    isTitular: p.isTitular
  }))

  if (!booking) notFound()

  const notifications = await db.notification.findMany({
    where: { bookingRequestId: id }
  })
  
  const missingFields: string[] = []
  if (!booking.address || booking.address === "Dirección no especificada" || booking.address.trim() === "") {
    missingFields.push("Dirección del evento")
  }
  if (!booking.startTime || booking.startTime === "00:00") {
    missingFields.push("Hora de inicio")
  }
  if (!booking.endTime || booking.endTime === "00:00") {
    missingFields.push("Hora de fin")
  }
  if (!booking.clientPhone || booking.clientPhone.trim() === "") {
    missingFields.push("Teléfono del cliente")
  }

  const finalClientName = booking.client?.user?.name || booking.clientName;

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb trail + accesos rápidos */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          {/* Breadcrumb izquierdo */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
            <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <Link href="/admin/ventas" className="hover:text-foreground transition-colors">Centro de Ventas</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <span className="text-foreground font-black">{booking.shortId}</span>
          </nav>

          <div className="flex items-center gap-3">
            {/* Acceso rápido a Editar Evento */}
            {booking.event && (
              <EditEventoButton 
                eventId={booking.event.id}
                initialData={booking.event}
                clients={clientsMapped}
                locations={locations}
                packages={packages}
                staff={staffMapped}
                allMusicians={allMusiciansMapped}
                showText={true}
                variant="outline"
                label="Ver/Editar Show"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-600/30 text-blue-600 text-xs font-black uppercase tracking-wider hover:bg-blue-600/20 transition-all cursor-pointer bg-blue-600/10"
              />
            )}

            {/* Acceso rápido a Eventos */}
            <Link
              href="/admin/eventualidades"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-600 text-xs font-black uppercase tracking-wider hover:bg-blue-600/20 transition-all"
            >
              <LayoutList className="w-3.5 h-3.5" />
              Ver Eventos
            </Link>
          </div>
        </div>

        {/* Header con ID y Estado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-black text-foreground tracking-tight">Solicitud {booking.shortId}</h1>
              <BookingStatusSwitcher bookingId={booking.id} currentStatus={booking.status} missingFields={missingFields} />
            </div>
            <p className="text-muted-foreground mt-1">Registrado el {formatDateMX(booking.createdAt, "PPPP")}</p>
          </div>
          
          {(booking.status === "agendado" || booking.status === "confirmed" || booking.status === "pendiente") && (
            <div className="flex flex-wrap gap-3">
              <ContractStatusSwitcher 
                bookingId={booking.id} 
                status={booking.event?.contracts?.[0]?.status || "pending"} 
              />
              <Button 
                variant="outline"
                asChild
                className={`${booking.status === "pendiente" ? "border-primary/50 text-primary hover:bg-primary" : "border-green-600/50 text-green-400 hover:bg-green-600"} gap-2 h-11 px-6 font-bold rounded-xl  hover:text-white transition-all`} 
              >
                <a href={`/api/admin/contract/${booking.id}`}>
                  <Download className="w-5 h-5" /> {booking.status === "pendiente" ? "Cotización PDF" : "Contrato PDF"}
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Información Detallada */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Detalles del Evento */}
            <Card className="bg-card border-border/20 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" /> Detalles del Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Paquete Solicitado</div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-black text-foreground">{booking.packageName}</div>
                      <VenueTypeSwitcher bookingId={booking.id} currentType={booking.venueType || ''} />
                    </div>
                    <div className="text-sm text-blue-600 font-bold mt-1 tracking-tight">{booking.guestCount} invitados aproximados</div>
                  </div>
                  <div className="pt-4 border-t border-border/40">
                    <CardTitle className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] flex flex-wrap gap-2 items-center justify-between">
                    <span>Fecha y Horario</span>
                    {booking.source === 'MANUAL' && (
                      <span className="bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded text-[9px] border border-orange-500/20">RESERVA MANUAL</span>
                    )}
                  </CardTitle>
                    <div className="text-base text-foreground flex items-center gap-2 font-black mt-2">
                      <Calendar className="w-4 h-4 text-blue-600" /> {formatDateMX(booking.requestedDate, "EEEE, d 'de' MMMM")}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono mt-1 font-bold">
                      {booking.startTime} hrs — {booking.endTime} hrs
                    </div>
                    {booking.eventId && (
                      <div className="text-[10px] text-muted-foreground font-mono mt-2 flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded w-fit select-all truncate max-w-full" title={booking.eventId}>
                        <span className="font-bold opacity-60">ID EVENTO:</span> {booking.eventId}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Ubicación</div>
                    <div className="text-base text-foreground flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                      <div>
                        <div className="font-black">{booking.city}, {booking.state}</div>
                        <div className="text-sm text-muted-foreground mt-1 leading-relaxed font-medium">{booking.address}</div>
                        {booking.mapsLink && (
                          <div className="mt-2">
                             <a 
                               href={booking.mapsLink} 
                               target="_blank" 
                               className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-black uppercase tracking-wider"
                             >
                               <ExternalLink className="w-3 h-3" /> Ver en Google Maps
                             </a>
                          </div>
                        )}
                      </div>
                    </div>
                    {booking.isOutsideZone && (
                      <Badge variant="outline" className="mt-3 border-yellow-500/30 text-yellow-500 bg-yellow-500/10 font-black">
                        🚗 Viáticos aplicados: {MXN(booking.viaticosAmount)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Servicios Personalizados */}
            {(booking.bandHours! > 0 || booking.djHours! > 0 || booking.packageName.toLowerCase().includes("arma") || booking.packageName.toLowerCase().includes("personal")) && (
              <Card className="bg-card border-border/20 backdrop-blur-sm overflow-hidden border-l-4 border-l-blue-600">
                <CardHeader className="bg-blue-600/10 border-b border-border/40">
                  <CardTitle className="text-lg flex items-center gap-2 font-black">
                    <Sparkles className="w-5 h-5 text-blue-600" /> Configuración de Show
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Música en Vivo</div>
                      <div className="text-sm font-black flex items-center gap-2 text-foreground">
                        <Music2 className="w-3.5 h-3.5 text-blue-600" /> {booking.bandHours} Horas
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Servicio de DJ</div>
                      <div className="text-sm font-black flex items-center gap-2 text-foreground">
                        <Disc className="w-3.5 h-3.5 text-blue-600" /> {booking.djHours! > 0 ? `${booking.djHours} Horas ${booking.isDjWithTvs ? '(Con Pantallas)' : '(Solo Audio)'}` : 'No solicitado'}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Extras y Montaje</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {booking.hasTemplete && <Badge variant="outline" className="text-[9px] font-black border-blue-600/20 bg-blue-600/10 text-blue-600">TEMPLETE</Badge>}
                        {booking.hasPista && <Badge variant="outline" className="text-[9px] font-black border-blue-600/20 bg-blue-600/10 text-blue-600">PISTA LED</Badge>}
                        {booking.hasRobot && <Badge variant="outline" className="text-[9px] font-black border-blue-600/20 bg-blue-600/10 text-blue-600">ROBOT LED</Badge>}
                        {!booking.hasTemplete && !booking.hasPista && !booking.hasRobot && <span className="text-xs text-muted-foreground italic font-medium">Sin extras</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Desglose Financiero */}
            {(() => {
              const total = Number((booking as any).baseAmount) + Number((booking as any).viaticosAmount || 0) + Number((booking as any).ivaAmount || 0) - Number((booking as any).discountAmount || 0);
              const deposit = Number((booking as any).depositAmount || 0);
              const paid = ((booking as any).payments || []).filter((p: any) => p.status === 'completed' || p.status === 'paid').reduce((sum: number, p: any) => sum + Number(p.amount), 0);
              const balance = total - paid;
              
              let badgeLabel = "PAGO PENDIENTE";
              let badgeColor = "text-yellow-600";
              if (paid === 0 && deposit === 0) { badgeLabel = "SIN ANTICIPO"; badgeColor = "text-gray-400"; }
              else if (paid >= total) { badgeLabel = "LIQUIDADO"; badgeColor = "text-emerald-600"; }
              else if (paid >= deposit) { badgeLabel = "ANTICIPO PAGADO"; badgeColor = "text-blue-600"; }
              else if (paid > 0) { badgeLabel = "PAGO PARCIAL"; badgeColor = "text-orange-500"; }

              return (
                <Card className="bg-card border-border/20 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/40 p-4 md:p-6">
                    <CardTitle className="text-lg flex items-center gap-2 font-black">
                      <CreditCard className="w-5 h-5 text-blue-600" /> Información Financiera
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-600/10 border border-blue-600/20">
                        <div className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 truncate">Total</div>
                        <div className="text-base md:text-xl font-black text-foreground">{MXN(total)}</div>
                      </div>
                      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-600/15 border border-blue-600/30">
                        <div className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 truncate">Anticipo</div>
                        <div className="text-base md:text-xl font-black text-blue-600">{MXN(deposit)}</div>
                      </div>
                      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 truncate">Pagado</div>
                        <div className="text-base md:text-xl font-black text-emerald-600">{MXN(paid)}</div>
                      </div>
                      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-muted border border-border/50">
                        <div className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 truncate">Pendiente</div>
                        <div className="text-base md:text-xl font-black text-foreground">{MXN(balance)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estado Actual:</div>
                        <div className={`text-sm font-black uppercase ${badgeColor}`}>{badgeLabel}</div>
                      </div>
                    </div>

                    {booking.paymentRef && (
                      <div className="mt-4 text-[10px] font-mono text-muted-foreground flex flex-wrap items-center gap-2 font-bold uppercase tracking-widest bg-muted/30 p-2 rounded">
                        <span>Ref:</span> <span className="text-foreground break-all">{booking.paymentRef}</span>
                      </div>
                    )}
                    
                    {balance > 0 && (
                      <div className="flex flex-col sm:flex-row gap-2 mt-6">
                        {paid < deposit && <div className="flex-1"><ConfirmarAnticipoButton bookingId={booking.id} /></div>}
                        <div className="flex-1"><LiquidarButton bookingId={booking.id} /></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })()}
          </div>

          {/* Columna Derecha: Cliente y Acciones Administrativas */}
          <div className="space-y-8">
            {/* Tarjeta del Cliente */}
            <Card className="bg-card border-blue-600/20 shadow-xl shadow-blue-600/5">
              <CardHeader>
                <CardTitle className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">Datos del Solicitante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-5 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-600/15 border border-blue-600/30 flex items-center justify-center shadow-inner shrink-0">
                    <User className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg md:text-xl font-black text-foreground tracking-tighter truncate" title={finalClientName}>{finalClientName}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground font-bold truncate">Origen: <span className="text-blue-600 font-black uppercase tracking-widest">{booking.source || 'WEB'}</span></div>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-border/40">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-blue-600 transition-colors group font-bold">
                    <Phone className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                    <a href={`tel:${booking.clientPhone}`}>{booking.clientPhone}</a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-blue-600 transition-colors group font-bold">
                    <Mail className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                    <a href={`mailto:${booking.clientEmail}`}>{booking.clientEmail}</a>
                  </div>
                </div>
                <div className="pt-2">
                  <ClientWhatsappActions 
                    bookingId={booking.id} 
                    clientPhone={booking.clientPhone} 
                    notifications={(booking as any).notifications || []}
                    bookingStatus={booking.status}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Gestión de Staff (Siempre visible si está agendado o pendiente) */}
            {(booking.status === "pendiente" || booking.status === "agendado") && (
              <Card className={cn(
                "bg-card shadow-2xl",
                booking.status === "pendiente" ? "border-yellow-500/20 shadow-yellow-500/10" : "border-blue-600/20 shadow-blue-600/5"
              )}>
                <CardHeader>
                  <CardTitle className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    booking.status === "pendiente" ? "text-yellow-500" : "text-blue-600"
                  )}>
                    {booking.status === "pendiente" ? "Acciones Administrativas" : "Gestión de Staff y Logística"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingActions 
                    bookingId={booking.id} 
                    clientName={finalClientName} 
                    musicians={musicians}
                    isAlreadyScheduled={!!booking.eventId}
                    currentMusicianIds={booking.event?.musicians?.map((m: any) => m.musicianId) || []}
                    eventMusicians={booking.event?.musicians || []}
                    notifications={(booking as any).notifications || []}
                  />
                </CardContent>
              </Card>
            )}

            {booking.status === "agendado" && !booking.eventId && (
              <Card className="bg-orange-500/5 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-xs font-black text-orange-500 uppercase tracking-widest">Sincronización Pendiente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground font-medium">Esta reserva está confirmada pero aún no se ha generado el evento oficial en la agenda.</p>
                  <BookingActions bookingId={booking.id} clientName={finalClientName} forceSync={true} />
                </CardContent>
              </Card>
            )}
            
            {booking.status === "EXPIRED" && (
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 text-red-500">
                    <TrendingDown className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-sm font-black uppercase tracking-tight">Solicitud Expirada</div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">Esta oportunidad superó los 15 días sin concretarse.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {booking.adminNote && (
              <div className="p-5 bg-blue-600/10 border border-blue-600/20 rounded-2xl shadow-sm">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-600/50" /> Bitácora Administrativa
                </div>
                <p className="text-sm text-foreground/80 italic font-medium leading-relaxed">"{booking.adminNote}"</p>
              </div>
            )}

            {/* Confirmaciones de Staff */}
            {booking.event && booking.event.musicians && booking.event.musicians.length > 0 && (
              <Card className="bg-card border-border/20 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40">
                  <CardTitle className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" /> Estatus del Staff
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
              {booking.event?.id && booking.event.musicians && booking.event.musicians.length > 0 && (
              <MusicianStatusList musicians={booking.event.musicians} eventId={booking.event?.id || booking.eventId || ""} bookingId={booking.id} />
            )}
                </CardContent>
              </Card>
            )}

            {/* Gestión del Registro (Editar/Eliminar) */}
            <Card className="bg-card border-border/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Gestión de Registro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AdminManagementTools booking={booking} config={config} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    pendiente: { color: "text-yellow-400 border-yellow-700/40 bg-yellow-900/20", label: "PENDIENTE" },
    agendado:  { color: "text-green-400 border-green-700/40 bg-green-900/20", label: "AGENDADO" },
    cancelado: { color: "text-red-400 border-red-700/40 bg-red-900/20", label: "CANCELADO" },
    EXPIRED:   { color: "text-muted-foreground border-gray-700 bg-gray-800/50", label: "EXPIRADO" },
  }
  const cfg = configs[status] || configs.pendiente
  return (
    <Badge className={`${cfg.color} border px-3 py-1 text-xs font-black tracking-widest`}>
      {cfg.label}
    </Badge>
  )
}

function CheckCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  )
}

function TrendingDown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
  )
}
