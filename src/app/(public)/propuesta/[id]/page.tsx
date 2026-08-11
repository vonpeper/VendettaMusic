import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { MapPin, Calendar, Clock, Package, ShieldCheck, Mail, Phone, Users, History } from "lucide-react"
import { RockBackground } from "@/components/funnel/RockBackground"
import { ProposalInteractive } from "@/components/funnel/ProposalInteractive"
import { ContractSigner } from "@/components/funnel/ContractSigner"
import { formatDateMX } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await db.bookingRequest.findFirst({
    where: {
      OR: [
        { shortId: id.toUpperCase() },
        { id: id }
      ]
    }
  })

  if (!booking) {
    return {
      title: "Propuesta comercial | Vendetta Live Music"
    }
  }

  return {
    title: `Propuesta Comercial ${booking.shortId} | Vendetta Live Music`,
    description: `Cotización de show musical y producción técnica para ${booking.clientName}.`
  }
}

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await db.bookingRequest.findFirst({
    where: {
      OR: [
        { shortId: id.toUpperCase() },
        { id: id }
      ]
    },
    include: {
      client: {
        include: { user: true }
      },
      event: {
        include: {
          contracts: true
        }
      }
    }
  })

  if (!booking) {
    return notFound()
  }

  // Si tiene clientId, buscamos versiones anteriores
  let historicalVersions: any[] = []
  if (booking.clientId) {
    historicalVersions = await db.bookingRequest.findMany({
      where: {
        clientId: booking.clientId,
        shortId: { startsWith: `${booking.shortId}-V` }
      },
      orderBy: { quoteVersion: "desc" }
    })
  }

  const globalConfig = await db.globalConfig.findUnique({
    where: { id: "vendetta_config" }
  })

  // Generar tokens seguros para descargar PDFs desde ruta pública
  const secret = process.env.AUTH_SECRET || "fallback_secret_vendetta_music_app_2026"
  const pdfToken = crypto.createHmac("sha256", secret).update(booking.id).digest("hex")
  const downloadQuoteUrl = `/api/admin/contract/${booking.id}?token=${pdfToken}&type=quote`
  const downloadContractUrl = `/api/admin/contract/${booking.id}?token=${pdfToken}`

  const hasAudio = !booking.clientProvidesAudio
  const base = Number(booking.baseAmount || 0)
  const iva = Math.round(base * 0.16 * 100) / 100
  const total = base + iva

  const isAccepted = booking.status === "agendado" || booking.status === "completado"
  
  const clientProfile = booking.client
  const hasIncompleteLegal = !clientProfile?.rfc || !clientProfile?.fiscalAddress || !clientProfile?.legalRepName || !clientProfile?.legalRepRole || !clientProfile?.legalRepPower || !clientProfile?.notificationAddress || !clientProfile?.billingData || !booking.clientEmail || !booking.clientPhone

  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-20">
      <RockBackground />

      <div className="container mx-auto px-4 relative z-10 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna principal: Detalle de Propuesta */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card/60 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
              
              {/* Logo / Header Branding */}
              <div className="p-8 border-b border-border/40 bg-gradient-to-br from-foreground/[0.03] to-transparent flex flex-col items-center text-center">
                <img src="/logo.png" alt="Vendetta Logo" className="h-16 mb-4 object-contain invert" />
                <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-1">
                  Propuesta Comercial <span className="text-primary italic">Vendetta</span>
                </h1>
                <div className="text-muted-foreground text-xs font-mono tracking-widest uppercase">Folio: {booking.shortId} | Versión {booking.quoteVersion}</div>
                <div className="mt-3">
                  {isAccepted ? (
                    <span className="px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-500 font-black uppercase text-[10px] tracking-[0.2em]">
                      Aceptada y Aprobada
                    </span>
                  ) : (
                    <span className="px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 font-black uppercase text-[10px] tracking-[0.2em]">
                      Propuesta en Revisión
                    </span>
                  )}
                </div>
              </div>

              {/* Datos del Evento */}
              <div className="p-8 space-y-6">
                <h3 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border/20 pb-2">
                  Detalles de la Presentación
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <DetailItem icon={Package} label="Evento" value={booking.customName || "Presentación Musical"} />
                    <DetailItem icon={Calendar} label="Fecha" value={formatDateMX(booking.requestedDate, "PPPP")} />
                    <DetailItem icon={Clock} label="Duración y Formación" value="2 horas 30 minutos de show" subValue="Seis músicos titulares" />
                  </div>
                  <div className="space-y-4">
                    <DetailItem icon={MapPin} label="Recinto" value="World Trade Center, CDMX" subValue="Salón Tolteca" />
                    <DetailItem icon={Users} label="Asistencia Estimada" value="800 personas" />
                    <DetailItem icon={ShieldCheck} label="Montaje" value="El mismo día del show" />
                  </div>
                </div>

                {/* Alcance Técnico Detallado */}
                <div className="pt-6 border-t border-border/20 space-y-4">
                  <h4 className="text-xs font-black text-foreground uppercase tracking-widest">
                    {hasAudio ? "Alcance Técnico Incluido (Básico Obligatorio)" : "Alcance Técnico Incluido"}
                  </h4>
                  
                  <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border/20">
                      <strong className="text-foreground block mb-1">1. Presentación de Vendetta (Básico Obligatorio):</strong>
                      Show musical completo, backline de la banda, ingeniero de audio y staff técnico dedicado, preparación y coordinación de repertorio a la medida.
                    </div>
                    {hasAudio && (
                      <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border/20">
                        <strong className="text-foreground block mb-1">2. Producción Técnica de Audio e Iluminación:</strong>
                        Sistema Line Array completo Yamaha/DM3, microfonía y soporte técnico completo, sistema de monitoreo in-ear Shure (PSM900/PSM300), iluminación robótica y paneles wash LED con truss de aluminio, técnicos especialistas de operación de luz y sonido.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Componente Interactivo (Switches Opcionales, Formulario Fiscal, Resumen Económico) */}
            <ProposalInteractive 
              booking={booking} 
              downloadQuoteUrl={downloadQuoteUrl}
              downloadContractUrl={downloadContractUrl}
            />

            {/* SECCIÓN DE CONTRATO LEGAL Y FIRMA DIGITAL (SI ESTÁ ACEPTADO) */}
            {isAccepted && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {hasIncompleteLegal ? (
                  <div className="bg-card/40 border border-amber-500/30 rounded-[2rem] p-8 text-center space-y-4 shadow-xl">
                    <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
                    <h3 className="text-base font-black text-foreground uppercase tracking-wider">Firma de Contrato Pendiente</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                      La propuesta ha sido aceptada, pero el contrato definitivo requiere que captures tus datos fiscales y el nombre del representante legal en el formulario de arriba antes de firmar.
                    </p>
                  </div>
                ) : (
                  <ContractSigner 
                    bookingId={booking.id}
                    clientName={booking.clientName}
                    shortId={booking.shortId || ""}
                    isSigned={!!booking.clientSignature}
                    signedAt={booking.signedAt}
                    clientSignature={booking.clientSignature}
                    adminSignature={booking.adminSignature}
                    contractLegalText={
                      (booking.venueType?.toLowerCase() === "bar" || booking.event?.venueType?.toLowerCase() === "bar") 
                        ? ((globalConfig as any)?.contractBarLegalText || undefined)
                        : (globalConfig?.contractLegalText || undefined)
                    }
                    eventDate={booking.requestedDate}
                    eventTime={booking.startTime}
                    eventEndTime={booking.endTime}
                    eventAmount={total}
                    packageName={booking.packageName}
                    eventAddress={booking.address || "World Trade Center, Ciudad de México (Salón Tolteca)"}
                  />
                )}
              </div>
            )}
          </div>

          {/* Columna derecha: Sidebar de Contacto y Versiones */}
          <div className="space-y-6">
            {/* Información del Cliente */}
            <div className="p-6 rounded-3xl bg-card border border-border/40 space-y-4">
              <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] pb-2 border-b border-border/20">
                Directorio del Cliente
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Razón Social:</span>
                    <span className="text-foreground font-bold">{booking.clientName}</span>
                  </div>
                </div>
                {booking.clientEmail && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Email:</span>
                      <span className="text-foreground font-bold">{booking.clientEmail}</span>
                    </div>
                  </div>
                )}
                {booking.clientPhone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">WhatsApp:</span>
                      <span className="text-foreground font-bold">{booking.clientPhone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Historial de Versiones */}
            {historicalVersions.length > 0 && (
              <div className="p-6 rounded-3xl bg-card border border-border/40 space-y-4">
                <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] pb-2 border-b border-border/20 flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> Historial de Propuestas
                </h3>
                <div className="space-y-3">
                  {historicalVersions.map((v: any) => (
                    <div key={v.id} className="p-3 rounded-xl bg-foreground/5 border border-border/20 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground">Versión {v.quoteVersion}</span>
                        <span className="text-[9px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Archivada</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Total: {MXN(v.baseAmount + (v.baseAmount * 0.16))}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Asistencia Técnica y Contacto Directo */}
            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 space-y-4">
              <div className="text-sm font-black text-foreground uppercase tracking-tight">¿Dudas o Ajustes?</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Si requieres un ajuste específico que no figure en los opcionales o tienes dudas técnicas, contáctanos directamente por WhatsApp.
              </p>
              <a 
                href={`https://wa.me/5215500000000?text=Hola,%20tengo%20una%20duda%20sobre%20mi%20propuesta%20folio%20${booking.shortId}`}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button className="w-full h-11 text-[10px] font-black uppercase tracking-widest rounded-xl">
                  Contactar Soporte
                </Button>
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
      <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border/40 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
        <div className="text-foreground font-bold text-sm">{value}</div>
        {subValue && <div className="text-xs text-muted-foreground font-medium">{subValue}</div>}
      </div>
    </div>
  )
}
