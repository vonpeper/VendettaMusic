import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { CheckCircle2, Clock, XCircle, MapPin, Calendar, Package, Receipt, ArrowLeft, History } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RockBackground } from "@/components/funnel/RockBackground"
import { formatDateMX } from "@/lib/utils"

export const dynamic = 'force-dynamic'

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

export default async function StatusDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const mainBooking = await db.bookingRequest.findUnique({
    where: { shortId: id.toUpperCase() },
    include: { client: true }
  })

  if (!mainBooking) {
    return notFound()
  }

  // Si tenemos clientId, buscamos todo el historial
  let otherBookings: any[] = []
  let confirmedEvents: any[] = []

  if (mainBooking.clientId) {
    otherBookings = await db.bookingRequest.findMany({
      where: { 
        clientId: mainBooking.clientId,
        id: { not: mainBooking.id } 
      },
      orderBy: { requestedDate: 'desc' }
    })

    confirmedEvents = await db.event.findMany({
      where: { clientId: mainBooking.clientId },
      orderBy: { date: 'desc' }
    })
  }

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    pendiente: { label: "Pendiente de Revisión", color: "text-yellow-500", icon: Clock },
    agendado:  { label: "Evento Confirmado",    color: "text-green-500",  icon: CheckCircle2 },
    cancelado: { label: "Solicitud Cancelada",  color: "text-red-500",    icon: XCircle },
    completado: { label: "Evento Finalizado",   color: "text-blue-500",   icon: CheckCircle2 },
  }

  const currentStatus = statusMap[mainBooking.status] || statusMap.pendiente

  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-20">
      <RockBackground />
      
      <div className="container mx-auto px-4 relative z-10 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Detalle de la Solicitud Actual */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/status" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-2 text-xs font-bold uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Volver a buscar
            </Link>

            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent flex flex-col items-center text-center">
                <div className={`p-3 rounded-full bg-white/[0.03] mb-4 border border-white/5`}>
                  <currentStatus.icon className={`w-10 h-10 ${currentStatus.color}`} />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">
                  Estatus de tu <span className="text-primary italic">Reserva</span>
                </h1>
                <div className="text-gray-500 text-xs font-medium mb-4 tracking-widest uppercase">ID: {mainBooking.shortId}</div>
                <div className={`px-4 py-1.5 rounded-full border ${currentStatus.color.replace('text-', 'border-').replace('500', '500/30')} ${currentStatus.color.replace('text-', 'bg-').replace('500', '500/10')} font-black uppercase text-[10px] tracking-[0.3em]`}>
                  {currentStatus.label}
                </div>
              </div>

              <div className="p-8 grid gap-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <DetailItem icon={Package} label="Paquete" value={mainBooking.packageName} />
                    <DetailItem 
                      icon={Calendar} 
                      label="Fecha y Hora" 
                      value={formatDateMX(mainBooking.requestedDate, "PPPP")} 
                      subValue={`${mainBooking.startTime} - ${mainBooking.endTime} hrs`}
                    />
                    <DetailItem 
                      icon={MapPin} 
                      label="Ubicación" 
                      value={`${mainBooking.calle} ${mainBooking.numero}`} 
                      subValue={`${mainBooking.colonia}, ${mainBooking.municipio}, ${mainBooking.state}`}
                    />
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Resumen Económico</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Inversión Total</span>
                      <span className="text-white font-bold">{MXN(mainBooking.baseAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Anticipo Pago</span>
                      <span className="text-primary font-black">{MXN(mainBooking.depositAmount)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase">Estatus Pago</span>
                      <span className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">
                        {mainBooking.paymentStatus === 'paid' ? '✅ Pagado' : '⏳ Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>

                {mainBooking.adminNote && (
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Nota del Administrador</div>
                    <p className="text-sm text-gray-300 italic leading-relaxed">"{mainBooking.adminNote}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Mi Historial / Otros Eventos */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2 pt-4">
              <History className="w-4 h-4 text-primary" /> Historial de Cliente
            </h3>
            
            <div className="space-y-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
               <div className="pb-4 border-b border-white/5">
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Cliente Registrado</div>
                 <div className="text-white font-black uppercase tracking-tight text-lg">{mainBooking.clientName}</div>
               </div>

               {/* Eventos Confirmados */}
               {confirmedEvents.length > 0 && (
                 <div className="space-y-3">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest">🎉 Mis Próximos Eventos</div>
                    {confirmedEvents.map(evt => (
                      <div key={evt.id} className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 group hover:bg-green-500/20 transition-all">
                        <div className="text-white font-bold text-xs uppercase">{formatDateMX(evt.date, "dd MMM yyyy")}</div>
                        <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{evt.venueType ?? "Evento"} — Confirmado</div>
                      </div>
                    ))}
                 </div>
               )}

               {/* Otras Solicitudes */}
               {otherBookings.length > 0 && (
                 <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">📋 Otras Solicitudes</div>
                    {otherBookings.map(b => (
                      <Link href={`/status/${b.shortId}`} key={b.id} className="block p-3 rounded-xl bg-white/5 border border-white/10 group hover:border-primary/50 transition-all">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-bold text-xs uppercase">{formatDateMX(b.requestedDate, "dd MMM")}</span>
                          <span className="text-[9px] text-primary font-black uppercase">{b.shortId}</span>
                        </div>
                        <div className="text-[9px] text-gray-500 mt-1 uppercase font-bold">{b.packageName} — {b.status}</div>
                      </Link>
                    ))}
                 </div>
               )}

               {otherBookings.length === 0 && confirmedEvents.length === 0 && (
                 <p className="text-[10px] text-gray-500 italic pb-4">No tienes otros eventos registrados con este usuario.</p>
               )}
            </div>

            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 space-y-4">
               <div className="text-sm font-black text-white uppercase tracking-tight">¿Alguna duda?</div>
               <p className="text-[11px] text-gray-400 leading-relaxed">Contáctanos vía WhatsApp para cualquier ajuste o duda sobre tu contrato.</p>
               <a href={`https://wa.me/5215500000000?text=Hola, soy ${mainBooking.clientName}, tengo una duda sobre mi folio ${mainBooking.shortId}`} className="block">
                 <Button className="w-full h-11 text-[10px] font-black uppercase tracking-widest rounded-xl">WhatsApp Directo</Button>
               </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function DetailItem({ icon: Icon, label, value, subValue }: { icon: any, label: string, value: string, subValue?: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div>
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-white font-bold">{value}</div>
        {subValue && <div className="text-xs text-gray-500 font-medium">{subValue}</div>}
      </div>
    </div>
  )
}
