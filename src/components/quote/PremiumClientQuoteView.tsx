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
  ChevronDown,
  Mic,
  Volume2,
  Radio
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
    <div className="min-h-screen bg-transparent text-slate-950 relative overflow-hidden pb-28 sm:pb-20 font-sans selection:bg-red-600 selection:text-white">
      {/* Fondo Vectorial de Concierto con Malla Acústica SVG y Luces de Escenario en Blanco */}
      <RockBackground intensity="vibrant" />

      {/* Barra de Acento Superior con Gradiente de Escenario Rojo y Ámbar */}
      <div className="h-2 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 shadow-md" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-5xl pt-6 md:pt-10">
        
        {/* ============================================================ */}
        {/* HEADER VIP: CREDENCIAL DE CONCIERTO, LOGO & FOLIO OFICIAL */}
        {/* ============================================================ */}
        <header className="mb-8 md:mb-10">
          {/* Lanyard / VIP Access Pass Tag */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-md shadow-red-600/20">
              <Ticket className="w-3.5 h-3.5" /> VIP ALL-ACCESS PASS • VENDETTA LIVE CONCERT TOUR
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gira de Eventos & Producción {new Date().getFullYear()}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-xl shadow-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            {/* Acento rojo superior de la tarjeta */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 absolute top-0 left-0 right-0" />

            {/* Branding Vendetta & Título */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Vendetta Live Music" 
                  className="h-12 sm:h-14 w-auto object-contain drop-shadow-sm" 
                />
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div className="hidden sm:block">
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-red-600 block leading-tight">
                    LIVE BAND & STAGE PRODUCTION
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                    Conciertos en Vivo & Shows de Alto Nivel
                  </span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-red-600 flex items-center gap-2 flex-wrap">
                  Cotización Oficial <span className="text-slate-900">&</span> Propuesta de Show
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl leading-relaxed mt-1">
                  Producción técnica integral, ingeniería sonora y banda de rock/pop en vivo para tu evento.
                </p>
              </div>
            </div>

            {/* Credencial de Folio estilo Boleto / Ticket de Concierto */}
            <div className="flex flex-col md:items-end gap-2.5 shrink-0 bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200">
              <div className="flex items-center gap-2">
                {isAgendado ? (
                  <Badge className="bg-emerald-600 text-white border-0 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Fecha Confirmada
                  </Badge>
                ) : isCancelado ? (
                  <Badge className="bg-red-600 text-white border-0 px-3 py-1 text-xs font-black uppercase tracking-wider">
                    Cancelada
                  </Badge>
                ) : (
                  <Badge className="bg-red-600 text-white border-0 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/20">
                    <Flame className="w-3.5 h-3.5 mr-1 text-amber-300" /> Propuesta Exclusiva
                  </Badge>
                )}
              </div>

              {/* Folio con código de barras de concierto */}
              <div className="space-y-1 text-right">
                <div className="text-[9px] font-mono tracking-widest text-slate-400 select-none">
                  ||||| | || |||| | ||| |||| |
                </div>
                <div className="text-xs font-mono text-slate-700 flex items-center justify-end gap-1.5">
                  <span className="font-bold text-slate-500">FOLIO:</span>
                  <span className="font-black text-slate-950 text-sm tracking-widest bg-white px-2.5 py-0.5 rounded-lg border-2 border-red-600 text-red-600 shadow-sm">
                    {booking.shortId}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Fecha de emisión: <strong className="text-slate-800">{formatDateMX(booking.createdAt, "d 'de' MMMM, yyyy")}</strong>
              </div>
            </div>
          </div>

          {/* Banner de Estado para Fechas Confirmadas */}
          {isAgendado && (
            <div className="mt-4 p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-950 shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm">
                  <BadgeCheck className="w-6 h-6" />
                </div>
                <div className="text-xs sm:text-sm">
                  <strong className="block text-emerald-950 font-black text-sm sm:text-base">
                    ¡Tu fecha está oficialmente confirmada en la gira de Vendetta!
                  </strong>
                  A continuación puedes consultar todos los detalles acordados y firmar digitalmente tu contrato con plena validez legal.
                </div>
              </div>
              {downloadContractUrl && (
                <Button size="sm" asChild className="bg-emerald-700 hover:bg-emerald-600 text-white shrink-0 text-xs font-black h-10 rounded-xl px-4 shadow-md">
                  <a href={downloadContractUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Descargar Contrato
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Banner si el comprobante está en revisión */}
          {isReview && !isAgendado && (
            <div className="mt-4 p-5 rounded-2xl bg-amber-50 border-2 border-amber-500/50 flex items-center gap-3.5 text-amber-950 shadow-md">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 animate-pulse shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm">
                <strong className="block text-amber-950 font-black text-sm">Comprobante de anticipo en validación</strong>
                Hemos recibido tu referencia <span className="font-mono text-amber-950 font-black bg-white px-2 py-0.5 rounded border border-amber-400">{booking.paymentRef}</span>. Nuestro equipo está corroborando el depósito para confirmar tu fecha de inmediato.
              </div>
            </div>
          )}
        </header>


        {/* ============================================================ */}
        {/* SECCIÓN 1 (SOLICITADO 1°): DATOS DEL CLIENTE & FICHA DEL EVENTO */}
        {/* ============================================================ */}
        <section className="mb-8 rounded-3xl bg-white border-2 border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 sm:p-8 relative overflow-hidden">
          {/* Acento rojo superior */}
          <div className="h-1.5 w-full bg-red-600 absolute top-0 left-0 right-0" />

          {/* Encabezado de la Ficha del Cliente */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-100 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.25em] text-red-600 mb-1">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                1. Datos del Cliente & Ficha de Presentación
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                {booking.clientName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge className="bg-red-600 text-white border-0 text-xs font-black uppercase tracking-wider px-2.5 py-0.5">
                  {occasionTitle}
                </Badge>
                {booking.customName && booking.customName !== occasionTitle && (
                  <span className="text-xs text-slate-600 font-bold">
                    • <span className="text-slate-900">{booking.customName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {downloadQuoteUrl && (
                <Button size="sm" variant="outline" asChild className="border-2 border-slate-200 hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl h-10 px-4">
                  <a href={downloadQuoteUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5 mr-1.5 text-red-600" /> Descargar PDF
                  </a>
                </Button>
              )}
              <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl h-10 px-4 shadow-md shadow-emerald-700/30">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-1.5" /> WhatsApp Producción
                </a>
              </Button>
            </div>
          </div>

          {/* Grid de 4 Bloques Principales del Evento (Concert Stage Schedule) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 relative z-10">
            {/* 1. Fecha del Concierto */}
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-red-600">
                <Calendar className="w-4 h-4 text-red-600 shrink-0" />
                Fecha del Concierto
              </div>
              <div className="text-base font-black text-slate-950 capitalize leading-snug">
                {eventDateFormatted}
              </div>
              <div className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" /> Bloqueo exclusivo de agenda
              </div>
            </div>

            {/* 2. Call Sheet & Horarios */}
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-red-600">
                <Clock className="w-4 h-4 text-red-600 shrink-0" />
                Call Sheet & Horarios
              </div>
              <div className="text-base font-black text-slate-950 leading-snug">
                {booking.startTime && booking.endTime ? `${booking.startTime} a ${booking.endTime} hrs` : "A convenir con cliente"}
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                {booking.setupTime ? `Soundcheck & montaje: ${booking.setupTime} hrs` : "Soundcheck previo el mismo día"}
              </div>
            </div>

            {/* 3. Recinto & Locación */}
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-red-600">
                <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                Recinto / Venue
              </div>
              <div className="text-sm font-bold text-slate-950 leading-snug line-clamp-2" title={fullAddress}>
                {booking.city ? `${booking.city}, ${booking.state}` : fullAddress}
              </div>
              {booking.mapsLink ? (
                <a 
                  href={booking.mapsLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center text-[11px] font-black text-red-600 hover:text-red-700 underline pt-0.5"
                >
                  Abrir en Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              ) : (
                <div className="text-[11px] text-slate-500 font-medium">
                  {cleanAddressParts || "Ubicación confirmada"}
                </div>
              )}
            </div>

            {/* 4. Formato & Puesta en Escena */}
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-red-600">
                <Users className="w-4 h-4 text-red-600 shrink-0" />
                Puesta en Escena
              </div>
              <div className="text-base font-black text-slate-950 leading-snug">
                {booking.packageName || "Show Completo Vendetta"}
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                {booking.guestCount ? `Aforo estimado: ~${booking.guestCount} personas` : "Show de alto impacto"}
              </div>
            </div>
          </div>
        </section>


        {/* ============================================================ */}
        {/* SECCIÓN 2 (SOLICITADO 2°): COSTO, VIÁTICOS & CIERRE DE VENTA */}
        {/* ============================================================ */}
        <section id="seccion-pago" className="mb-8 rounded-3xl bg-white border-2 border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 sm:p-8 relative overflow-hidden">
          {/* Acento rojo superior */}
          <div className="h-1.5 w-full bg-red-600 absolute top-0 left-0 right-0" />

          {/* Encabezado de Inversión */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-100 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.25em] text-red-600 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-red-600" />
                2. Inversión Económica & Viáticos
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-red-600">
                Presupuesto Formal & Desglose de Inversión
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Precios netos en Moneda Nacional (MXN) • Cero cargos ocultos ni variaciones de última hora.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600 sm:text-right">
              {hasInvoice ? (
                <Badge variant="outline" className="border-2 border-amber-500 text-amber-800 bg-amber-50 font-black text-xs">
                  Facturación Fiscal (+16% IVA)
                </Badge>
              ) : (
                <span className="font-bold text-slate-700">Precios finales en MXN</span>
              )}
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* TABLA FORMAL / TARJETAS ITEMIZADAS RESPONSIVAS */}
          {/* -------------------------------------------------------- */}
          <div className="mt-6">
            {/* Vista Desktop / Tablet (Tabla de Alto Contraste) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-xs font-black uppercase tracking-wider text-slate-800 bg-slate-50/80">
                    <th className="py-3 px-4 rounded-l-xl">Concepto / Servicio</th>
                    <th className="py-3 px-4">Detalle Operativo</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* Concepto 1: Show Base */}
                  <tr>
                    <td className="py-4 px-4 font-black text-slate-950">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Presentación Musical en Vivo (Vendetta)</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">
                      {booking.packageName} • Formación completa de músicos profesionales en vivo
                    </td>
                    <td className="py-4 px-4 text-right font-black text-slate-950 font-mono text-sm">
                      {formatMXN(baseAmount)}
                    </td>
                  </tr>

                  {/* Concepto 2: Viáticos y Traslado */}
                  <tr>
                    <td className="py-4 px-4 font-black text-slate-950">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Viáticos, Traslado & Logística Foránea</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">
                      {viaticosAmount > 0 ? (
                        <>Transporte de staff, backline y equipo técnico hacia <strong className="text-slate-950">{destinationCity}</strong></>
                      ) : (
                        <>Logística y traslado local cubiertos dentro de la zona de cobertura</>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-slate-950 font-mono text-sm">
                      {viaticosAmount > 0 ? formatMXN(viaticosAmount) : <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Incluido</span>}
                    </td>
                  </tr>

                  {/* Conceptos adicionales (lineItems) */}
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 px-4 font-black text-slate-950">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-red-600 shrink-0" />
                          <span>
                            {item.description}
                            {item.quantity > 1 && (
                              <span className="ml-2 text-[10px] font-bold text-slate-500">
                                (x{item.quantity})
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        Concepto adicional solicitado para montaje y producción
                      </td>
                      <td className="py-4 px-4 text-right font-black text-slate-950 font-mono text-sm">
                        {formatMXN(item.lineTotal)}
                      </td>
                    </tr>
                  ))}

                  {/* Descuento si aplica */}
                  {discountAmount > 0 && (
                    <tr className="text-emerald-800 bg-emerald-50/70 font-bold">
                      <td className="py-3 px-4 font-black">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Descuento Especial de Temporada / Cortesía</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-emerald-700">
                        Beneficio comercial aplicado a tu contratación
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-sm text-emerald-800">
                        -{formatMXN(discountAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Vista Móvil: Tarjetas Itemizadas de Alto Contraste */}
            <div className="sm:hidden space-y-3">
              {/* Card 1: Show Base */}
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-red-600" /> Show Musical en Vivo
                  </span>
                  <span className="text-sm font-black font-mono text-slate-950">
                    {formatMXN(baseAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {booking.packageName} • Formación completa de músicos profesionales en vivo.
                </p>
              </div>

              {/* Card 2: Viáticos */}
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-red-600" /> Viáticos & Traslados
                  </span>
                  <span className="text-sm font-black font-mono text-slate-950">
                    {viaticosAmount > 0 ? formatMXN(viaticosAmount) : <span className="text-emerald-700 font-bold">Incluido</span>}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {viaticosAmount > 0 
                    ? `Transporte de staff, backline y equipo hacia ${destinationCity}.` 
                    : "Logística y traslados incluidos en la zona de cobertura."}
                </p>
              </div>

              {/* Adicionales móviles */}
              {lineItems.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-red-600" /> {item.description}
                    </span>
                    <span className="text-sm font-black font-mono text-slate-950">
                      {formatMXN(item.lineTotal)}
                    </span>
                  </div>
                  {item.quantity > 1 && (
                    <p className="text-[11px] text-slate-500 font-bold">
                      Cantidad: {item.quantity} unidades
                    </p>
                  )}
                </div>
              ))}

              {/* Descuento móvil */}
              {discountAmount > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/40 space-y-1 text-emerald-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Descuento de Cortesía
                    </span>
                    <span className="text-sm font-black font-mono">
                      -{formatMXN(discountAmount)}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Beneficio especial aplicado directamente a tu cotización.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bloque de Totales Financieros */}
          <div className="mt-6 pt-6 border-t-2 border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5 text-red-600 font-black">
                <Sparkles className="w-3.5 h-3.5 text-red-600" /> Cotización vigente por 15 días naturales.
              </div>
              <div>• Disponibilidad de fecha sujeta a confirmación del anticipo correspondiente.</div>
              <div>• Sin costos sorpresa el día del evento: todo queda estipulado formalmente por contrato.</div>
            </div>

            {/* Caja de Inversión Total */}
            <div className="w-full md:w-92 space-y-2.5 bg-emerald-50/70 p-5 sm:p-6 rounded-2xl border-2 border-emerald-500 shadow-lg shadow-emerald-500/10">
              <div className="flex justify-between text-xs text-slate-700 font-medium">
                <span className="font-bold">Subtotal Neto:</span>
                <span className="font-mono text-slate-950 font-black">{formatMXN(subtotal)}</span>
              </div>
              {hasInvoice && (
                <div className="flex justify-between text-xs text-slate-700 font-medium">
                  <span className="font-bold">IVA (16% Fiscal):</span>
                  <span className="font-mono text-slate-950 font-black">{formatMXN(ivaAmount)}</span>
                </div>
              )}
              <div className="pt-3 border-t-2 border-emerald-200 flex justify-between items-baseline">
                <div>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-800 block">
                    Inversión Total
                  </span>
                  <span className="text-[10px] text-emerald-700/80 font-mono font-bold">Moneda Nacional (MXN)</span>
                </div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 tracking-tight">
                  {formatMXN(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* ESQUEMA DE PAGO 50 / 50 */}
          {/* -------------------------------------------------------- */}
          <div className="mt-8 pt-6 border-t-2 border-slate-100">
            <div className="text-xs font-black uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-600" /> Esquema de Pago Oficial para Bloqueo de Fecha (50% / 50%)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Tarjeta 1: Anticipo para Apartar Fecha */}
              <div className="p-6 rounded-2xl bg-red-50/80 border-2 border-red-500 space-y-3 relative overflow-hidden shadow-lg shadow-red-500/10">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-red-600" /> 1. Anticipo para Congelar Fecha
                  </div>
                  <Badge className="text-[10px] bg-red-600 text-white font-black uppercase tracking-wider">
                    Paso Inicial
                  </Badge>
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-red-600 tracking-tight">
                  {formatMXN(depositAmount)}
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  Congela de inmediato tu fecha en nuestra agenda oficial y garantiza la exclusividad total de la banda. No aceptamos otros eventos el mismo día.
                </p>
                <div className="pt-2 text-xs font-black flex items-center gap-1.5">
                  {isPaid ? (
                    <span className="text-emerald-700 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Anticipo Recibido y Confirmado
                    </span>
                  ) : isReview ? (
                    <span className="text-amber-800 flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded">
                      <Clock className="w-4 h-4 animate-spin text-amber-700" /> Anticipo en Proceso de Verificación
                    </span>
                  ) : (
                    <span className="text-red-700">⚠️ Requerido para apartar y congelar la fecha hoy</span>
                  )}
                </div>
              </div>

              {/* Tarjeta 2: Saldo Restante el Día del Evento */}
              <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-700">
                    2. Finiquito / Saldo Restante
                  </div>
                  <Badge variant="outline" className="text-[10px] border-2 border-slate-300 text-slate-700 font-bold">
                    El Día del Show
                  </Badge>
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-tight">
                  {formatMXN(remainingAmount)}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Se liquida el mismo día de la presentación al momento de arribo de la banda al recinto, o mediante transferencia bancaria verificada previa al show.
                </p>
                <div className="pt-2 text-xs text-slate-500 flex items-center gap-1 font-bold">
                  <Lock className="w-3.5 h-3.5 text-slate-600" /> Monto congelado por contrato sin incrementos.
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* MÓDULO INTERACTIVO DE PAGO SPEI O FIRMA DIGITAL */}
          {/* -------------------------------------------------------- */}
          <div className="mt-8 pt-6 border-t-2 border-slate-100">
            {isAgendado ? (
              /* EVENTO YA AGENDADO -> MÓDULO DE FIRMA DIGITAL DE CONTRATO */
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-2xl bg-red-50 border-2 border-red-500/30 text-red-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-red-600">
                      Firma Digital de Contrato de Prestación de Servicios
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Formaliza tu acuerdo con plena validez legal firmando en pantalla.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border-2 border-slate-200">
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
              </div>
            ) : isPendiente && !isPaid ? (
              /* EVENTO PENDIENTE -> DATOS BANCARIOS SPEI & REPORTE DE ANTICIPO */
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-red-50 border-2 border-red-500/30 text-red-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-red-600">
                      Apartar Fecha Mediante Transferencia SPEI
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Realiza tu transferencia por el monto de anticipo y reporta tu comprobante para congelar tu fecha de inmediato.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Datos Bancarios SPEI */}
                  <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center justify-between">
                      <span>Cuenta Oficial (SPEI)</span>
                      <Badge className="text-[10px] bg-emerald-700 text-white font-black border-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Cuenta Verificada
                      </Badge>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Institución Bancaria:</span>
                        <span className="text-slate-950 font-black text-sm">
                          {globalConfig?.bankName || "BBVA México"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Beneficiario / Razón Social:</span>
                        <span className="text-slate-950 font-black">
                          {globalConfig?.bankBeneficiary || "Vendetta Live Music"}
                        </span>
                      </div>

                      {globalConfig?.bankAccount && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-bold">Número de Cuenta:</span>
                            <span className="font-mono text-slate-950 font-bold">{globalConfig.bankAccount}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(globalConfig.bankAccount, "account")}
                            className="text-xs text-slate-600 hover:text-slate-950 h-8"
                          >
                            {copiedAccount ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      )}

                      {/* CLABE con botón gigante de 1 toque */}
                      <div className="p-4 rounded-xl bg-red-50 border-2 border-red-500/40 space-y-2">
                        <span className="text-[10px] text-red-600 block uppercase font-black tracking-wider">
                          CLABE Interbancaria (SPEI):
                        </span>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-slate-950 font-black text-sm sm:text-base tracking-wider break-all">
                            {globalConfig?.bankClabe || "012180015487965412"}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleCopy(globalConfig?.bankClabe || "012180015487965412", "clabe")}
                            className="bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl h-9 px-3.5 gap-1.5 shrink-0 shadow-md shadow-red-600/30"
                          >
                            {copiedClabe ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedClabe ? "¡Copiada!" : "Copiar"}</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 font-medium leading-relaxed pt-2 border-t border-slate-200">
                      Concepto sugerido para tu transferencia: <strong className="text-red-600 font-mono bg-white px-2 py-0.5 rounded border border-red-200">{booking.shortId}</strong>
                    </div>
                  </div>

                  {/* Formulario de Reporte de Anticipo */}
                  <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 space-y-4 flex flex-col justify-between shadow-sm">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-red-600 mb-1">
                        Reportar Comprobante Realizado
                      </h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                        Una vez hecha tu transferencia por <strong className="text-slate-950 font-mono font-black">{formatMXN(depositAmount)}</strong>, ingresa tu clave de rastreo, número de autorización o nombre del titular para apartar la fecha.
                      </p>

                      <form onSubmit={handleReportDeposit} className="space-y-4">
                        <div>
                          <Label htmlFor="paymentRef" className="text-xs font-bold text-slate-700 block mb-1.5">
                            Referencia de Transferencia o Nombre del Titular
                          </Label>
                          <Input
                            id="paymentRef"
                            placeholder="Ej: SPEI-892341 / Carlos Cárdenas"
                            value={paymentRefInput}
                            onChange={(e) => setPaymentRefInput(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-200 text-slate-950 placeholder:text-slate-400 rounded-xl h-11 text-xs focus:border-red-600 focus:ring-red-600"
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmittingDeposit}
                          className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-md shadow-red-600/30 transition-all gap-2"
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

                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 pt-3 border-t border-slate-100">
                      <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
        <section className="mb-8 rounded-3xl bg-white border-2 border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 sm:p-8 relative overflow-hidden">
          {/* Acento rojo superior */}
          <div className="h-1.5 w-full bg-red-600 absolute top-0 left-0 right-0" />

          {/* Encabezado de Especificaciones */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-50 border-2 border-red-500/30 text-red-600">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.25em] text-red-600 mb-0.5">
                  3. Ficha Técnica & Producción de Concierto
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-red-600">
                  Alcance Artístico & Rider Técnico
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Especificaciones claras y transparentes del show en vivo para garantizar una experiencia de concierto inolvidable.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pilar 1: Vendetta Live Band en Escena (Stage Plot & Lineup) */}
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-600">
                <Music className="w-4 h-4 text-red-600" /> 1. Vendetta Live Band en Escena
              </div>

              {/* Formación de la Banda con Iconos de Concierto */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Alineación Escénica Oficial:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-800 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-red-600 shrink-0" /> Voz Principal & Frontman
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-red-600 shrink-0" /> Guitarras Eléctricas Lead
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-red-600 shrink-0" /> Bajo Eléctrico
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-red-600 shrink-0" /> Batería Acústica
                  </div>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-950">Músicos en escena:</strong> {musiciansLineupText}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-950">Repertorio de estadio:</strong> Lo mejor del Rock y Pop en inglés y español (hits de los 80s, 90s, 2000s y clásicos de estadio).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-950">Backline profesional propio:</strong> Batería acústica sonorizada, amplificación de guitarras y bajo de alta fidelidad.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-slate-950">Coordinación de momentos estelares:</strong> Entrada de anfitriones, vals o temas especiales coordinados previamente.</span>
                </li>
              </ul>
            </div>

            {/* Pilar 2: Producción Técnica & Sonido */}
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-600">
                <Speaker className="w-4 h-4 text-red-600" /> 2. Producción Técnica & Audio
              </div>
              {!booking.clientProvidesAudio ? (
                <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-950">Sistema de Sonido:</strong>{" "}
                      {hasLargeAudio 
                        ? "Sistema PA de alta potencia y refuerzo sonoro calibrado para aforo masivo y cobertura total del recinto."
                        : "Sistema de audio profesional Electro-Voice / PA calibrado para cobertura nítida y equilibrada en el espacio del evento."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-950">Microfonía & Monitoreo:</strong> Microfonía Shure / Sennheiser inalámbrica para voces e instrumentación completa, con monitoreo de piso.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-950">Iluminación Escénica:</strong>{" "}
                      {hasRobotics 
                        ? "Cabezas móviles robóticas DMX, barras LED y efectos de iluminación sincronizados con la música."
                        : "Iluminación escénica LED para ambientación visual del área del show."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-950">Ingeniero de Sonido en Vivo:</strong> Control y balance sonoro continuo durante toda la presentación.</span>
                  </li>
                </ul>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 leading-relaxed font-medium">
                  <strong className="text-amber-900">Producción Técnica Provista por el Venue / Cliente:</strong>
                  <p className="mt-1">
                    La banda se presenta con su backline personal, microfonía y procesadores, conectándose a la consola y sistema de sonido provisto por el salón o recinto.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Producción Adicional Contratada si aplica */}
          {(hasTemplete || hasPantalla || hasPista || hasRobotLed) && (
            <div className="mt-6 pt-5 border-t-2 border-slate-100">
              <div className="text-xs font-black uppercase tracking-wider text-red-600 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-600" /> Producción Escénica Adicional Incluida:
              </div>
              <div className="flex flex-wrap gap-2">
                {hasTemplete && (
                  <Badge className="bg-slate-100 border border-slate-300 text-slate-900 text-xs py-1.5 px-3 font-bold">
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Escenario / Templete Profesional
                  </Badge>
                )}
                {hasPantalla && (
                  <Badge className="bg-slate-100 border border-slate-300 text-slate-900 text-xs py-1.5 px-3 font-bold">
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Pantalla LED de Alta Definición
                  </Badge>
                )}
                {hasPista && (
                  <Badge className="bg-slate-100 border border-slate-300 text-slate-900 text-xs py-1.5 px-3 font-bold">
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Pista de Baile Iluminada
                  </Badge>
                )}
                {hasRobotLed && (
                  <Badge className="bg-slate-100 border border-slate-300 text-slate-900 text-xs py-1.5 px-3 font-bold">
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Show de Robot LED / Batucada
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Requerimientos Básicos del Recinto */}
          <div className="mt-6 pt-5 border-t-2 border-slate-100">
            <div className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5">
              Requerimientos Técnicos Básicos del Recinto:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-black text-slate-950 block mb-0.5">⚡ Energía Eléctrica</span>
                2 contactos 110V aterrizados a no más de 10 metros del área de la banda.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-black text-slate-950 block mb-0.5">📐 Espacio del Show</span>
                Área recomendada mínima de 5m x 4m para instalación y tarima.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-black text-slate-950 block mb-0.5">🚚 Montaje & Carga</span>
                Acceso vehicular para descarga de equipo con 2 a 3 horas de anticipación.
              </div>
            </div>
          </div>
        </section>


        {/* ============================================================ */}
        {/* SECCIÓN 4: GARANTÍAS DE CONFIANZA & RESPALDO (SELLOS DE CIERRE) */}
        {/* ============================================================ */}
        <section className="mb-10 rounded-3xl bg-white border-2 border-slate-200 p-6 text-center space-y-4 shadow-md">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-red-600">
            Compromiso de Calidad & Respaldo Vendetta
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <strong className="block text-slate-950 text-xs sm:text-sm font-black">Contrato Legal Formal</strong>
              <p className="text-[11px] text-slate-600 font-medium">Respaldo legal total de tu fecha con términos claros y sin letras chiquitas.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <strong className="block text-slate-950 text-xs sm:text-sm font-black">Puntualidad Absoluta</strong>
              <p className="text-[11px] text-slate-600 font-medium">Montaje y pruebas de sonido realizadas previo a la llegada de tus invitados.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <Sparkles className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <strong className="block text-slate-950 text-xs sm:text-sm font-black">Producción Directa</strong>
              <p className="text-[11px] text-slate-600 font-medium">Equipo profesional propio y músicos titulares, sin intermediarios.</p>
            </div>
          </div>
        </section>


        {/* ============================================================ */}
        {/* FOOTER INSTITUCIONAL */}
        {/* ============================================================ */}
        <footer className="pt-6 pb-12 border-t-2 border-slate-200 text-center space-y-3">
          <p className="text-xs text-slate-600 font-bold">
            Vendetta Live Music • Toluca, Metepec, Valle de Bravo, CDMX y alrededores.
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            ProSuite Entertainment © {new Date().getFullYear()}. Todos los derechos reservados.
          </p>
        </footer>

      </div>

      {/* ============================================================ */}
      {/* BARRA FLOTANTE INFERIOR PARA DISPOSITIVOS MÓVILES (STICKY BAR) */}
      {/* ============================================================ */}
      {isPendiente && !isPaid && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-white/95 backdrop-blur-2xl border-t-2 border-slate-200 shadow-[0_-8px_25px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                Anticipo para apartar:
              </span>
              <span className="text-lg font-black font-mono text-red-600 tracking-tight">
                {formatMXN(depositAmount)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={scrollToPayment}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-xs h-10 px-3.5 rounded-xl uppercase tracking-wider shadow-md shadow-red-600/30"
              >
                Apartar Fecha
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-3 rounded-xl shadow-md"
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
