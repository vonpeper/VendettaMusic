"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"
import { submitContactInquiry } from "@/actions/contact"
import { submitPublicQuoteAction } from "@/actions/quote-direct"
import { toast } from "sonner"
import { ESTADOS_MUNICIPIOS } from "@/lib/municipios"
import { 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  PartyPopper, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  ExternalLink,
  Car,
  AlertTriangle,
  Tv,
  Maximize2,
  Lightbulb,
  Grid
} from "lucide-react"

interface DirectQuoteFormProps {
  adminWhatsapp?: string | null
  initialPackage?: string | null
  initialDate?: string | null
}

const EVENT_TYPES = [
  { value: "Boda", label: "💒 Boda" },
  { value: "XV Años", label: "👸 XV Años" },
  { value: "Cumpleaños / Aniversario", label: "🎂 Cumpleaños / Aniversario" },
  { value: "Corporativo / Fin de Año", label: "🏢 Corporativo / Fin de Año" },
  { value: "Bar / Restaurante / Festival", label: "🍸 Bar / Restaurante / Festival" },
  { value: "Graduación", label: "🎓 Graduación" },
  { value: "Fiesta Privada", label: "🎸 Fiesta Privada" },
  { value: "Otro", label: "✨ Otro motivo..." },
]

const TIME_OPTIONS = [
  "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM",
  "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM",
  "10:00 PM", "10:30 PM",
  "11:00 PM", "11:30 PM",
  "12:00 AM", "12:30 AM",
  "01:00 AM", "01:30 AM",
  "02:00 AM", "02:30 AM",
  "03:00 AM", "03:30 AM",
  "04:00 AM", "04:30 AM",
  "05:00 AM",
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"
]

const MXN = (v: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(v)

function formatFechaEspanol(fechaStr: string): string {
  if (!fechaStr) return ""
  try {
    const [year, month, day] = fechaStr.split("-").map(Number)
    if (!year || !month || !day) return fechaStr
    const fechaObj = new Date(year, month - 1, day, 12, 0, 0)
    const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(fechaObj)
    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)
  } catch {
    return fechaStr
  }
}

