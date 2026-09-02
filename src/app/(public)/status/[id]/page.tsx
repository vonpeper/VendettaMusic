import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { CheckCircle2, Clock, XCircle, MapPin, Calendar, Package, Receipt, ArrowLeft, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RockBackground } from "@/components/funnel/RockBackground"
import { ContractSigner } from "@/components/funnel/ContractSigner"
import { QuoteApprovalForm } from "@/components/funnel/QuoteApprovalForm"
import { formatDateMX } from "@/lib/utils"
import { isValidShortIdFormat } from "@/lib/folios"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = await params
  const lookupId = (id || "").trim().toUpperCase()

  if (!isValidShortIdFormat(lookupId)) {
    return { title: "No encontrado | Vendetta Live Music" }
  }

  const isUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(lookupId)
  const booking = await db.bookingRequest.findFirst({
    where: isUuid
      ? { OR: [{ shortId: lookupId }, { id: id.trim() }] }
      : { shortId: lookupId }
  })

  if (!booking) {
    return {
      title: "No encontrado | Vendetta Live Music"
    }
  }

  const isConfirmed = booking.status === "agendado" || booking.status === "completado"
  const dateStr = booking.requestedDate ? formatDateMX(booking.requestedDate, "d 'de' MMMM") : ""
  
  const title = isConfirmed 
    ? `✍️ Firma de Contrato & Estatus (${booking.shortId}) | Vendetta Live Music`
    : `🎸 Cotización & Propuesta Exclusiva (${booking.shortId}) | Vendetta Live Music`
    
  const ogTitle = isConfirmed
    ? `✍️ Contrato Digital & Confirmación de Show (${booking.shortId})`
    : `🎸 Cotización de Show: ${booking.clientName} (${booking.shortId})`

  const description = isConfirmed
    ? `¡Fecha confirmada para ${booking.clientName} el ${dateStr}! Entra para consultar la ficha técnica y firmar digitalmente tu contrato de prestación de servicios.`
    : `Hola ${booking.clientName}, te compartimos la cotización exclusiva para tu evento el ${dateStr}. Revisa tu propuesta y aprueba tu fecha en línea.`

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: `https://vendetta.mx/status/${booking.shortId}`,
      siteName: 'Vendetta Live Music',
      images: [
        {
          url: 'https://vendetta.mx/images/opengraph-evento.png',
          width: 1200,
          height: 630,
          alt: 'Vendetta Live Music',
        },
      ],
      locale: 'es_MX',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: ['https://vendetta.mx/images/opengraph-evento.png'],
    },
  }
}

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

