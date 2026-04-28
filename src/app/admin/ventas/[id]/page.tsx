import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookingActions } from "@/components/admin/BookingActions"
import { AdminManagementTools } from "@/components/admin/AdminManagementTools"
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
  Download
} from "lucide-react"
import Link from "next/link"
import { formatDateMX } from "@/lib/utils"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { 
  style: "currency", 
  currency: "MXN", 
  maximumFractionDigits: 0 
}).format(v)

export default async function DetalleSolicitudPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await db.bookingRequest.findUnique({
    where: { id: id }
  })

  if (!booking) notFound()

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs / Back Link */}
        <Link href="/admin/ventas" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver al Centro de Ventas
        </Link>

        {/* Header con ID y Estado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-black text-foreground tracking-tight">Solicitud {booking.shortId}</h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-muted-foreground mt-1">Registrado el {formatDateMX(booking.createdAt, "PPPP")}</p>
          </div>
          
          {(booking.status === "agendado" || booking.status === "confirmed" || booking.status === "pendiente") && (
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className={`${booking.status === "pendiente" ? "border-blue-600/50 text-blue-400 hover:bg-blue-600" : "border-green-600/50 text-green-400 hover:bg-green-600"} gap-2 h-11 px-6 font-bold rounded-xl whitespace-nowrap hover:text-white transition-all`} 
                render={
                  <a href={`/api/admin/contract/${booking.id}`}>
                    <Download className="w-5 h-5" /> {booking.status === "pendiente" ? "Cotización PDF" : "Contrato PDF"}
                  </a>
                } 
              />
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
                  <Package className="w-5 h-5 text-primary" /> Detalles del Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Paquete Solicitado</div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-black text-foreground">{booking.packageName}</div>
                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 uppercase text-[9px] font-black tracking-tighter">
                        {booking.venueType || 'Salón'}
                      </Badge>
                    </div>
                    <div className="text-sm text-primary font-medium mt-1">{booking.guestCount} invitados aproximados</div>
                  </div>
                  <div className="pt-4 border-t border-border/40">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Fecha y Horario</div>
                    <div className="text-base text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> {formatDateMX(booking.requestedDate, "EEEE, d 'de' MMMM")}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono mt-1">
                      {booking.startTime} hrs — {booking.endTime} hrs
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Ubicación</div>
                    <div className="text-base text-foreground flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-1" />
                      <div>
                        <div className="font-bold">{booking.city}, {booking.state}</div>
                        <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{booking.address}</div>
                        {booking.mapsLink && (
                          <div className="mt-2">
                             <a 
                               href={booking.mapsLink} 
                               target="_blank" 
                               className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold"
                             >
                               <ExternalLink className="w-3 h-3" /> Ver en Google Maps
                             </a>
                          </div>
                        )}
                      </div>
                    </div>
                    {booking.isOutsideZone && (
                      <Badge variant="outline" className="mt-3 border-yellow-500/30 text-yellow-400 bg-yellow-900/10">
                        🚗 Viáticos aplicados: {MXN(booking.viaticosAmount)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desglose Financiero */}
            <Card className="bg-card border-border/20 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Información Financiera
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-2xl bg-primary/10 border border-border/40">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Subtotal Servicio</div>
                    <div className="text-xl font-black text-foreground">{MXN(booking.baseAmount)}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/10 border border-border/40">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Anticipo Pactado</div>
                    <div className="text-xl font-black text-primary">{MXN(booking.depositAmount)}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-green-900/10 border border-green-500/20">
                    <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Estado de Pago</div>
                    <div className="text-xl font-black text-green-300 capitalize">{booking.paymentStatus}</div>
                  </div>
                </div>
                {booking.paymentRef && (
                  <div className="mt-4 text-[10px] font-mono text-muted-foreground flex items-center gap-2 px-2">
                    Referencia de pago: {booking.paymentRef}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Cliente y Acciones Administrativas */}
          <div className="space-y-8">
            {/* Tarjeta del Cliente */}
            <Card className="bg-card border-primary/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-primary uppercase tracking-widest">Datos del Solicitante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <User className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-foreground">{booking.clientName}</div>
                    <div className="text-xs text-muted-foreground">Origen: <span className="text-primary font-bold uppercase">{booking.source || 'WEB'}</span></div>
                  </div>
                </div>
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
                    <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <a href={`tel:${booking.clientPhone}`}>{booking.clientPhone}</a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
                    <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <a href={`mailto:${booking.clientEmail}`}>{booking.clientEmail}</a>
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full border-primary/30 text-primary hover:bg-primary hover:text-foreground transition-all rounded-xl h-11 gap-2 font-bold group" 
                    render={
                      <a href={`https://wa.me/${booking.clientPhone.replace(/\D/g,'')}`} target="_blank">
                        Contactar por WhatsApp <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                      </a>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Acciones de Control */}
            {booking.status === "pendiente" && (
              <Card className="bg-card border-yellow-500/20 shadow-2xl shadow-yellow-500/5">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-yellow-400 uppercase tracking-widest">Acciones Administrativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingActions bookingId={booking.id} clientName={booking.clientName} />
                </CardContent>
              </Card>
            )}

            {booking.status === "agendado" && !booking.eventId && (
              <Card className="bg-orange-900/5 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-orange-400 uppercase tracking-widest">Sincronización Pendiente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">Esta reserva está confirmada pero aún no se ha generado el evento oficial en la agenda.</p>
                  <BookingActions bookingId={booking.id} clientName={booking.clientName} forceSync={true} />
                </CardContent>
              </Card>
            )}

            {booking.status === "agendado" && booking.eventId && (
              <Card className="bg-green-900/5 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-green-400">Solicitud Confirmada</div>
                      <p className="text-xs text-muted-foreground mt-1">Este registro ya se encuentra en la agenda oficial como un evento asegurado.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {booking.status === "EXPIRED" && (
              <Card className="bg-red-900/5 border-red-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 text-red-400">
                    <TrendingDown className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-sm font-bold">Solicitud Expirada</div>
                      <p className="text-xs text-muted-foreground mt-1">Esta oportunidad superó los 15 días sin concretarse.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {booking.adminNote && (
              <div className="p-4 bg-primary/10 border border-border/40 rounded-2xl">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-primary" /> Bitácora Administrativa
                </div>
                <p className="text-sm text-muted-foreground italic">"{booking.adminNote}"</p>
              </div>
            )}

            {/* Gestión del Registro (Editar/Eliminar) */}
            <Card className="bg-card border-border/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Gestión de Registro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AdminManagementTools booking={booking} />
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