export function DirectQuoteForm({ adminWhatsapp, initialPackage, initialDate }: DirectQuoteFormProps) {
  const pkgLower = (initialPackage || "").toLowerCase()
  const isExperience = pkgLower.includes("experience")
  const isFestival = pkgLower.includes("festival")
  const isEssential = pkgLower.includes("essential")
  const isLargePackage = isExperience || isFestival
  const paqueteNombre = isFestival ? "Festival Premium" : isExperience ? "Experience" : isEssential ? "Essential" : null

  // Datos de contacto
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [tipoEvento, setTipoEvento] = useState("Boda")
  const [tipoEventoOtro, setTipoEventoOtro] = useState("")
  const [fecha, setFecha] = useState(initialDate || "")

  // Sincronizar initialDate si cambia dinámicamente
  useEffect(() => {
    if (initialDate) {
      setFecha(initialDate)
    }
  }, [initialDate])

  // Horario seleccionable en formato 12h AM/PM
  const [horaInicio, setHoraInicio] = useState("08:00 PM")
  const [horaFin, setHoraFin] = useState("01:00 AM")

  // Invitados y producción adicional (>100)
  const [invitados, setInvitados] = useState(isLargePackage ? "100" : "50")
  const [produccionAdicional, setProduccionAdicional] = useState<string[]>(() => {
    if (isFestival) {
      return ["Producción más grande", "Pantalla LED", "Templete / Escenario", "Iluminación adicional"]
    }
    if (isExperience) {
      return ["Producción más grande"]
    }
    return []
  })

  // Sincronizar si cambia initialPackage dinámicamente
  useEffect(() => {
    if (isLargePackage) {
      setInvitados((prev) => {
        const n = parseInt(prev, 10) || 0
        return n < 100 ? "100" : prev
      })
      if (isFestival) {
        setProduccionAdicional(["Producción más grande", "Pantalla LED", "Templete / Escenario", "Iluminación adicional"])
      } else if (isExperience) {
        setProduccionAdicional((prev) => prev.includes("Producción más grande") ? prev : [...prev, "Producción más grande"])
      }
    }
  }, [initialPackage, isLargePackage, isFestival, isExperience])

  // Ubicación y viáticos
  const [estado, setEstado] = useState("Estado de México")
  const [municipio, setMunicipio] = useState("Metepec")
  const [municipioManual, setMunicipioManual] = useState("")
  const [lugarEvento, setLugarEvento] = useState("")
  const [mapsLink, setMapsLink] = useState("")

  // Estado de viáticos
  const [viaticos, setViaticos] = useState<{
    amount: number
    tollCost: number
    fuelCost: number
    isOutsideZone: boolean
    distanceKm: number
    requiresManualQuote: boolean
    description?: string
  } | null>(null)
  const [loadingViaticos, setLoadingViaticos] = useState(false)

  // Notas
  const [notas, setNotas] = useState("")

  // Estados de envío
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedResult, setSubmittedResult] = useState<{
    mode: "auto_quote" | "needs_review"
    proposalUrl?: string
    shortId?: string
    waUrl: string
  } | null>(null)

  const cleanPhone = (
    adminWhatsapp ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    "5217222880045"
  ).replace(/\D/g, "")

  // Lista de municipios según el estado seleccionado
  const municipiosDisponibles = ESTADOS_MUNICIPIOS[estado] || [
    "Otro municipio / cotización manual",
  ]
  const isMunicipioManual =
    municipio === "Otro municipio / cotización manual" ||
    municipio === "Otro municipio"

  // Cuando cambia el estado, resetear municipio al primero de la lista
  const handleEstadoChange = (nuevoEstado: string) => {
    setEstado(nuevoEstado)
    const primerMuni = ESTADOS_MUNICIPIOS[nuevoEstado]?.[0] || "Otro municipio / cotización manual"
    setMunicipio(primerMuni)
    setMunicipioManual("")
  }

  // Cálculo automático de viáticos cuando cambia municipio o estado
  useEffect(() => {
    const muniEfectivo = isMunicipioManual ? municipioManual.trim() : municipio.trim()
    if (!muniEfectivo || muniEfectivo.length < 2) {
      setViaticos(null)
      return
    }

    let isMounted = true
    const fetchViaticos = async () => {
      setLoadingViaticos(true)
      try {
        const destination = `${muniEfectivo}, ${estado}`
        const resp = await fetch(`/api/viaticos?destination=${encodeURIComponent(destination)}`)
        const data = await resp.json()

        if (!isMounted) return

        if (resp.ok && !data.error) {
          setViaticos({
            amount: data.viaticosAmount || 0,
            tollCost: data.tollCost || 0,
            fuelCost: data.fuelCost || 0,
            isOutsideZone: data.isOutsideZone ?? data.viaticosAmount > 0,
            distanceKm: data.distanceKm || 0,
            requiresManualQuote: !!data.requiresManualQuote,
            description: data.description,
          })
        } else {
          setViaticos(null)
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Error calculando viáticos:", err)
          setViaticos(null)
        }
      } finally {
        if (isMounted) setLoadingViaticos(false)
      }
    }

    const timer = setTimeout(() => {
      fetchViaticos()
    }, 400)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [municipio, municipioManual, estado, isMunicipioManual])

  // Toggle de producción adicional
  const toggleProduccionItem = (item: string) => {
    setProduccionAdicional((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  const numInvitados = parseInt(invitados, 10) || 0
  const tieneMasDe100Invitados = numInvitados > 100

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!nombre.trim()) {
      toast.error("Por favor ingresa tu nombre completo")
      return
    }
    if (!telefono.trim()) {
      toast.error("Por favor ingresa tu número de WhatsApp")
      return
    }
    if (!fecha) {
      toast.error("Por favor selecciona la fecha de tu evento")
      return
    }

    if (tipoEvento === "Otro" && !tipoEventoOtro.trim()) {
      toast.error("Por favor especifica el motivo de tu festejo")
      return
    }

    const muniFinal = isMunicipioManual ? municipioManual.trim() : municipio
    if (!muniFinal) {
      toast.error("Por favor selecciona o ingresa el municipio del evento")
      return
    }

    if (isLargePackage && numInvitados < 100) {
      toast.error(`El paquete ${paqueteNombre || "seleccionado"} incluye producción diseñada para un aforo mínimo de 100 invitados.`)
      return
    }

    setIsSubmitting(true)

    const tipoEventoFinal = tipoEvento === "Otro"
      ? (tipoEventoOtro.trim() ? `Otro (${tipoEventoOtro.trim()})` : "Otro")
      : tipoEvento

    const horarioCompleto = `${horaInicio} a ${horaFin}`
    const ubicacionCompleta = `${muniFinal}, ${estado}${lugarEvento.trim() ? ` (${lugarEvento.trim()})` : ""}`

    // 1. Guardar y procesar con submitPublicQuoteAction (Bifurcación: Auto-Landing vs Por Revisar)
    let quoteResult: any = null
    try {
      quoteResult = await submitPublicQuoteAction({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        tipoEvento: tipoEventoFinal,
        fecha,
        horaInicio,
        horaFin,
        invitados: numInvitados,
        produccionAdicional,
        estado,
        municipio: muniFinal,
        lugarEvento: lugarEvento.trim() || undefined,
        mapsLink: mapsLink.trim() || undefined,
        viaticos,
        paquete: paqueteNombre || undefined,
        notas: notas.trim() || undefined
      })
    } catch (saveErr) {
      console.warn("Quote submit error:", saveErr)
    }

    // 2. Formatear texto de viáticos para WhatsApp
    let textoViaticos = "Zona local (sin costo adicional de viáticos)"
    if (viaticos) {
      if (viaticos.requiresManualQuote) {
        textoViaticos = "Distancia extendida (>250 km, cotización logística personalizada)"
      } else if (viaticos.amount > 0) {
        textoViaticos = `${MXN(viaticos.amount)} MXN (Incluye casetas ida y vuelta y gasto de gasolina para 2 camionetas y el transporte de 5 personas)`
      }
    }

    // 3. Formatear producción adicional
    let textoProduccion = ""
    if (tieneMasDe100Invitados && produccionAdicional.length > 0) {
      textoProduccion = `\n• *Producción adicional de interés (>100 invitados):*\n${produccionAdicional.map((p) => `  - ${p}`).join("\n")}`
    }

    // 4. Construir mensaje de WhatsApp con formato limpio (sin emojis problemáticos)
    const fechaFormateada = formatFechaEspanol(fecha) || fecha

    const lineasMensaje = [
      "¡Hola Vendetta Live Music!",
      "Llené el formulario para personalizar la propuesta para mi evento:",
      "",
      "*DETALLES DEL EVENTO*",
      ...(paqueteNombre ? [`• *Paquete de interés:* ${paqueteNombre}`] : []),
      `• *Nombre:* ${nombre.trim()}`,
      `• *WhatsApp:* ${telefono.trim()}`,
      `• *Tipo de Evento:* ${tipoEventoFinal}`,
      `• *Fecha:* ${fechaFormateada}`,
      `• *Horario:* ${horarioCompleto}`,
      `• *Invitados estimados:* ${numInvitados} personas`,
      `• *Ubicación:* ${ubicacionCompleta}`,
    ]

    if (mapsLink.trim()) {
      lineasMensaje.push(`• *Google Maps:* ${mapsLink.trim()}`)
    }

    if (textoProduccion) {
      lineasMensaje.push(textoProduccion)
    }

    lineasMensaje.push(
      "",
      "*LOGÍSTICA Y VIÁTICOS*",
      `• *Viáticos estimados:* ${textoViaticos}`,
      "• *Condiciones:* No incluye planta de luz. Viáticos para 2 camionetas (gasolina y casetas únicamente). No incluye alimentos."
    )

    if (notas.trim()) {
      lineasMensaje.push(
        "",
        "*NOTAS O PETICIONES ESPECIALES*",
        notas.trim()
      )
    }

    const isAutoQuote = quoteResult?.mode === "auto_quote" && quoteResult?.shortId
    const proposalFullUrl = isAutoQuote ? `https://vendetta.mx/propuesta/${quoteResult.shortId}` : null

    if (isAutoQuote && proposalFullUrl) {
      lineasMensaje.push(
        "",
        "🔗 *Revisa tu propuesta interactiva y disponibilidad:*",
        proposalFullUrl
      )
    } else if (produccionAdicional.length > 0 || tieneMasDe100Invitados) {
      lineasMensaje.push(
        "",
        "⚠️ *Nota de producción:* Esta solicitud incluye requerimientos especiales de producción técnica y está en revisión."
      )
    }

    lineasMensaje.push(
      "",
      "¿Tienen disponibilidad para esta fecha? ¡Quedo atento a la propuesta!"
    )

    const waMessage = lineasMensaje.join("\n")

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMessage)}`
    setSubmittedResult({
      mode: quoteResult?.mode || (numInvitados <= 100 && produccionAdicional.length === 0 ? "auto_quote" : "needs_review"),
      proposalUrl: proposalFullUrl || undefined,
      shortId: quoteResult?.shortId,
      waUrl
    })
    setIsSubmitting(false)

    toast.success(isAutoQuote ? "¡Propuesta lista en línea! Abriendo WhatsApp..." : "¡Solicitud registrada! Abriendo WhatsApp...")

    // Abrir WhatsApp
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank")
    }
  }

  // Pantalla de confirmación y reintento
  if (submittedResult) {
    const isAutoQuote = submittedResult.mode === "auto_quote"

    return (
      <div className="bg-card/90 border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl backdrop-blur-xl space-y-6 animate-in fade-in-0 duration-300">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg ${
          isAutoQuote
            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-emerald-500/20"
            : "bg-primary/20 border border-primary/40 text-primary shadow-primary/20"
        }`}>
          {isAutoQuote ? <CheckCircle2 className="w-9 h-9" /> : <Sparkles className="w-9 h-9" />}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight">
            {isAutoQuote ? "¡Tu Cotización Está Lista!" : "¡Solicitud de Producción Recibida!"}
          </h2>
          <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
            {isAutoQuote ? (
              <>
                Generamos tu propuesta interactiva exclusiva{submittedResult.shortId ? ` (Folio: ${submittedResult.shortId})` : ""}. Puedes revisarla en línea ahora mismo o enviar el mensaje por WhatsApp.
              </>
            ) : (
              <>
                Tu evento cuenta con requerimientos especiales de producción técnica (pantallas, audio o extras). Hemos registrado tu solicitud para revisión personalizada por WhatsApp.
              </>
            )}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {isAutoQuote && submittedResult.proposalUrl && (
            <a
              href={submittedResult.proposalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base rounded-2xl shadow-xl shadow-primary/25 gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-5 h-5" />
                <span>Ver mi Propuesta en Línea</span>
                <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
              </Button>
            </a>
          )}

          <a
            href={submittedResult.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto h-14 px-8 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-base rounded-2xl shadow-xl shadow-[#25D366]/30 gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <WhatsAppIcon className="w-5 h-5 fill-white" />
              <span>{isAutoQuote ? "Confirmar por WhatsApp" : "Continuar por WhatsApp"}</span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
            </Button>
          </a>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setSubmittedResult(null)}
            className="w-full sm:w-auto h-14 px-6 rounded-2xl border-white/15 hover:bg-white/5 text-gray-300 font-bold text-sm cursor-pointer"
          >
            Editar datos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-950/80 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-6">
      {/* Glows de ambientación */}
      <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-[#25D366]/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Banner de paquete pre-seleccionado */}
      {paqueteNombre && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in-0 duration-300 ${
          isFestival 
            ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
            : isExperience
              ? "bg-red-500/10 border-red-500/30 text-red-200"
              : "bg-primary/10 border-primary/30 text-primary-foreground"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isFestival ? "🏆" : isExperience ? "⚡" : "🎸"}</span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider">
                Propuesta Personalizada: {paqueteNombre}
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                {isFestival
                  ? "Configuración tipo concierto con pantalla, templete, robóticas y audio (Mínimo 100 invitados)."
                  : isExperience
                    ? "Producción de audio profesional y monitoreo in-ear para 100 a 300 invitados."
                    : "Show estándar de 2 horas en vivo para eventos sociales."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. NOMBRE Y TELÉFONO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" /> Nombre Completo <span className="text-red-500">*</span>
          </Label>
          <Input
            required
            type="text"
            placeholder="Ej: Mariana Gómez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-primary" /> Teléfono con WhatsApp <span className="text-red-500">*</span>
          </Label>
          <Input
            required
            type="tel"
            placeholder="Ej: 722 123 4567"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
          />
        </div>
      </div>

      {/* 2. TIPO DE CELEBRACIÓN Y FECHA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <PartyPopper className="w-3.5 h-3.5 text-primary" /> Tipo de Celebración <span className="text-red-500">*</span>
          </Label>
          <select
            value={tipoEvento}
            onChange={(e) => setTipoEvento(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer font-medium"
          >
            {EVENT_TYPES.map((ev) => (
              <option key={ev.value} value={ev.value} className="bg-zinc-900 text-white">
                {ev.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha del Evento <span className="text-red-500">*</span>
          </Label>
          <Input
            required
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white text-sm rounded-xl focus:border-primary [color-scheme:dark]"
          />
        </div>

        {tipoEvento === "Otro" && (
          <div className="sm:col-span-2 space-y-1.5 animate-in fade-in-0 duration-150">
            <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Especifica el Motivo de tu Festejo <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              type="text"
              placeholder="Ej: Bautizo, Primera Comunión, Pedida de Mano, Despedida..."
              value={tipoEventoOtro}
              onChange={(e) => setTipoEventoOtro(e.target.value)}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* 3. HORARIO SELECCIONABLE (AM / PM) */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" /> Horario Estimado del Evento <span className="text-red-500">*</span>
        </Label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] text-gray-400 font-medium">Hora de inicio:</span>
            <select
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer font-medium"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={`start-${time}`} value={time} className="bg-zinc-900 text-white">
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-gray-400 font-medium">Hora de término aproximada:</span>
            <select
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer font-medium"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={`end-${time}`} value={time} className="bg-zinc-900 text-white">
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-gray-500">
          Horario seleccionado: <span className="text-primary font-bold">{horaInicio}</span> a <span className="text-primary font-bold">{horaFin}</span>
        </p>
      </div>

      {/* 4. INVITADOS & PRODUCCIÓN ADICIONAL SI >100 */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" /> No. Estimado de Invitados <span className="text-red-500">*</span>
          </Label>
          <Input
            required
            type="number"
            min={isLargePackage ? 100 : 10}
            max={5000}
            step={10}
            placeholder={isLargePackage ? "Mínimo 100 invitados" : "Ej: 50"}
            value={invitados}
            onChange={(e) => setInvitados(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
          />
          {isLargePackage && (
            <p className="text-[11px] text-amber-400 font-semibold mt-1">
              ⚠️ Mínimo 100 invitados por la capacidad técnica del paquete {paqueteNombre}.
            </p>
          )}
        </div>

        {/* Sección condicional cuando hay más de 100 invitados */}
        {tieneMasDe100Invitados && (
          <div className="p-4 sm:p-5 rounded-2xl bg-primary/10 border border-primary/30 space-y-3 animate-in fade-in-0 duration-200">
            <div className="flex items-center gap-2 text-primary text-xs sm:text-sm font-black uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>Por tu aforo ({numInvitados} invitados), ¿te gustaría agregar producción adicional?</span>
            </div>
            <p className="text-xs text-gray-300">
              Para garantizar la mejor cobertura acústica y experiencia visual en espacios grandes, puedes seleccionar los elementos que te interesen:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                { id: "Producción más grande", label: "Producción más grande (Audio de mayor potencia)", icon: Maximize2 },
                { id: "Pantalla LED", label: "Pantalla LED gigante", icon: Tv },
                { id: "Templete / Escenario", label: "Templete / Escenario para banda", icon: Grid },
                { id: "Iluminación adicional", label: "Iluminación adicional (Robóticas)", icon: Lightbulb },
                { id: "Pista iluminada", label: "Pista iluminada", icon: Sparkles },
              ].map(({ id, label, icon: Icon }) => {
                const isSelected = produccionAdicional.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleProduccionItem(id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/20 border-primary text-white shadow-sm shadow-primary/20"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? "border-primary bg-primary text-black" : "border-white/30"}`}>
                      {isSelected && <span className="text-[10px] font-black">✓</span>}
                    </div>
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. UBICACIÓN Y CÁLCULO DE VIÁTICOS */}
      <div className="space-y-3 pt-2">
        <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" /> Ubicación del Evento (Cálculo de Viáticos) <span className="text-red-500">*</span>
        </Label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Selector de Estado */}
          <div className="space-y-1">
            <span className="text-[11px] text-gray-400 font-medium">Estado:</span>
            <select
              value={estado}
              onChange={(e) => handleEstadoChange(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer font-medium"
            >
              {Object.keys(ESTADOS_MUNICIPIOS).map((est) => (
                <option key={est} value={est} className="bg-zinc-900 text-white">
                  {est}
                </option>
              ))}
              <option value="Otro estado" className="bg-zinc-900 text-white">
                Otro estado (Cotización manual)
              </option>
            </select>
          </div>

          {/* Selector de Municipio */}
          <div className="space-y-1">
            <span className="text-[11px] text-gray-400 font-medium">Municipio / Alcaldía:</span>
            <select
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer font-medium"
            >
              {municipiosDisponibles.map((mun) => (
                <option key={mun} value={mun} className="bg-zinc-900 text-white">
                  {mun}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input manual si seleccionó "Otro municipio" */}
        {isMunicipioManual && (
          <div className="space-y-1 animate-in fade-in-0 duration-150">
            <span className="text-[11px] text-gray-400 font-medium">Escribe el nombre del municipio:</span>
            <Input
              required
              type="text"
              placeholder="Ej: Avándaro, Valle de Bravo, Cuautitlán..."
              value={municipioManual}
              onChange={(e) => setMunicipioManual(e.target.value)}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
            />
          </div>
        )}

        {/* Nombre del Salón / Lugar opcional y Link de Maps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] text-gray-400 font-medium">Nombre del salón, hacienda o jardín (Opcional):</span>
            <Input
              type="text"
              placeholder="Ej: Hacienda San Martín, Jardín La Concordia..."
              value={lugarEvento}
              onChange={(e) => setLugarEvento(e.target.value)}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-primary" /> Link de Google Maps (Opcional):
            </span>
            <Input
              type="url"
              placeholder="Ej: https://maps.app.goo.gl/... o enlace de ubicación"
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
            />
          </div>
        </div>

        {/* Resultado del Cálculo de Viáticos */}
        <div className="mt-2">
          {loadingViaticos ? (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Calculando viáticos para {isMunicipioManual ? municipioManual || "tu destino" : municipio}...</span>
            </div>
          ) : viaticos ? (
            <div
              className={`p-4 rounded-xl border transition-all ${
                !viaticos.isOutsideZone || viaticos.amount === 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-200"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Car className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {!viaticos.isOutsideZone || viaticos.amount === 0 ? (
                    <span className="font-bold text-sm">✅ Zona Local (Toluca, Metepec y alrededores) — Sin costo de viáticos ($0 MXN)</span>
                  ) : viaticos.requiresManualQuote ? (
                    <span className="font-bold text-sm">📍 Destino extendido (&gt;250 km) — Sujeto a cotización logística especial</span>
                  ) : (
                    <>
                      <div className="font-black text-sm sm:text-base text-white">
                        🚗 Viáticos estimados: <span className="text-primary">{MXN(viaticos.amount)} MXN</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed pt-0.5">
                        Incluye casetas ida y vuelta y gasto de gasolina para 2 camionetas y el transporte de 5 personas.
                      </p>
                    </>
                  )}
                  {viaticos.distanceKm > 0 && (
                    <p className="text-[11px] text-gray-400 pt-0.5">
                      Distancia estimada: ~{viaticos.distanceKm.toFixed(0)} km por trayecto
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Nota obligatoria de viáticos */}
          <div className="mt-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300/90 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-amber-200">Nota importante:</span> No incluye planta de luz. Viáticos calculados para 2 camionetas (gasolina y casetas únicamente). No incluye alimentos.
            </div>
          </div>
        </div>
      </div>

      {/* 6. NOTAS O PETICIONES ESPECIALES */}
      <div className="space-y-1.5 pt-2">
        <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          Comentarios o Peticiones Especiales (Opcional)
        </Label>
        <textarea
          rows={3}
          placeholder="¿Alguna canción especial para vals, detalles del salón, temas de audio o logística?"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
        />
      </div>

      {/* 7. BOTÓN PRINCIPAL */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-16 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-lg rounded-2xl shadow-xl shadow-[#25D366]/30 gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Preparando Propuesta...</span>
            </>
          ) : (
            <>
              <WhatsAppIcon className="w-6 h-6 fill-white shrink-0" />
              <span>Enviar Cotización por WhatsApp</span>
              <ArrowRight className="w-5 h-5 ml-auto opacity-70" />
            </>
          )}
        </Button>
        <p className="text-[11px] text-center text-gray-400 mt-2.5">
          ⚡ Al enviar, se abrirá WhatsApp con todos tus datos listos en un mensaje ordenado para confirmar disponibilidad de inmediato.
        </p>
      </div>
    </form>
  )
}