export default async function StatusDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const lookupId = (id || "").trim().toUpperCase()

  if (!isValidShortIdFormat(lookupId)) {
    return notFound()
  }

  const isUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(lookupId)
  const mainBooking = await db.bookingRequest.findFirst({
    where: isUuid
      ? { OR: [{ shortId: lookupId }, { id: id.trim() }] }
      : { shortId: lookupId },
    include: { 
      client: true,
      lineItems: { orderBy: { order: "asc" } },
      event: {
        include: {
          contracts: true
        }
      }
    }
  })

  if (!mainBooking) {
    return notFound()
  }

  const globalConfig = await db.globalConfig.findUnique({
    where: { id: "vendetta_config" }
  })

  const statusMap: Record<string, { label: string, color: string, icon: React.ComponentType<{ className?: string }> }> = {
    pendiente: { label: "Pendiente de Revisión", color: "text-yellow-500", icon: Clock },
    agendado:  { label: "Evento Confirmado",    color: "text-green-500",  icon: CheckCircle2 },
    cancelado: { label: "Solicitud Cancelada",  color: "text-red-500",    icon: XCircle },
    completado: { label: "Evento Finalizado",   color: "text-blue-500",   icon: CheckCircle2 },
  }

  const currentStatus = statusMap[mainBooking.status] || statusMap.pendiente

  const hasInvoice = mainBooking.invoice || mainBooking.event?.invoice || false;
  const base = Number(mainBooking.baseAmount || 0);
  const viaticos = Number(mainBooking.viaticosAmount || 0);
  const subtotal = base + viaticos;
  const ivaAmount = hasInvoice 
    ? (mainBooking.event?.ivaAmount || Math.round(subtotal * 0.16 * 100) / 100)
    : 0;
  const totalAmount = subtotal + ivaAmount;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-20">
      <RockBackground />
      
      <div className="container mx-auto px-4 relative z-10 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Detalle de la Solicitud Actual */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/status" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-2 text-xs font-bold uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Volver a buscar
            </Link>

            <div className="bg-card/60 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-border/40 bg-gradient-to-br from-foreground/[0.03] to-transparent flex flex-col items-center text-center">
                <div className={`p-3 rounded-full bg-foreground/[0.03] mb-4 border border-border/40`}>
                  <currentStatus.icon className={`w-10 h-10 ${currentStatus.color}`} />
                </div>
                <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-1">
                  Estatus de tu <span className="text-primary italic">Reserva</span>
                </h1>
                <div className="text-muted-foreground text-xs font-medium mb-4 tracking-widest uppercase">ID: {mainBooking.shortId}</div>
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
                    {(() => {
                      const cleanParts = (parts: (string | null | undefined)[]) => parts.filter((p): p is string => Boolean(p && p !== "null" && p !== "undefined" && String(p).trim() !== ""))
                      const addressLine1 = cleanParts([mainBooking.calle, mainBooking.numero]).join(" ").trim()
                      const addressLine2 = cleanParts([mainBooking.colonia, mainBooking.municipio, mainBooking.state]).join(", ").trim()
                      
                      const mainLocation = addressLine1 || (mainBooking.address && mainBooking.address !== "null" ? mainBooking.address : "Dirección pendiente")
                      const subLocation = addressLine2 || (mainBooking.city && mainBooking.city !== "null" ? mainBooking.city : "")

                      return (
                        <DetailItem 
                          icon={MapPin} 
                          label="Ubicación" 
                          value={mainLocation} 
                          subValue={subLocation}
                        />
                      )
                    })()}
                  </div>

                  <div className="bg-foreground/[0.02] border border-border/40 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Resumen Económico</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Inversión Show</span>
                      <span className="text-foreground font-bold">{MXN(base)}</span>
                    </div>
                    {viaticos > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Viáticos y Traslado</span>
                        <span className="text-foreground font-bold">{MXN(viaticos)}</span>
                      </div>
                    )}
                    {hasInvoice && ivaAmount > 0 && (
                      <div className="flex justify-between text-sm text-amber-600 dark:text-amber-500">
                        <span>IVA (16%)</span>
                        <span>{MXN(ivaAmount)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-border/20 flex justify-between text-sm">
                      <span className="text-muted-foreground font-bold">Inversión Total</span>
                      <span className="text-foreground font-black">{MXN(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Anticipo Pago</span>
                      <span className="text-primary font-black">{MXN(mainBooking.depositAmount)}</span>
                    </div>
                    <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Estatus Pago</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        mainBooking.paymentStatus === 'paid' 
                          ? 'text-green-500' 
                          : mainBooking.paymentStatus === 'review' || mainBooking.paymentStatus === 'revisar'
                            ? 'text-blue-500 animate-pulse'
                            : 'text-yellow-500'
                      }`}>
                        {mainBooking.paymentStatus === 'paid' 
                          ? '✅ Pagado' 
                          : mainBooking.paymentStatus === 'review' || mainBooking.paymentStatus === 'revisar'
                            ? '⏳ En Revisión' 
                            : '⏳ Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE CONTRATO LEGAL (CONFIRMADOS) */}
            {mainBooking.status === "agendado" && (
              <ContractSigner 
                bookingId={mainBooking.id}
                clientName={mainBooking.clientName}
                shortId={mainBooking.shortId || ""}
                isSigned={!!mainBooking.clientSignature || (mainBooking.event?.contracts?.some((c: { status: string }) => c.status === "signed") ?? false)}
                signedAt={mainBooking.signedAt || (mainBooking.event?.contracts?.find((c: { status: string, signedAt?: Date | null }) => c.status === "signed")?.signedAt)}
                clientSignature={mainBooking.clientSignature}
                adminSignature={mainBooking.adminSignature}
                contractLegalText={
                  (mainBooking.event?.venueType?.toLowerCase() === "bar" || mainBooking.venueType?.toLowerCase() === "bar") 
                    ? (globalConfig?.contractBarLegalText || undefined)
                    : (globalConfig?.contractLegalText || undefined)
                }
                eventDate={mainBooking.requestedDate}
                eventTime={mainBooking.startTime}
                eventEndTime={mainBooking.endTime}
                eventAmount={totalAmount}
                packageName={mainBooking.packageName}
                eventAddress={mainBooking.address}
              />
            )}

            {/* SECCIÓN DE APROBACIÓN DE COTIZACIÓN (PENDIENTES Y NO PAGADAS) */}
            {mainBooking.status === "pendiente" && mainBooking.paymentStatus !== "paid" && (
              <QuoteApprovalForm
                bookingId={mainBooking.id}
                depositAmount={mainBooking.depositAmount}
                totalAmount={totalAmount}
                paymentStatus={mainBooking.paymentStatus}
                paymentRef={mainBooking.paymentRef}
                bankName={globalConfig?.bankName || null}
                bankAccount={globalConfig?.bankAccount || null}
                bankClabe={globalConfig?.bankClabe || null}
                bankBeneficiary={globalConfig?.bankBeneficiary || null}
              />
            )}
          </div>

          {/* Columna Derecha: Información de la Reserva y Soporte */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-2 pt-4">
              <ShieldCheck className="w-4 h-4 text-primary" /> Información de Reserva
            </h3>
            
            <div className="space-y-4 p-6 rounded-3xl bg-foreground/[0.02] border border-border/40">
               <div>
                 <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Titular del Evento</div>
                 <div className="text-foreground font-black uppercase tracking-tight text-lg">{mainBooking.clientName}</div>
               </div>
               <div className="pt-3 border-t border-border/40 text-xs text-muted-foreground">
                 <span className="font-semibold text-white">Folio Único:</span> {mainBooking.shortId}
               </div>
            </div>

            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 space-y-4">
               <div className="text-sm font-black text-foreground uppercase tracking-tight">¿Alguna duda o ajuste?</div>
               <p className="text-[11px] text-muted-foreground leading-relaxed">Contáctanos por correo o WhatsApp oficial para cualquier consulta sobre tu reservación o contrato.</p>
               <a href={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, tengo una duda sobre mi folio ${mainBooking.shortId}`)}` : `mailto:rock.vendettamx@gmail.com?subject=${encodeURIComponent(`Duda sobre evento folio ${mainBooking.shortId}`)}`} className="block">
                 <Button className="w-full h-11 text-[10px] font-black uppercase tracking-widest rounded-xl">{process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? "WhatsApp Directo" : "Contactar por Correo"}</Button>
               </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function DetailItem({ icon: Icon, label, value, subValue }: { icon: React.ComponentType<{ className?: string }>, label: string, value: string, subValue?: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border/40 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
        <div className="text-foreground font-bold">{value}</div>
        {subValue && <div className="text-xs text-muted-foreground font-medium">{subValue}</div>}
      </div>
    </div>
  )
}
