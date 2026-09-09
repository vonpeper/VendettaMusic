"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Music, 
  Speaker, 
  ShieldCheck, 
  FileText, 
  Download, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageCircle, 
  Sparkles, 
  CreditCard, 
  Lock,
  Flame,
  BadgeCheck,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RockBackground } from "@/components/funnel/RockBackground"
import { ContractSigner } from "@/components/funnel/ContractSigner"
import { reportDepositAction } from "@/actions/ventas"
import { formatDateMX } from "@/lib/utils"
import { toast } from "sonner"

const CEREMONY_TITLE_MAP: Record<string, string> = {
  boda: "Boda Exclusiva",
  xv_anos: "Fiesta de XV Años",
  cumpleanos: "Fiesta de Cumpleaños",
  corporativo: "Evento Corporativo / Empresarial",
  festival: "Festival / Evento Masivo",
  happening: "Happening Musical",
  privado: "Concierto Privado",
  bar: "Presentación en Bar / Venue",
  otro: "Evento Especial",
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unitCost: number
  lineTotal: number
}

interface PremiumClientQuoteViewProps {
  booking: any
  lineItems?: LineItem[]
  globalConfig?: any
  downloadQuoteUrl?: string
  downloadContractUrl?: string
}

export function PremiumClientQuoteView({
  booking,
  lineItems = [],
  globalConfig,
  downloadQuoteUrl,
  downloadContractUrl
}: PremiumClientQuoteViewProps) {
  const [copiedClabe, setCopiedClabe] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [paymentRefInput, setPaymentRefInput] = useState("")
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false)

  const isAgendado = booking.status === "agendado" || booking.status === "completado"
  const isCancelado = booking.status === "cancelado"
  const isPendiente = booking.status === "pendiente" || !booking.status

  const isReview = booking.paymentStatus === "review" || booking.paymentStatus === "revisar"
  const isPaid = booking.paymentStatus === "paid"

  // Cálculos económicos
  const hasInvoice = Boolean(booking.invoice || booking.event?.invoice)
  const baseAmount = Number(booking.baseAmount || 0)
  const viaticosAmount = Number(booking.viaticosAmount || 0)
  const discountAmount = Number(booking.discountAmount || 0)

  // Subtotal base + viáticos + lineItems - discount
  const lineItemsTotal = lineItems.reduce((acc, item) => acc + Number(item.lineTotal || 0), 0)
  const subtotal = Math.max(0, baseAmount + viaticosAmount + lineItemsTotal - discountAmount)
  const ivaAmount = hasInvoice ? Math.round(subtotal * 0.16 * 100) / 100 : 0
  const totalAmount = subtotal + ivaAmount

  // Anticipo requerido
  const depositAmount = Number(booking.depositAmount || Math.round(totalAmount * 0.5))
  const remainingAmount = Math.max(0, totalAmount - depositAmount)

  const formatMXN = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(val)
  }

  const handleCopy = (text: string, type: "clabe" | "account") => {
    if (!text) return
    navigator.clipboard.writeText(text)
    if (type === "clabe") {
      setCopiedClabe(true)
      setTimeout(() => setCopiedClabe(false), 2000)
    } else {
      setCopiedAccount(true)
      setTimeout(() => setCopiedAccount(false), 2000)
    }
    toast.success("Copiado al portapapeles")
  }

  const handleReportDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentRefInput.trim()) {
      toast.error("Ingresa la referencia de transferencia o nombre del titular.")
      return
    }

    setIsSubmittingDeposit(true)
    try {
      const res = await reportDepositAction(booking.id, paymentRefInput.trim())
      if (res.success) {
        toast.success("¡Comprobante reportado con éxito! El equipo de Vendetta validará tu anticipo.")
        window.location.reload()
      } else {
        toast.error(res.error || "No se pudo registrar la referencia.")
      }
    } catch {
      toast.error("Error de conexión al enviar el reporte.")
    } finally {
      setIsSubmittingDeposit(false)
    }
  }

  const occasionTitle = booking.customName 
    || CEREMONY_TITLE_MAP[booking.ceremonyType || booking.venueType] 
    || "Concierto de Rock en Vivo"

  const eventDateFormatted = booking.requestedDate
    ? formatDateMX(booking.requestedDate, "EEEE, d 'de' MMMM, yyyy")
    : "Fecha por confirmar"

  const cleanAddressParts = [
    [booking.calle, booking.numero].filter(Boolean).join(" "),
    [booking.colonia, booking.municipio, booking.state].filter(Boolean).join(", ")
  ].filter(p => Boolean(p && p !== "null" && p !== "undefined")).join(" • ")

  const fullAddress = cleanAddressParts 
    || (booking.address && booking.address !== "null" ? booking.address : "")
    || "Por definir con el cliente"

  const whatsappMessage = encodeURIComponent(
    `Hola, te contacto desde la cotización web con folio *${booking.shortId}* para el evento del *${booking.requestedDate ? formatDateMX(booking.requestedDate, "d 'de' MMMM") : ""}*. Tengo una pregunta sobre la propuesta.`
  )
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER 
    ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${whatsappMessage}`
    : `https://wa.me/5217222417045?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 relative overflow-hidden py-12 md:py-20 font-sans selection:bg-red-600 selection:text-white">
      <RockBackground />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-5xl">
        
        {/* ============================================================ */}
        {/* ENCABEZADO EJECUTIVO / BRANDING VENDETTA LIVE MUSIC */}
        {/* ============================================================ */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Vendetta Live Music" 
                  className="h-12 md:h-14 w-auto object-contain brightness-125 filter invert" 
                />
                <div className="h-8 w-px bg-white/10 hidden sm:block" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500 hidden sm:inline-block">
                  Live Band & Production
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                Propuesta Comercial <span className="text-red-500">&</span> Cotización
              </h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium">
                Servicios integrales de concierto en vivo, ingeniería de sonido y producción escénica.
              </p>
            </div>

            <div className="flex flex-col md:items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {isAgendado ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Fecha Confirmada
                  </Badge>
                ) : isCancelado ? (
                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider">
                    Cancelada
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" /> Cotización Vigente
                  </Badge>
                )}
              </div>

              <div className="text-xs font-mono text-slate-400">
                Folio Oficial: <span className="font-bold text-white tracking-widest">{booking.shortId}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Emitida: {formatDateMX(booking.createdAt, "d 'de' MMMM, yyyy")}
              </div>
            </div>
          </div>

          {/* Banner de Estado para Agendados o en Revisión */}
          {isAgendado && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-4 text-emerald-300 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-xs md:text-sm">
                  <strong className="block text-white font-bold">¡Tu fecha está oficialmente bloqueada y reservada!</strong>
                  A continuación puedes revisar los alcances pactados y firmar digitalmente tu contrato de prestación de servicios.
                </div>
              </div>
              {downloadContractUrl && (
                <Button size="sm" variant="outline" asChild className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 shrink-0 text-xs">
                  <a href={downloadContractUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Descargar Contrato
                  </a>
                </Button>
              )}
            </div>
          )}

          {isReview && !isAgendado && (
            <div className="mt-6 p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3 text-blue-300 shadow-lg shadow-blue-950/20">
              <Clock className="w-5 h-5 text-blue-400 shrink-0 animate-pulse" />
              <div className="text-xs md:text-sm">
                <strong className="block text-white font-bold">Anticipo en proceso de validación</strong>
                Hemos recibido tu reporte de anticipo con referencia <span className="font-mono text-white font-semibold">{booking.paymentRef}</span>. Nuestro equipo administrativo está verificándolo para confirmar formalmente la fecha.
              </div>
            </div>
          )}
        </header>

        {/* ============================================================ */}
        {/* TARJETA 1: FICHA EJECUTIVA DEL EVENTO */}
        {/* ============================================================ */}
        <section className="mb-8 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500 mb-1">
                Cliente / Contratante
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {booking.clientName}
              </h2>
              {booking.customName && (
                <div className="text-xs text-slate-400 mt-0.5">
                  Motivo: <span className="text-slate-200 font-semibold">{booking.customName}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {downloadQuoteUrl && (
                <Button size="sm" variant="outline" asChild className="border-white/20 hover:bg-white/10 text-slate-200 text-xs rounded-xl h-9">
                  <a href={downloadQuoteUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5 mr-1.5 text-red-500" /> Descargar PDF
                  </a>
                </Button>
              )}
              <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl h-9">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp Producción
                </a>
              </Button>
            </div>
          </div>

          {/* Grid de Especificaciones del Show */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Calendar className="w-4 h-4 text-red-500 shrink-0" />
                Fecha de Presentación
              </div>
              <div className="text-sm font-bold text-white capitalize">
                {eventDateFormatted}
              </div>
              <div className="text-[11px] text-slate-400">
                Bloqueo exclusivo de agenda
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Clock className="w-4 h-4 text-red-500 shrink-0" />
                Horarios del Show
              </div>
              <div className="text-sm font-bold text-white">
                {booking.startTime && booking.endTime ? `${booking.startTime} - ${booking.endTime} hrs` : "A convenir"}
              </div>
              <div className="text-[11px] text-slate-400">
                {booking.setupTime ? `Montaje desde ${booking.setupTime} hrs` : "Montaje previo el mismo día"}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                Lugar & Locación
              </div>
              <div className="text-sm font-bold text-white line-clamp-2">
                {booking.city ? `${booking.city}, ${booking.state}` : fullAddress}
              </div>
              {booking.mapsLink && (
                <a 
                  href={booking.mapsLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center text-[11px] font-bold text-red-400 hover:text-red-300 underline"
                >
                  Ver en Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Users className="w-4 h-4 text-red-500 shrink-0" />
                Formato / Experiencia
              </div>
              <div className="text-sm font-bold text-white">
                {booking.packageName || "Show Completo Vendetta"}
              </div>
              <div className="text-[11px] text-slate-400">
                {booking.guestCount ? `Aforo: ~${booking.guestCount} invitados` : occasionTitle}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* TARJETA 2: ALCANCE ARTÍSTICO & TÉCNICO INCLUIDO */}
        {/* ============================================================ */}
        <section className="mb-8 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                  Alcance Artístico & Rider de Producción
                </h3>
                <p className="text-xs text-slate-400">
                  Todo lo necesario para garantizar una experiencia musical de primer nivel en tu evento.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pilar 1: La Banda */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
                <Music className="w-4 h-4" /> 1. Vendetta Live Band en Escena
              </div>
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Alineación de músicos titulares en vivo:</strong> Vocalista líder, guitarra eléctrica, bajo, batería acústica, teclados y coros.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Repertorio explosivo y bilingüe:</strong> Los himnos más representativos del rock y pop en inglés y español (Queen, Journey, Soda Stereo, Bon Jovi, Caifanes, The Killers, Enanitos Verdes y más).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Backline profesional completo:</strong> Amplificadores de gira, set de batería profesional y pedaleras digitales de alta fidelidad.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Coordinación previa de setlist y momentos especiales</strong> con los anfitriones o wedding planner.</span>
                </li>
              </ul>
            </div>

            {/* Pilar 2: Producción Técnica */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
                <Speaker className="w-4 h-4" /> 2. Producción Técnica & Sonido
              </div>
              {!booking.clientProvidesAudio ? (
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Sistema de Audio Line Array / Electroacústico:</strong> Diseñado y calibrado específicamente para la acústica y aforo de tu locación.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Microfonía inalámbrica & Monitoreo In-Ear:</strong> Shure PSM900/300 para asegurar nitidez cristalina en vivo y cero acoples.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Iluminación Robótica & Wash LED:</strong> Efectos dinámicos sincronizados con el ritmo de la música y ambientación de escenario.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Ingeniería FOH & Staff Técnico:</strong> Ingeniero de audio en sala y técnicos de escenario operando durante toda la velada.</span>
                  </li>
                </ul>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                  <strong>Producción Técnica Provista por el Venue / Cliente:</strong>
                  <p className="mt-1">
                    La banda llegará con sus instrumentos, pedaleras y microfonía personal, conectándose directamente a la consola y sistema de sonido proporcionado por el recinto o tu proveedor de audio.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* TARJETA 3: TABLA FORMAL DE COTIZACIÓN / LINE ITEMS */}
        {/* ============================================================ */}
        <section className="mb-8 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                Desglose de Inversión
              </h3>
              <p className="text-xs text-slate-400">
                Presupuesto formal detallado en Moneda Nacional (MXN).
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 text-right">
              Precios netos • {hasInvoice ? "Con Factura Fiscal (+16% IVA)" : "Sin Requerimiento de Factura"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-3 px-4">Concepto / Servicio</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Detalle</th>
                  <th className="py-3 px-4 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {/* Concepto 1: Show Base */}
                <tr>
                  <td className="py-4 px-4 font-bold text-white">
                    Presentación Musical en Vivo (Vendetta)
                    <div className="sm:hidden text-[11px] text-slate-400 font-normal mt-0.5">
                      {booking.packageName} • {booking.startTime} - {booking.endTime} hrs
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-400 hidden sm:table-cell">
                    {booking.packageName} • Formación completa de músicos profesionales
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-white font-mono">
                    {formatMXN(baseAmount)}
                  </td>
                </tr>

                {/* Conceptos adicionales manuales (lineItems) */}
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 px-4 font-bold text-white">
                      {item.description}
                      {item.quantity > 1 && (
                        <span className="ml-2 text-[10px] font-normal text-slate-400">
                          (x{item.quantity})
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-400 hidden sm:table-cell">
                      Concepto adicional solicitado para el montaje y producción
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-white font-mono">
                      {formatMXN(item.lineTotal)}
                    </td>
                  </tr>
                ))}

                {/* Viáticos si aplica */}
                {viaticosAmount > 0 && (
                  <tr>
                    <td className="py-4 px-4 font-bold text-white">
                      Viáticos, Traslado & Logística Foránea
                    </td>
                    <td className="py-4 px-4 text-slate-400 hidden sm:table-cell">
                      Transporte de staff, backline y equipo hacia {booking.city || "la sede del evento"}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-white font-mono">
                      {formatMXN(viaticosAmount)}
                    </td>
                  </tr>
                )}

                {/* Descuento si aplica */}
                {discountAmount > 0 && (
                  <tr className="text-emerald-400 bg-emerald-950/10">
                    <td className="py-3 px-4 font-bold">
                      Descuento Especial de Temporada / Cortesía
                    </td>
                    <td className="py-3 px-4 text-emerald-400/80 hidden sm:table-cell">
                      Beneficio comercial aplicado a la contratación
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono">
                      -{formatMXN(discountAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bloque de Totales */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1 text-xs text-slate-400">
              <div>• Cotización válida durante 15 días a partir de su emisión.</div>
              <div>• La disponibilidad de la fecha está sujeta a la confirmación del anticipo.</div>
            </div>

            <div className="w-full md:w-80 space-y-2 bg-white/[0.02] p-5 rounded-2xl border border-white/10">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-white font-bold">{formatMXN(subtotal)}</span>
              </div>
              {hasInvoice && (
                <div className="flex justify-between text-xs text-slate-400">
                  <span>IVA (16%):</span>
                  <span className="font-mono text-white font-bold">{formatMXN(ivaAmount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-sm font-black uppercase tracking-wider text-white">Inversión Total:</span>
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {formatMXN(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* TARJETA 4: ESQUEMA DE PAGOS & CONDICIONES */}
        {/* ============================================================ */}
        <section className="mb-8 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                Esquema de Pago & Congelamiento de Fecha
              </h3>
              <p className="text-xs text-slate-400">
                Plan de inversión en 2 exhibiciones para tu máxima comodidad y certeza.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paso 1: Anticipo */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-500/[0.08] to-transparent border border-red-500/30 space-y-3 relative overflow-hidden">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> 1. Anticipo para Bloquear Fecha
              </div>
              <div className="text-3xl font-black font-mono text-white">
                {formatMXN(depositAmount)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Congela de inmediato la fecha en nuestra agenda oficial, garantiza la exclusividad de la banda y activa el inicio de logística técnica.
              </p>
              <div className="pt-2 text-[11px] font-bold text-red-400">
                {isPaid ? "✅ Anticipo Recibido y Liquidado" : isReview ? "⏳ Anticipo en Proceso de Verificación" : "⚠️ Requerido para apartar la fecha"}
              </div>
            </div>

            {/* Paso 2: Finiquito */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                2. Finiquito / Saldo Restante
              </div>
              <div className="text-3xl font-black font-mono text-slate-200">
                {formatMXN(remainingAmount)}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Se liquida el mismo día del show previo al inicio de la presentación o mediante transferencia bancaria verificada 24 horas antes.
              </p>
              <div className="pt-2 text-[11px] text-slate-500">
                Cero sorpresas • Monto congelado por contrato
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECCIÓN INTERACTIVA DE ACCIÓN / APROBACIÓN O CONTRATO */}
        {/* ============================================================ */}
        {isAgendado ? (
          /* EVENTO AGENDADO -> MÓDULO DE FIRMA DIGITAL DE CONTRATO */
          <section className="mb-12 rounded-3xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                  Contrato Digital de Prestación de Servicios
                </h3>
                <p className="text-xs text-slate-400">
                  Firma formalmente con validez legal desde tu pantalla o descarga tu copia en PDF.
                </p>
              </div>
            </div>

            <ContractSigner 
              bookingId={booking.id}
              clientName={booking.clientName}
              shortId={booking.shortId || ""}
              isSigned={!!booking.clientSignature || (booking.event?.contracts?.some((c: any) => c.status === "signed") ?? false)}
              signedAt={booking.signedAt || (booking.event?.contracts?.find((c: any) => c.status === "signed")?.signedAt)}
              clientSignature={booking.clientSignature}
              adminSignature={booking.adminSignature}
              contractLegalText={
                (booking.event?.venueType?.toLowerCase() === "bar" || booking.venueType?.toLowerCase() === "bar") 
                  ? (globalConfig?.contractBarLegalText || undefined)
                  : (globalConfig?.contractLegalText || undefined)
              }
              eventDate={booking.requestedDate}
              eventTime={booking.startTime}
              eventEndTime={booking.endTime}
              eventAmount={totalAmount}
              packageName={booking.packageName}
              eventAddress={fullAddress}
            />
          </section>
        ) : isPendiente && !isPaid ? (
          /* EVENTO PENDIENTE -> MÓDULO PARA APARTAR FECHA Y REPORTAR ANTICIPO */
          <section className="mb-12 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                    Aprobar Cotización & Apartar tu Fecha
                  </h3>
                  <p className="text-xs text-slate-400">
                    Realiza tu transferencia SPEI para congelar la fecha y reporta tu comprobante aquí.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Datos Bancarios SPEI */}
              <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center justify-between">
                  <span>Cuenta Bancaria Oficial (SPEI)</span>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                    Verificada
                  </Badge>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Banco:</span>
                    <span className="text-white font-bold text-sm">
                      {globalConfig?.bankName || "BBVA México"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Beneficiario / Razón Social:</span>
                    <span className="text-white font-bold">
                      {globalConfig?.bankBeneficiary || "Vendetta Live Music"}
                    </span>
                  </div>

                  {globalConfig?.bankAccount && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Número de Cuenta:</span>
                        <span className="font-mono text-white font-bold">{globalConfig.bankAccount}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(globalConfig.bankAccount, "account")}
                        className="text-xs text-slate-300 hover:text-white"
                      >
                        {copiedAccount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div>
                      <span className="text-[10px] text-red-400 block uppercase font-black tracking-wider">CLABE Interbancaria (SPEI):</span>
                      <span className="font-mono text-white font-bold text-sm">
                        {globalConfig?.bankClabe || "012180015487965412"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCopy(globalConfig?.bankClabe || "012180015487965412", "clabe")}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg h-8 gap-1.5"
                    >
                      {copiedClabe ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedClabe ? "Copiada" : "Copiar"}
                    </Button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-white/10">
                  Concepto recomendado para tu transferencia: <strong className="text-white font-mono">{booking.shortId}</strong>
                </div>
              </div>

              {/* Formulario de Confirmación / Referencia */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1">
                    Reportar Anticipo Realizado
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Una vez hecha tu transferencia por <strong className="text-white font-mono">{formatMXN(depositAmount)}</strong>, ingresa tu número de referencia, clave de rastreo o nombre del titular para confirmar tu fecha.
                  </p>

                  <form onSubmit={handleReportDeposit} className="space-y-4">
                    <div>
                      <Label htmlFor="paymentRef" className="text-xs font-bold text-slate-300 block mb-1.5">
                        Referencia o Nombre del Titular de la Transferencia
                      </Label>
                      <Input
                        id="paymentRef"
                        placeholder="Ej: SPEI-984214 / Roberto Farrera"
                        value={paymentRefInput}
                        onChange={(e) => setPaymentRefInput(e.target.value)}
                        className="bg-black/50 border-white/20 text-white placeholder:text-slate-600 rounded-xl h-11"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingDeposit}
                      className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-900/30 transition-all gap-2"
                    >
                      {isSubmittingDeposit ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Notificar y Apartar Fecha
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-3 border-t border-white/10">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Al enviar la confirmación, nuestro sistema reserva tu folio y te notifica por WhatsApp en cuanto el depósito es validado.
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* ============================================================ */}
        {/* FOOTER: SOPORTE, GARANTÍAS Y AVISO LEGAL */}
        {/* ============================================================ */}
        <footer className="pt-8 border-t border-white/10 text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-red-500" /> Puntualidad & Calidad Garantizada
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-500" /> Contrato con Validez Legal
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-red-500" /> Producción de Concierto en Vivo
            </span>
          </div>

          <div className="text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Vendetta Live Music • ProSuite Entertainment © {new Date().getFullYear()}. Todos los derechos reservados.
            <br />
            Para dudas sobre rider técnico, logística o modificaciones de horarios, comunícate con nosotros por WhatsApp oficial.
          </div>
        </footer>

      </div>
    </div>
  )
}
