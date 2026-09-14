"use client"

import React, { useState } from "react"
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
  Loader2,
  Truck,
  Zap,
  Shield,
  Ticket,
  ChevronDown
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

  // Anticipo requerido (50% por defecto)
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

  const scrollToPayment = () => {
    const el = document.getElementById("seccion-pago")
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
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

  const destinationCity = booking.city || booking.municipio || "Toluca / Metepec"

  const whatsappMessage = encodeURIComponent(
    `Hola, te contacto desde la cotización oficial con folio *${booking.shortId}* para el evento de *${booking.clientName}* el *${booking.requestedDate ? formatDateMX(booking.requestedDate, "d 'de' MMMM, yyyy") : ""}*. Deseo apartar la fecha.`
  )
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER 
    ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${whatsappMessage}`
    : `https://wa.me/5217222417045?text=${whatsappMessage}`

  // -------------------------------------------------------------
  // MÚSICOS & ALINEACIÓN EN ESCENA
  // -------------------------------------------------------------
  const convokedMusicians = (booking.event?.musicians || [])
    .filter((em: any) => em.status !== "rejected" && em.musician?.instrument)
  
  const convokedInstruments = Array.from(new Set(
    convokedMusicians.map((em: any) => em.musician?.instrument?.trim()).filter(Boolean)
  )) as string[]

  const hasConvocation = convokedInstruments.length > 0

  const hasKeyboardConvoked = convokedInstruments.some(inst => 
    inst.toLowerCase().includes("piano") || inst.toLowerCase().includes("teclado")
  )
  const hasKeyboardInLines = lineItems.some(item => 
    item.description.toLowerCase().includes("teclado") || item.description.toLowerCase().includes("piano")
  )
  const includesKeyboard = hasKeyboardConvoked || hasKeyboardInLines

  let musiciansLineupText = ""
  if (hasConvocation) {
    musiciansLineupText = `Alineación confirmada en escena: ${convokedInstruments.join(", ")}.`
  } else if (includesKeyboard) {
    musiciansLineupText = "Alineación en escena: Formación profesional de rock en vivo (Voz líder, guitarras, bajo, batería acústica, teclados y coros)."
  } else {
    musiciansLineupText = "Alineación en escena: Formación profesional de rock en vivo según la convocatoria asignada al evento (Voz líder, guitarras, bajo, batería acústica y coros)."
  }

  // -------------------------------------------------------------
  // RIDER TÉCNICO & PRODUCCIÓN
  // -------------------------------------------------------------
  const isFestivalPkg = Boolean(
    booking.packageName?.toLowerCase().includes("festival") || 
    booking.packageName?.toLowerCase().includes("premium")
  )
  const hasLargeAudio = isFestivalPkg || 
                        (booking.guestCount && booking.guestCount > 300) || 
                        lineItems.some(i => i.description.toLowerCase().includes("line array") || i.description.toLowerCase().includes("audio masivo"))
  
  const hasRobotics = isFestivalPkg || 
                      Boolean(booking.hasRobot) || 
                      lineItems.some(i => i.description.toLowerCase().includes("robótica") || i.description.toLowerCase().includes("robotica"))

  const hasTemplete = Boolean(booking.hasTemplete) || lineItems.some(i => i.description.toLowerCase().includes("templete") || i.description.toLowerCase().includes("escenario"))
  const hasPantalla = Boolean(booking.hasPantalla) || lineItems.some(i => i.description.toLowerCase().includes("pantalla"))
  const hasPista = Boolean(booking.hasPista) || lineItems.some(i => i.description.toLowerCase().includes("pista"))
  const hasRobotLed = Boolean(booking.hasRobot) || lineItems.some(i => i.description.toLowerCase().includes("robot") || i.description.toLowerCase().includes("batucada"))

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 relative overflow-hidden pb-28 sm:pb-20 font-sans selection:bg-red-600 selection:text-white">
      {/* Fondo Vectorial de Concierto con Malla Acústica SVG */}
      <RockBackground intensity="vibrant" />

      {/* Barra de Acento Superior con Gradiente de Escenario */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-5xl pt-8 md:pt-14">
        
        {/* ============================================================ */}
        {/* HEADER EJECUTIVO: LOGO, FOLIO & STATUS VIP */}
        {/* ============================================================ */}
        <header className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            {/* Branding Vendetta */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Vendetta Live Music" 
                  className="h-11 sm:h-13 w-auto object-contain brightness-125 filter invert drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]" 
                />
                <div className="h-7 w-px bg-white/15 hidden sm:block" />
                <div className="hidden sm:block">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 block leading-tight">
                    Live Band & Production
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
                    Experiencias Musicales de Alto Nivel
                  </span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-2 flex-wrap">
                Cotización <span className="text-red-500">&</span> Propuesta Comercial
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Producción integral de concierto en vivo, ingeniería sonora y show en vivo para tu evento.
              </p>
            </div>

            {/* Badges de Folio y Estado */}
            <div className="flex flex-col md:items-end gap-2.5 shrink-0 bg-white/[0.03] p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                {isAgendado ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Fecha Confirmada
                  </Badge>
                ) : isCancelado ? (
                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider">
                    Cancelada
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/40 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" /> Propuesta Exclusiva
                  </Badge>
                )}
              </div>

              <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-red-400" />
                <span>Folio:</span>
                <span className="font-black text-white tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                  {booking.shortId}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Emitida: <span className="text-slate-200">{formatDateMX(booking.createdAt, "d 'de' MMMM, yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Banner de Estado para Fechas Confirmadas */}
          {isAgendado && (
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-200 shadow-lg shadow-emerald-950/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <BadgeCheck className="w-6 h-6" />
                </div>
                <div className="text-xs sm:text-sm">
                  <strong className="block text-white font-bold text-sm sm:text-base">
                    ¡Tu fecha está oficialmente confirmada en agenda!
                  </strong>
                  A continuación puedes consultar todos los detalles acordados y firmar digitalmente tu contrato con validez legal.
                </div>
              </div>
              {downloadContractUrl && (
                <Button size="sm" variant="outline" asChild className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 shrink-0 text-xs h-9 rounded-xl">
                  <a href={downloadContractUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Descargar Contrato
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Banner si el depósito está en revisión */}
          {isReview && !isAgendado && (
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex items-center gap-3.5 text-blue-200 shadow-lg shadow-blue-950/30">
              <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 shrink-0 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm">
                <strong className="block text-white font-bold">Comprobante de anticipo en validación</strong>
                Hemos recibido tu referencia <span className="font-mono text-white font-bold bg-blue-500/20 px-1.5 py-0.5 rounded">{booking.paymentRef}</span>. Nuestro equipo administrativo está corroborando el depósito para confirmar formalmente tu show.
              </div>
            </div>
          )}
        </header>


        {/* ============================================================ */}
        {/* SECCIÓN 1 (SOLICITADO 1°): DATOS DEL CLIENTE & FICHA DEL EVENTO */}
        {/* ============================================================ */}
        <section className="mb-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Luz de acento sutil en esquina */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Encabezado de la Ficha VIP */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-red-500 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                1. Datos del Cliente & Ficha de Presentación
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {booking.clientName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[11px] font-bold">
                  {occasionTitle}
                </Badge>
                {booking.customName && booking.customName !== occasionTitle && (
                  <span className="text-xs text-slate-400">
                    • <span className="text-slate-200 font-semibold">{booking.customName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {downloadQuoteUrl && (
                <Button size="sm" variant="outline" asChild className="border-white/20 hover:bg-white/10 text-slate-200 text-xs rounded-xl h-10 px-3.5">
                  <a href={downloadQuoteUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5 mr-1.5 text-red-400" /> Descargar PDF
                  </a>
                </Button>
              )}
              <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl h-10 px-3.5 shadow-lg shadow-emerald-950/40">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-1.5" /> WhatsApp Producción
                </a>
              </Button>
            </div>
          </div>

          {/* Grid de 4 Bloques Principales del Evento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 relative z-10">
            {/* 1. Fecha Oficial */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Calendar className="w-4 h-4 text-red-500 shrink-0" />
                Fecha del Evento
              </div>
              <div className="text-base font-bold text-white capitalize leading-snug">
                {eventDateFormatted}
              </div>
              <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Bloqueo exclusivo de agenda
              </div>
            </div>

            {/* 2. Horarios y Montaje */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Clock className="w-4 h-4 text-red-500 shrink-0" />
                Horarios del Show
              </div>
              <div className="text-base font-bold text-white leading-snug">
                {booking.startTime && booking.endTime ? `${booking.startTime} a ${booking.endTime} hrs` : "A convenir con cliente"}
              </div>
              <div className="text-[11px] text-slate-400">
                {booking.setupTime ? `Montaje técnico desde ${booking.setupTime} hrs` : "Montaje previo el mismo día"}
              </div>
            </div>

            {/* 3. Locación & Dirección */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                Lugar & Locación
              </div>
              <div className="text-sm font-bold text-white leading-snug line-clamp-2" title={fullAddress}>
                {booking.city ? `${booking.city}, ${booking.state}` : fullAddress}
              </div>
              {booking.mapsLink ? (
                <a 
                  href={booking.mapsLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center text-[11px] font-bold text-red-400 hover:text-red-300 underline pt-0.5"
                >
                  Abrir en Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              ) : (
                <div className="text-[11px] text-slate-500">
                  {cleanAddressParts || "Ubicación confirmada"}
                </div>
              )}
            </div>

            {/* 4. Formato y Experiencia */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Users className="w-4 h-4 text-red-500 shrink-0" />
                Experiencia & Formato
              </div>
              <div className="text-base font-bold text-white leading-snug">
                {booking.packageName || "Show Completo Vendetta"}
              </div>
              <div className="text-[11px] text-slate-400">
                {booking.guestCount ? `Aforo estimado: ~${booking.guestCount} personas` : "Show de alto impacto"}
              </div>
            </div>
          </div>
        </section>


        {/* ============================================================ */}
        {/* SECCIÓN 2 (SOLICITADO 2°): COSTO, VIÁTICOS & CIERRE DE VENTA */}
        {/* ============================================================ */}
        <section id="seccion-pago" className="mb-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Luz de acento dorada / ámbar */}
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Encabezado de Inversión */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 mb-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                2. Inversión Económica & Viáticos
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Presupuesto Formal & Desglose de Inversión
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Precios netos en Moneda Nacional (MXN) • Cero cargos ocultos ni variaciones de última hora.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 sm:text-right">
              {hasInvoice ? (
                <Badge variant="outline" className="border-amber-500/30 text-amber-300 bg-amber-500/10 text-xs">
                  Facturación Fiscal (+16% IVA)
                </Badge>
              ) : (
                <span className="text-slate-400">Precios finales en MXN</span>
              )}
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* TABLA FORMAL / TARJETAS ITEMIZADAS RESPONSIVAS */}
          {/* -------------------------------------------------------- */}
          <div className="mt-6">
            {/* Vista para Tablet y Desktop (Tabla Tradicional Estilizada) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="py-3 px-4">Concepto / Servicio</th>
                    <th className="py-3 px-4">Detalle Operativo</th>
                    <th className="py-3 px-4 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {/* Concepto 1: Show Base */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-red-500 shrink-0" />
                        <span>Presentación Musical en Vivo (Vendetta)</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {booking.packageName} • Formación completa de músicos profesionales en vivo
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-white font-mono text-sm">
                      {formatMXN(baseAmount)}
                    </td>
                  </tr>

                  {/* Concepto 2: Viáticos y Logística de Traslado */}
                  <tr>
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Viáticos, Traslado & Logística Foránea</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {viaticosAmount > 0 ? (
                        <>Transporte de staff, backline y equipo técnico hacia <strong className="text-white">{destinationCity}</strong></>
                      ) : (
                        <>Logística y traslado local cubiertos dentro de la zona de cobertura</>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-white font-mono text-sm">
                      {viaticosAmount > 0 ? formatMXN(viaticosAmount) : <span className="text-emerald-400">Incluido</span>}
                    </td>
                  </tr>

                  {/* Conceptos adicionales (lineItems) */}
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>
                            {item.description}
                            {item.quantity > 1 && (
                              <span className="ml-2 text-[10px] font-normal text-slate-400">
                                (x{item.quantity})
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        Concepto adicional solicitado para montaje y producción
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-white font-mono text-sm">
                        {formatMXN(item.lineTotal)}
                      </td>
                    </tr>
                  ))}

                  {/* Descuento si aplica */}
                  {discountAmount > 0 && (
                    <tr className="text-emerald-400 bg-emerald-950/20">
                      <td className="py-3 px-4 font-bold">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Descuento Especial de Temporada / Cortesía</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-emerald-300/80">
                        Beneficio comercial aplicado a tu contratación
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-sm">
                        -{formatMXN(discountAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Vista para Móviles (Tarjetas Itemizadas Claras y Táctiles) */}
            <div className="sm:hidden space-y-3">
              {/* Card 1: Show Musical Base */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-red-500" /> Show Musical en Vivo
                  </span>
                  <span className="text-sm font-bold font-mono text-white">
                    {formatMXN(baseAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {booking.packageName} • Formación completa de músicos profesionales en vivo.
                </p>
              </div>

              {/* Card 2: Viáticos & Logística */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-400" /> Viáticos & Traslados
                  </span>
                  <span className="text-sm font-bold font-mono text-white">
                    {viaticosAmount > 0 ? formatMXN(viaticosAmount) : <span className="text-emerald-400">Incluido</span>}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {viaticosAmount > 0 
                    ? `Transporte de staff, backline y equipo hacia ${destinationCity}.` 
                    : "Logística y traslados incluidos en la zona de cobertura."}
                </p>
              </div>

              {/* Adicionales móviles */}
              {lineItems.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" /> {item.description}
                    </span>
                    <span className="text-sm font-bold font-mono text-white">
                      {formatMXN(item.lineTotal)}
                    </span>
                  </div>
                  {item.quantity > 1 && (
                    <p className="text-[11px] text-slate-400">
                      Cantidad: {item.quantity} unidades
                    </p>
                  )}
                </div>
              ))}

              {/* Descuento móvil si aplica */}
              {discountAmount > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1 text-emerald-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Descuento de Cortesía
                    </span>
                    <span className="text-sm font-bold font-mono">
                      -{formatMXN(discountAmount)}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-400/80">
                    Beneficio especial aplicado directamente a tu cotización.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bloque de Totales Financieros */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Cotización vigente por 15 días naturales.
              </div>
              <div>• Disponibilidad de fecha sujeta a confirmación del anticipo correspondiente.</div>
              <div>• Sin costos sorpresa el día del evento: todo queda estipulado formalmente.</div>
            </div>

            {/* Caja de Inversión Total */}
            <div className="w-full md:w-88 space-y-2.5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 rounded-2xl border border-white/15 shadow-xl">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal Neto:</span>
                <span className="font-mono text-white font-bold">{formatMXN(subtotal)}</span>
              </div>
              {hasInvoice && (
                <div className="flex justify-between text-xs text-slate-400">
                  <span>IVA (16% Fiscal):</span>
                  <span className="font-mono text-white font-bold">{formatMXN(ivaAmount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-white/15 flex justify-between items-baseline">
                <div>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white block">
                    Inversión Total
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Moneda Nacional</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                  {formatMXN(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* PSICOLOGÍA DE CIERRE: ESQUEMA DE PAGO 50 / 50 */}
          {/* -------------------------------------------------------- */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-300 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" /> Esquema de Pagos para Bloqueo de Fecha (50% / 50%)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Tarjeta 1: Anticipo para Apartar Fecha */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-red-500/[0.12] via-red-950/20 to-transparent border border-red-500/40 space-y-3 relative overflow-hidden shadow-lg shadow-red-950/20">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> 1. Anticipo para Congelar Fecha
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-300 border-red-500/30 font-bold">
                    Paso Inicial
                  </Badge>
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                  {formatMXN(depositAmount)}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Congela de inmediato tu fecha en nuestra agenda oficial y garantiza la exclusividad total de la banda. No aceptamos otros eventos el mismo día.
                </p>
                <div className="pt-2 text-xs font-bold text-red-400 flex items-center gap-1.5">
                  {isPaid ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Anticipo Recibido y Confirmado
                    </span>
                  ) : isReview ? (
                    <span className="text-blue-400 flex items-center gap-1">
                      <Clock className="w-4 h-4 animate-spin" /> Anticipo en Proceso de Verificación
                    </span>
                  ) : (
                    <span>⚠️ Requerido para apartar la fecha hoy</span>
                  )}
                </div>
              </div>

              {/* Tarjeta 2: Saldo Restante el Día del Evento */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    2. Finiquito / Saldo Restante
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white/5 text-slate-300 border-white/20">
                    El Día del Show
                  </Badge>
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-slate-200 tracking-tight">
                  {formatMXN(remainingAmount)}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Se liquida el mismo día de la presentación al momento de arribo de la banda al recinto, o mediante transferencia bancaria verificada previa al show.
                </p>
                <div className="pt-2 text-xs text-slate-500 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Monto congelado por contrato sin incrementos.
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* MÓDULO INTERACTIVO DE PAGO SPEI O FIRMA DIGITAL */}
          {/* -------------------------------------------------------- */}
          <div className="mt-8 pt-6 border-t border-white/10">
            {isAgendado ? (
              /* EVENTO YA AGENDADO -> MÓDULO DE FIRMA DIGITAL DE CONTRATO */
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                      Firma Digital de Contrato de Prestación de Servicios
                    </h4>
                    <p className="text-xs text-slate-400">
                      Formaliza tu acuerdo con validez legal firmando en pantalla.
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
              </div>
            ) : isPendiente && !isPaid ? (
              /* EVENTO PENDIENTE -> DATOS BANCARIOS SPEI & REPORTE DE ANTICIPO */
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                      Apartar Fecha Mediante Transferencia SPEI
                    </h4>
                    <p className="text-xs text-slate-400">
                      Realiza tu transferencia por el monto de anticipo y reporta tu comprobante para congelar tu fecha de inmediato.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Datos Bancarios SPEI */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-black/60 border border-white/15 space-y-4 shadow-xl">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center justify-between">
                      <span>Cuenta Oficial (SPEI)</span>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Cuenta Verificada
                      </Badge>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Institución Bancaria:</span>
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
                            className="text-xs text-slate-300 hover:text-white h-8"
                          >
                            {copiedAccount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      )}

                      {/* CLABE con botón gigante de 1 toque */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-600/15 via-red-500/10 to-transparent border border-red-500/30 space-y-2">
                        <span className="text-[10px] text-red-400 block uppercase font-black tracking-wider">
                          CLABE Interbancaria (SPEI):
                        </span>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-white font-black text-sm sm:text-base tracking-wider break-all">
                            {globalConfig?.bankClabe || "012180015487965412"}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleCopy(globalConfig?.bankClabe || "012180015487965412", "clabe")}
                            className="bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl h-9 px-3.5 gap-1.5 shrink-0 shadow-md shadow-red-950/40"
                          >
                            {copiedClabe ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedClabe ? "¡Copiada!" : "Copiar"}</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-white/10">
                      Concepto sugerido para tu transferencia: <strong className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded">{booking.shortId}</strong>
                    </div>
                  </div>

                  {/* Formulario de Reporte de Anticipo */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1">
                        Reportar Comprobante Realizado
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Una vez hecha tu transferencia por <strong className="text-white font-mono">{formatMXN(depositAmount)}</strong>, ingresa tu clave de rastreo, número de autorización o nombre del titular para apartar la fecha.
                      </p>

                      <form onSubmit={handleReportDeposit} className="space-y-4">
                        <div>
                          <Label htmlFor="paymentRef" className="text-xs font-bold text-slate-300 block mb-1.5">
                            Referencia de Transferencia o Nombre del Titular
                          </Label>
                          <Input
                            id="paymentRef"
                            placeholder="Ej: SPEI-892341 / Roberto Farrera"
                            value={paymentRefInput}
                            onChange={(e) => setPaymentRefInput(e.target.value)}
                            className="bg-black/60 border-white/20 text-white placeholder:text-slate-600 rounded-xl h-11 text-xs"
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmittingDeposit}
                          className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-900/40 transition-all gap-2"
                        >
                          {isSubmittingDeposit ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Validando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> Notificar y Apartar Fecha
                            </>
                          )}
                        </Button>
                      </form>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-3 border-t border-white/10">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Al reportar tu pago, nuestro sistema reserva tu fecha y te contactamos por WhatsApp de inmediato.</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>


        {/* ============================================================ */}
        {/* SECCIÓN 3 (SOLICITADO 3°): ESPECIFICACIONES TÉCNICAS & RIDER */}
        {/* ============================================================ */}
        <section className="mb-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Encabezado de Especificaciones */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500 mb-0.5">
                  3. Ficha Técnica & Producción
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                  Alcance Artístico & Rider Técnico
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Especificaciones claras y transparentes de los servicios incluidos para garantizar un show inolvidable.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pilar 1: Vendetta Live Band en Escena */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
                <Music className="w-4 h-4" /> 1. Vendetta Live Band en Escena
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Músicos en escena:</strong> {musiciansLineupText}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Repertorio en vivo:</strong> Lo mejor del Rock y Pop en inglés y español (hits de los 80s, 90s, 2000s y clásicos de estadio).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Backline profesional propio:</strong> Batería acústica sonorizada, amplificación de guitarras y bajo de alta fidelidad.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Coordinación previa de setlist y momentos clave</strong> (entrada de anfitriones, vals o temas especiales).</span>
                </li>
              </ul>
            </div>

            {/* Pilar 2: Producción Técnica & Sonido */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
                <Speaker className="w-4 h-4" /> 2. Producción Técnica & Audio
              </div>
              {!booking.clientProvidesAudio ? (
                <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Sistema de Sonido:</strong>{" "}
                      {hasLargeAudio 
                        ? "Sistema PA de alta potencia y refuerzo sonoro calibrado para aforo masivo y cobertura total del recinto."
                        : "Sistema de audio profesional Electro-Voice / PA calibrado para cobertura nítida y equilibrada en el espacio del evento."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Microfonía & Monitoreo:</strong> Microfonía Shure / Sennheiser para voces e instrumentación completa, con monitores de escenario.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Iluminación Escénica:</strong>{" "}
                      {hasRobotics 
                        ? "Cabezas móviles robóticas, barras LED y efectos de iluminación sincronizados con la música."
                        : "Iluminación escénica LED para ambientación visual del área del show."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Ingeniero de Sonido en Vivo:</strong> Control y balance sonoro continuo durante toda la presentación.</span>
                  </li>
                </ul>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                  <strong>Producción Técnica Provista por el Venue / Cliente:</strong>
                  <p className="mt-1">
                    La banda se presenta con su backline personal, microfonía y procesadores, conectándose a la consola y sistema de sonido provisto por el salón o recinto.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Producción Adicional Contratada si aplica */}
          {(hasTemplete || hasPantalla || hasPista || hasRobotLed) && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Producción Escénica Adicional Incluida:
              </div>
              <div className="flex flex-wrap gap-2">
                {hasTemplete && (
                  <Badge variant="outline" className="bg-white/5 border-white/20 text-slate-200 text-xs py-1.5 px-3">
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Escenario / Templete Profesional
                  </Badge>
                )}
                {hasPantalla && (
                  <Badge variant="outline" className="bg-white/5 border-white/20 text-slate-200 text-xs py-1.5 px-3">
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Pantalla LED de Alta Definición
                  </Badge>
                )}
                {hasPista && (
                  <Badge variant="outline" className="bg-white/5 border-white/20 text-slate-200 text-xs py-1.5 px-3">
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Pista de Baile Iluminada
                  </Badge>
                )}
                {hasRobotLed && (
                  <Badge variant="outline" className="bg-white/5 border-white/20 text-slate-200 text-xs py-1.5 px-3">
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Show de Robot LED / Batucada
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Requerimientos Básicos del Lugar */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
              Requerimientos Básicos para la Ejecución del Servicio:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="font-bold text-white block mb-0.5">⚡ Energía Eléctrica</span>
                2 contactos 110V aterrizados a no más de 10 metros de la banda.
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="font-bold text-white block mb-0.5">📐 Espacio del Show</span>
                Área recomendada mínima de 5m x 4m para instalación cómoda.
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="font-bold text-white block mb-0.5">🚚 Montaje & Acceso</span>
                Acceso vehicular para descarga con 2 a 3 horas de anticipación.
              </div>
            </div>
          </div>
        </section>


        {/* ============================================================ */}
        {/* SECCIÓN 4: GARANTÍAS DE CONFIANZA & RESPALDO (SELLOS DE CIERRE) */}
        {/* ============================================================ */}
        <section className="mb-10 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-md p-6 text-center space-y-4">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
            Compromiso de Calidad Vendetta
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <strong className="block text-white text-xs sm:text-sm font-bold">Contrato Legal Formal</strong>
              <p className="text-[11px] text-slate-400">Respaldo legal total de tu fecha con términos claros y sin letras chiquitas.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <strong className="block text-white text-xs sm:text-sm font-bold">Puntualidad Absoluta</strong>
              <p className="text-[11px] text-slate-400">Montaje y pruebas de sonido realizadas previo a la llegada de tus invitados.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <Sparkles className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <strong className="block text-white text-xs sm:text-sm font-bold">Producción Directa</strong>
              <p className="text-[11px] text-slate-400">Equipo profesional propio y músicos titulares, sin intermediarios.</p>
            </div>
          </div>
        </section>


        {/* ============================================================ */}
        {/* FOOTER INSTITUCIONAL */}
        {/* ============================================================ */}
        <footer className="pt-6 pb-12 border-t border-white/10 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Vendetta Live Music • Toluca, Metepec, Valle de Bravo, CDMX y alrededores.
          </p>
          <p className="text-[11px] text-slate-500">
            ProSuite Entertainment © {new Date().getFullYear()}. Todos los derechos reservados.
          </p>
        </footer>

      </div>

      {/* ============================================================ */}
      {/* BARRA FLOTANTE INFERIOR PARA DISPOSITIVOS MÓVILES (STICKY BAR) */}
      {/* ============================================================ */}
      {isPendiente && !isPaid && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-[#08080c]/95 backdrop-blur-2xl border-t border-white/15 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Anticipo para apartar:
              </span>
              <span className="text-lg font-black font-mono text-white tracking-tight">
                {formatMXN(depositAmount)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={scrollToPayment}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-xs h-10 px-3.5 rounded-xl uppercase tracking-wider shadow-lg shadow-red-950/50"
              >
                Apartar Fecha
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-3 rounded-xl"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
