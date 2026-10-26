"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"
import { submitPublicQuoteAction, saveQuoteDraftAction } from "@/actions/quote-direct"
import {
  calculateEventHours,
  calculateShowPackageBasePrice,
  calculateShowBasePrice,
} from "@/lib/pricing"
import { toast } from "sonner"
import { ESTADOS_MUNICIPIOS } from "@/lib/municipios"
import {
  User,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Car,
  Tv,
  Grid,
  Lightbulb,
  Music,
  RadioTower,
  ShieldCheck,
  Zap,
  RotateCcw,
  BadgeCheck,
  Check,
  Info
} from "lucide-react"

interface DirectQuoteFormProps {
  adminWhatsapp?: string | null
  initialPackage?: string | null
  initialDate?: string | null
}

const LOCAL_STORAGE_KEY = "vendetta_quote_draft_v2"

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
  "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
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
  "05:00 AM"
]

const PRODUCCION_ITEMS = [
  {
    id: "Pantalla LED",
    label: "Pantalla LED gigante",
    refPrice: 15000,
    desc: "Pantalla pitch 3.9 para visuales, intros y video sincronizado",
    icon: Tv,
  },
  {
    id: "Pista iluminada",
    label: "Pista iluminada LED",
    refPrice: 7500,
    desc: "Pista de cristal templado con efectos pixel interactivos",
    icon: Sparkles,
  },
  {
    id: "Templete / Escenario",
    label: "Templete / Escenario para banda",
    refPrice: 3800,
    desc: "Tarima profesional nivelada de 4x3m para escenario",
    icon: Grid,
  },
  {
    id: "Iluminación adicional",
    label: "Robóticas y Cabezas Móviles Pro",
    refPrice: 3500,
    desc: "Cabezas móviles beam/spot con programación DMX y humo",
    icon: Lightbulb,
  },
  {
    id: "Robot LED Show",
    label: "Robot LED / Performance interactivo",
    refPrice: 4500,
    desc: "Show sorpresa interactivo con bazuca de CO2 y ambientación",
    icon: Zap,
  },
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
  // --- Paso actual del wizard: 1 (Lead), 2 (Paquete & Rider), 3 (Resumen & WhatsApp) ---
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // --- Lead & Evento (Paso 1) ---
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [tipoEvento, setTipoEvento] = useState("Boda")
  const [tipoEventoOtro, setTipoEventoOtro] = useState("")
  const [fecha, setFecha] = useState(initialDate || "")
  const [estado, setEstado] = useState("Estado de México")
  const [municipio, setMunicipio] = useState("Metepec")
  const [municipioManual, setMunicipioManual] = useState("")
  const [invitados, setInvitados] = useState("80")

  // --- Paquete y Duración (Paso 2) ---
  const [paquete, setPaquete] = useState<"Essential" | "Experience" | "Festival Premium">("Essential")
  const [horasShow, setHorasShow] = useState<number>(2)
  const [djHours, setDjHours] = useState<number>(0)
  const [horaInicio, setHoraInicio] = useState("08:00 PM")
  const [horaFin, setHoraFin] = useState("10:00 PM")
  const [produccionAdicional, setProduccionAdicional] = useState<string[]>([])

  // --- Datos complementarios (Paso 3) ---
  const [lugarEvento, setLugarEvento] = useState("")
  const [mapsLink, setMapsLink] = useState("")
  const [notas, setNotas] = useState("")

  // --- Identificador de Lead Borrador guardado en BD ---
  const [inquiryId, setInquiryId] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)

  // --- Viáticos ---
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

  // --- Estado de Envío Final ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedResult, setSubmittedResult] = useState<{
    mode: "auto_quote" | "needs_review" | "lead_captured"
    proposalUrl?: string
    shortId?: string
    waUrl: string
  } | null>(null)

  // --- Modal / Callout de Apartado con Anticipo (30%) ---
  const [showDepositModal, setShowDepositModal] = useState(false)

  // 1. Restauración desde LocalStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.nombre) setNombre(parsed.nombre)
        if (parsed.telefono) setTelefono(parsed.telefono)
        if (parsed.tipoEvento) setTipoEvento(parsed.tipoEvento)
        if (parsed.tipoEventoOtro) setTipoEventoOtro(parsed.tipoEventoOtro)
        if (!initialDate && parsed.fecha) setFecha(parsed.fecha)
        if (parsed.estado) setEstado(parsed.estado)
        if (parsed.municipio) setMunicipio(parsed.municipio)
        if (parsed.municipioManual) setMunicipioManual(parsed.municipioManual)
        if (parsed.invitados) setInvitados(parsed.invitados)
        if (parsed.paquete) setPaquete(parsed.paquete)
        if (parsed.horasShow) setHorasShow(parsed.horasShow)
        if (typeof parsed.djHours === "number") setDjHours(parsed.djHours)
        if (parsed.horaInicio) setHoraInicio(parsed.horaInicio)
        if (parsed.horaFin) setHoraFin(parsed.horaFin)
        if (Array.isArray(parsed.produccionAdicional)) setProduccionAdicional(parsed.produccionAdicional)
        if (parsed.lugarEvento) setLugarEvento(parsed.lugarEvento)
        if (parsed.mapsLink) setMapsLink(parsed.mapsLink)
        if (parsed.notas) setNotas(parsed.notas)
        if (parsed.inquiryId) setInquiryId(parsed.inquiryId)
        if (parsed.currentStep && [1, 2, 3].includes(parsed.currentStep)) {
          setCurrentStep(parsed.currentStep)
        }
        setHasRestoredDraft(true)
      }
    } catch (e) {
      console.warn("No se pudo restaurar el borrador local:", e)
    }
  }, [initialDate])

  // Sincronizar initialDate si se pasa por prop
  useEffect(() => {
    if (initialDate) setFecha(initialDate)
  }, [initialDate])

  // Sincronizar initialPackage si se pasa por prop
  useEffect(() => {
    if (initialPackage) {
      const lower = initialPackage.toLowerCase()
      if (lower.includes("festival")) setPaquete("Festival Premium")
      else if (lower.includes("experience")) setPaquete("Experience")
      else if (lower.includes("essential")) setPaquete("Essential")
    }
  }, [initialPackage])

  // 2. Persistir en LocalStorage
  const persistState = useCallback(
    (stepOverride?: 1 | 2 | 3, newInquiryId?: string) => {
      try {
        const payload = {
          nombre,
          telefono,
          tipoEvento,
          tipoEventoOtro,
          fecha,
          estado,
          municipio,
          municipioManual,
          invitados,
          paquete,
          horasShow,
          djHours,
          horaInicio,
          horaFin,
          produccionAdicional,
          lugarEvento,
          mapsLink,
          notas,
          inquiryId: newInquiryId ?? inquiryId,
          currentStep: stepOverride ?? currentStep,
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
      } catch (e) {
        console.warn("Error guardando en localStorage:", e)
      }
    },
    [
      nombre,
      telefono,
      tipoEvento,
      tipoEventoOtro,
      fecha,
      estado,
      municipio,
      municipioManual,
      invitados,
      paquete,
      horasShow,
      djHours,
      horaInicio,
      horaFin,
      produccionAdicional,
      lugarEvento,
      mapsLink,
      notas,
      inquiryId,
      currentStep,
    ]
  )

  // Guardar en localStorage cuando cambian selecciones clave
  useEffect(() => {
    persistState()
  }, [
    persistState,
    nombre,
    telefono,
    fecha,
    invitados,
    paquete,
    horasShow,
    djHours,
    produccionAdicional,
  ])

  // Reiniciar cotización y limpiar borrador
  const handleReset = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch {
      // ignore
    }
    setNombre("")
    setTelefono("")
    setTipoEvento("Boda")
    setTipoEventoOtro("")
    setFecha(initialDate || "")
    setEstado("Estado de México")
    setMunicipio("Metepec")
    setMunicipioManual("")
    setInvitados("80")
    setPaquete("Essential")
    setHorasShow(2)
    setDjHours(0)
    setHoraInicio("08:00 PM")
    setHoraFin("10:00 PM")
    setProduccionAdicional([])
    setLugarEvento("")
    setMapsLink("")
    setNotas("")
    setInquiryId(null)
    setCurrentStep(1)
    setSubmittedResult(null)
    setHasRestoredDraft(false)
    toast.info("Cotizador reiniciado. Puedes comenzar de nuevo.")
  }

  // Aforo numérico y sugerencia automática de paquete
  const numInvitados = parseInt(invitados, 10) || 80
  const suggestedPackage = useMemo<"Essential" | "Experience" | "Festival Premium">(() => {
    if (numInvitados <= 100) return "Essential"
    if (numInvitados <= 300) return "Experience"
    return "Festival Premium"
  }, [numInvitados])

  // Lista de municipios según el estado seleccionado
  const municipiosDisponibles = ESTADOS_MUNICIPIOS[estado] || ["Otro municipio / cotización manual"]
  const isMunicipioManual =
    municipio === "Otro municipio / cotización manual" || municipio === "Otro municipio"

  const handleEstadoChange = (nuevoEstado: string) => {
    setEstado(nuevoEstado)
    const primerMuni = ESTADOS_MUNICIPIOS[nuevoEstado]?.[0] || "Otro municipio / cotización manual"
    setMunicipio(primerMuni)
    setMunicipioManual("")
  }

  // Sincronizar hora fin con horas de show cuando cambia inicio o duración
  const handleHorasShowChange = (newHours: number) => {
    setHorasShow(newHours)
    const startIdx = TIME_OPTIONS.indexOf(horaInicio)
    if (startIdx !== -1) {
      const stepIntervals = Math.round(newHours * 2) // 30 min cada slot
      const endIdx = (startIdx + stepIntervals) % TIME_OPTIONS.length
      setHoraFin(TIME_OPTIONS[endIdx])
    }
  }

  const handleHoraInicioChange = (nuevoInicio: string) => {
    setHoraInicio(nuevoInicio)
    const startIdx = TIME_OPTIONS.indexOf(nuevoInicio)
    if (startIdx !== -1) {
      const stepIntervals = Math.round(horasShow * 2)
      const endIdx = (startIdx + stepIntervals) % TIME_OPTIONS.length
      setHoraFin(TIME_OPTIONS[endIdx])
    }
  }

  // Cálculo de viáticos automático según municipio
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

  // Cálculos financieros
  const basePackagePrice = calculateShowPackageBasePrice(paquete, horasShow)
  const isOutsideZone = viaticos?.isOutsideZone ?? false
  const showBasePrice = calculateShowBasePrice(basePackagePrice, isOutsideZone)

  // Costo DJ (800 por hora)
  const djCost = djHours * 800

  // Costo producción adicional
  const extrasCost = produccionAdicional.reduce((sum, item) => {
    const found = PRODUCCION_ITEMS.find((p) => p.id === item)
    return sum + (found?.refPrice || 0)
  }, 0)

  const viaticosAmount = viaticos?.amount || 0
  const totalEstimado = showBasePrice + djCost + extrasCost + viaticosAmount
  const anticipo30Porciento = Math.round(totalEstimado * 0.3)

  // Toggle de extras
  const toggleProduccionItem = (item: string) => {
    setProduccionAdicional((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  // --- TRANSICIÓN PASO 1 -> PASO 2 (Captura Temprana y Borrador en BD) ---
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanName = nombre.trim()
    const cleanPhoneStr = telefono.replace(/\D/g, "")
    const muniFinal = isMunicipioManual ? municipioManual.trim() : municipio.trim()

    if (!cleanName) {
      toast.error("Por favor ingresa tu nombre completo.")
      return
    }

    if (cleanPhoneStr.length < 10) {
      toast.error("El número de WhatsApp debe contener al menos 10 dígitos (ej. 722 123 4567).")
      return
    }

    if (!fecha) {
      toast.error("Por favor selecciona la fecha tentativa de tu evento.")
      return
    }

    if (!muniFinal) {
      toast.error("Por favor especifica el municipio de tu evento.")
      return
    }

    setIsSavingDraft(true)
    let savedInquiryId = inquiryId

    try {
      const draftResult = await saveQuoteDraftAction({
        nombre: cleanName,
        telefono: cleanPhoneStr,
        fecha,
        municipio: muniFinal,
        estado,
        invitados: numInvitados,
        tipoEvento: tipoEvento === "Otro" ? tipoEventoOtro.trim() || "Otro" : tipoEvento,
        inquiryId: inquiryId || undefined,
      })

      if (draftResult.success && draftResult.inquiryId) {
        savedInquiryId = draftResult.inquiryId
        setInquiryId(savedInquiryId)
      }
    } catch (err) {
      console.warn("Aviso al guardar borrador de prospecto:", err)
    } finally {
      setIsSavingDraft(false)
    }

    // Sugerir automáticamente paquete si no venía por prop preseleccionada
    if (!initialPackage) {
      setPaquete(suggestedPackage)
    }

    persistState(2, savedInquiryId || undefined)
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // --- TRANSICIÓN PASO 2 -> PASO 3 ---
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    persistState(3)
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // --- ENVÍO FINAL PASO 3 (WhatsApp + BD) ---
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanAdminPhone = (
      adminWhatsapp ||
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
      "5217222880045"
    ).replace(/\D/g, "")

    const muniFinal = isMunicipioManual ? municipioManual.trim() : municipio.trim()
    const tipoEventoFinal =
      tipoEvento === "Otro"
        ? tipoEventoOtro.trim()
          ? `Otro (${tipoEventoOtro.trim()})`
          : "Otro"
        : tipoEvento

    setIsSubmitting(true)

    // Lista combinada de producción que incluye DJ si se seleccionó
    const produccionFinal = [...produccionAdicional]
    if (djHours > 0) {
      produccionFinal.unshift(`DJ Continuo en descansos (${djHours} Horas)`)
    }

    let quoteResult: any = null
    try {
      quoteResult = await submitPublicQuoteAction({
        nombre: nombre.trim(),
        telefono: telefono.replace(/\D/g, ""),
        tipoEvento: tipoEventoFinal,
        fecha,
        horaInicio,
        horaFin,
        horasShow,
        invitados: numInvitados,
        produccionAdicional: produccionFinal,
        estado,
        municipio: muniFinal,
        lugarEvento: lugarEvento.trim() || undefined,
        mapsLink: mapsLink.trim() || undefined,
        viaticos,
        paquete,
        notas: notas.trim() || undefined,
        inquiryId: inquiryId || undefined,
      })
    } catch (saveErr) {
      console.warn("Quote submit error:", saveErr)
    }

    // Formatear viáticos
    let textoViaticos = "Zona local (sin costo adicional de viáticos)"
    if (viaticos) {
      if (viaticos.requiresManualQuote) {
        textoViaticos = "Distancia extendida (>250 km, logística a la medida)"
      } else if (viaticos.amount > 0) {
        textoViaticos = `$${viaticos.amount.toLocaleString("es-MX")} MXN (casetas y gasolina 2 camionetas)`
      }
    }

    // Armar mensaje WhatsApp
    const fechaFormateada = formatFechaEspanol(fecha) || fecha
    const horarioCompleto = `${horaInicio} a ${horaFin} (${horasShow} Horas de Música en Vivo)`
    const ubicacionCompleta = `${muniFinal}, ${estado}${lugarEvento.trim() ? ` (${lugarEvento.trim()})` : ""}`

    const isAutoQuote = quoteResult?.mode === "auto_quote" && quoteResult?.shortId
    const isLeadCaptured = quoteResult?.mode === "lead_captured" || numInvitados > 120
    const proposalFullUrl = isAutoQuote ? `https://vendetta.mx/propuesta/${quoteResult.shortId}` : null

    const lineasMensaje = [
      "¡Hola Vendetta Live Music! 👋🎸",
      "Completé la cotización de mi evento en la web y me gustaría validar disponibilidad:",
      "",
      "📋 *DETALLES DEL EVENTO*",
      `• *Paquete:* ${paquete}`,
      `• *Cliente:* ${nombre.trim()}`,
      `• *WhatsApp:* ${telefono.trim()}`,
      `• *Tipo de Evento:* ${tipoEventoFinal}`,
      `• *Fecha:* ${fechaFormateada}`,
      `• *Horario:* ${horarioCompleto}`,
      `• *Aforo estimado:* ${numInvitados} invitados`,
      `• *Ubicación:* ${ubicacionCompleta}`,
    ]

    if (djHours > 0) {
      lineasMensaje.push(`• *Música continua:* Servicio de DJ (${djHours} Horas en descansos)`)
    }

    if (produccionAdicional.length > 0) {
      lineasMensaje.push(
        "• *Extras seleccionados:*",
        ...produccionAdicional.map((p) => `  - ${p}`)
      )
    }

    if (mapsLink.trim()) {
      lineasMensaje.push(`• *Google Maps:* ${mapsLink.trim()}`)
    }

    if (isLeadCaptured) {
      lineasMensaje.push(
        "",
        "📌 *EVENTO DE GRAN AFORO (>120 PERSONAS)*",
        "• Me gustaría agendar una llamada técnica con un productor para afinar el rider y recibir la propuesta definitiva."
      )
    } else {
      lineasMensaje.push(
        "",
        "🚗 *LOGÍSTICA Y TOTAL ESTIMADO*",
        `• *Viáticos:* ${textoViaticos}`,
        `• *Inversión Estimada:* ${MXN(totalEstimado)} MXN`
      )
    }

    if (notas.trim()) {
      lineasMensaje.push("", "📝 *Notas o peticiones especiales:*", notas.trim())
    }

    if (isAutoQuote && proposalFullUrl) {
      lineasMensaje.push(
        "",
        "🔗 *Enlace a mi propuesta interactiva:*",
        proposalFullUrl
      )
    }

    lineasMensaje.push("", "¿Tienen disponible esta fecha? ¡Quedo atento a su respuesta!")

    const waMessage = lineasMensaje.join("\n")
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanAdminPhone}&text=${encodeURIComponent(waMessage)}`

    setSubmittedResult({
      mode: quoteResult?.mode || (numInvitados <= 120 ? "auto_quote" : "lead_captured"),
      proposalUrl: proposalFullUrl || undefined,
      shortId: quoteResult?.shortId,
      waUrl,
    })

    setIsSubmitting(false)

    // Limpiar localStorage tras envío exitoso para no dejar datos obsoletos
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch {
      // ignore
    }

    toast.success(
      isAutoQuote
        ? "¡Propuesta lista! Abriendo WhatsApp con tu cotización."
        : isLeadCaptured
        ? "¡Solicitud registrada! Te contactaremos para afinar detalles técnicos."
        : "¡Solicitud recibida! Te esperamos en WhatsApp."
    )
  }

  // --- VISTA DE CONFIRMACIÓN FINAL (SUBMITTED) ---
  if (submittedResult) {
    const isAutoQuote = submittedResult.mode === "auto_quote"
    const isLeadCaptured = submittedResult.mode === "lead_captured" || numInvitados > 120

    return (
      <div className="bg-zinc-950/90 border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl backdrop-blur-xl space-y-6 animate-in fade-in-0 duration-300">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg ${
            isAutoQuote
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-emerald-500/20"
              : isLeadCaptured
              ? "bg-blue-500/20 border border-blue-500/40 text-blue-400 shadow-blue-500/20"
              : "bg-primary/20 border border-primary/40 text-primary shadow-primary/20"
          }`}
        >
          {isAutoQuote ? (
            <CheckCircle2 className="w-9 h-9" />
          ) : (
            <Sparkles className="w-9 h-9" />
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight">
            {isAutoQuote ? "¡Tu Cotización Está Lista!" : "¡Solicitud Recibida con Éxito!"}
          </h2>

          <div className="p-3.5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 text-emerald-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 max-w-md mx-auto">
            <WhatsAppIcon className="w-4 h-4 fill-[#25D366] shrink-0" />
            <span>
              Enviamos el resumen completo directamente a tu WhatsApp (
              <strong>{telefono}</strong>).
            </span>
          </div>

          <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
            {isAutoQuote ? (
              <>
                Generamos tu propuesta interactiva exclusiva
                {submittedResult.shortId ? ` (Folio: ${submittedResult.shortId})` : ""}. Estaremos
                asistiéndote directamente por WhatsApp para validar disponibilidad y resolver cualquier
                inquietud.
              </>
            ) : isLeadCaptured ? (
              <>
                Para un aforo de <strong>{numInvitados} invitados</strong>, diseñamos un rider
                técnico a la medida. Un productor de Vendetta te contactará por WhatsApp para validar
                acústica y proponerte la solución ideal.
              </>
            ) : (
              <>
                Hemos registrado tu solicitud con especificaciones personalizadas y en breve te
                escribiremos por WhatsApp.
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
                <span>Ver Mi Propuesta en Línea</span>
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
              <span>{isLeadCaptured ? "Hablar con Productor" : "Abrir WhatsApp"}</span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
            </Button>
          </a>

          <Button
            variant="outline"
            size="lg"
            onClick={handleReset}
            className="w-full sm:w-auto h-14 px-6 rounded-2xl border-white/15 hover:bg-white/5 text-zinc-300 font-bold text-sm cursor-pointer"
          >
            Nueva cotización
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-950/85 border border-white/10 rounded-3xl p-5 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-8">
      {/* Glows de ambientación */}
      <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-[#25D366]/15 rounded-full blur-[100px] pointer-events-none" />

      {/* --- BARRA DE PROGRESO DE 3 PASOS --- */}
      <div className="relative">
        <div className="flex items-center justify-between gap-2 max-w-xl mx-auto mb-2">
          {/* Step 1 Indicator */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              currentStep === 1
                ? "text-primary"
                : currentStep > 1
                ? "text-emerald-400"
                : "text-zinc-500"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep === 1
                  ? "bg-primary text-black"
                  : currentStep > 1
                  ? "bg-emerald-500 text-black"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "1"}
            </span>
            <span className="hidden sm:inline">1. Tu Evento</span>
          </button>

          {/* Line 1-2 */}
          <div
            className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
              currentStep >= 2 ? "bg-emerald-500/80" : "bg-zinc-800"
            }`}
          />

          {/* Step 2 Indicator */}
          <button
            type="button"
            onClick={() => {
              if (nombre && telefono.replace(/\D/g, "").length >= 10 && fecha) {
                setCurrentStep(2)
              } else {
                toast.info("Completa tus datos del evento para avanzar al catálogo de paquetes.")
              }
            }}
            className={`flex items-center gap-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              currentStep === 2
                ? "text-primary"
                : currentStep > 2
                ? "text-emerald-400"
                : "text-zinc-500"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep === 2
                  ? "bg-primary text-black"
                  : currentStep > 2
                  ? "bg-emerald-500 text-black"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
            </span>
            <span className="hidden sm:inline">2. Personaliza Show</span>
          </button>

          {/* Line 2-3 */}
          <div
            className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
              currentStep === 3 ? "bg-emerald-500/80" : "bg-zinc-800"
            }`}
          />

          {/* Step 3 Indicator */}
          <button
            type="button"
            onClick={() => {
              if (nombre && telefono.replace(/\D/g, "").length >= 10 && fecha) {
                setCurrentStep(3)
              } else {
                toast.info("Completa tus datos y selecciona tu paquete para ver el resumen.")
              }
            }}
            className={`flex items-center gap-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              currentStep === 3 ? "text-primary" : "text-zinc-500"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep === 3 ? "bg-primary text-black" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              3
            </span>
            <span className="hidden sm:inline">3. Inversión y WhatsApp</span>
          </button>
        </div>

        {/* Notificación de borrador restaurado */}
        {hasRestoredDraft && currentStep === 1 && (
          <div className="mt-2 p-2.5 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-primary" />
              Restauramos tu cotización en curso.
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-zinc-400 hover:text-white underline text-xs font-medium cursor-pointer"
            >
              Empezar de cero
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PASO 1: CAPTURA TEMPRANA DE LEAD & FECHA
          ───────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-6 animate-in fade-in-0 duration-300">
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight">
              ¿Dónde y cuándo será tu fiesta?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Ingresa los datos iniciales para mostrarte paquetes sugeridos y validar disponibilidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nombre Completo */}
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Tu Nombre Completo *
              </Label>
              <Input
                id="nombre"
                placeholder="Ej. Roberto Sánchez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="h-12 bg-zinc-900/90 border-white/15 text-white placeholder:text-zinc-500 rounded-xl focus:border-primary text-sm font-medium"
              />
            </div>

            {/* Teléfono / WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                  Número de WhatsApp *
                </span>
                {telefono.replace(/\D/g, "").length >= 10 && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> 10 dígitos listos
                  </span>
                )}
              </Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="Ej. 722 123 4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                className="h-12 bg-zinc-900/90 border-white/15 text-white placeholder:text-zinc-500 rounded-xl focus:border-[#25D366] text-sm font-medium"
              />
              <p className="text-[11px] text-zinc-400">
                Te enviaremos tu propuesta formal y enlace exclusivo por este medio.
              </p>
            </div>

            {/* Fecha tentativa */}
            <div className="space-y-2">
              <Label htmlFor="fecha" className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Fecha Tentativa del Evento *
              </Label>
              <Input
                id="fecha"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="h-12 bg-zinc-900/90 border-white/15 text-white rounded-xl focus:border-primary text-sm font-medium [color-scheme:dark]"
              />
              {fecha && (
                <p className="text-[11px] text-primary/90 font-medium">
                  📅 {formatFechaEspanol(fecha)}
                </p>
              )}
            </div>

            {/* Tipo de Evento */}
            <div className="space-y-2">
              <Label htmlFor="tipoEvento" className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Tipo de Festejo *
              </Label>
              <select
                id="tipoEvento"
                value={tipoEvento}
                onChange={(e) => setTipoEvento(e.target.value)}
                className="w-full h-12 bg-zinc-900/90 border border-white/15 text-white rounded-xl px-3 text-sm font-medium focus:border-primary focus:outline-none cursor-pointer"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-zinc-900 text-white">
                    {t.label}
                  </option>
                ))}
              </select>
              {tipoEvento === "Otro" && (
                <Input
                  placeholder="Especifica el motivo de tu evento..."
                  value={tipoEventoOtro}
                  onChange={(e) => setTipoEventoOtro(e.target.value)}
                  className="h-10 mt-2 bg-zinc-900/90 border-white/15 text-white placeholder:text-zinc-500 rounded-xl text-xs"
                />
              )}
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado" className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Estado *
              </Label>
              <select
                id="estado"
                value={estado}
                onChange={(e) => handleEstadoChange(e.target.value)}
                className="w-full h-12 bg-zinc-900/90 border border-white/15 text-white rounded-xl px-3 text-sm font-medium focus:border-primary focus:outline-none cursor-pointer"
              >
                {Object.keys(ESTADOS_MUNICIPIOS).map((edo) => (
                  <option key={edo} value={edo} className="bg-zinc-900 text-white">
                    {edo}
                  </option>
                ))}
              </select>
            </div>

            {/* Municipio */}
            <div className="space-y-2">
              <Label htmlFor="municipio" className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Municipio o Ciudad *
                </span>
                {loadingViaticos && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Verificando zona...
                  </span>
                )}
              </Label>
              <select
                id="municipio"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className="w-full h-12 bg-zinc-900/90 border border-white/15 text-white rounded-xl px-3 text-sm font-medium focus:border-primary focus:outline-none cursor-pointer"
              >
                {municipiosDisponibles.map((muni) => (
                  <option key={muni} value={muni} className="bg-zinc-900 text-white">
                    {muni}
                  </option>
                ))}
              </select>
              {isMunicipioManual && (
                <Input
                  placeholder="Escribe el nombre de tu municipio o ciudad..."
                  value={municipioManual}
                  onChange={(e) => setMunicipioManual(e.target.value)}
                  className="h-10 mt-2 bg-zinc-900/90 border-white/15 text-white placeholder:text-zinc-500 rounded-xl text-xs"
                />
              )}
            </div>
          </div>

          {/* --- SELECTOR RÁPIDO DE INVITADOS (AFORO) --- */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Número aproximado de invitados *
                </Label>
                <p className="text-[11px] text-zinc-400">
                  Nos permite recomendarte la potencia de audio y producción exacta sin costos innecesarios.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black">
                <span>{numInvitados} invitados</span>
              </div>
            </div>

            {/* Botones de Selección Rápida */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setInvitados("80")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  numInvitados <= 100
                    ? "bg-primary/20 border-primary text-white shadow-lg shadow-primary/15 font-bold"
                    : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                <div className="text-xs font-bold">≤ 100</div>
                <div className="text-[10px] text-zinc-400">Íntimo / Boutique</div>
              </button>

              <button
                type="button"
                onClick={() => setInvitados("200")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  numInvitados > 100 && numInvitados <= 300
                    ? "bg-primary/20 border-primary text-white shadow-lg shadow-primary/15 font-bold"
                    : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                <div className="text-xs font-bold">100 - 300</div>
                <div className="text-[10px] text-zinc-400">Salón o Jardín</div>
              </button>

              <button
                type="button"
                onClick={() => setInvitados("400")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  numInvitados > 300
                    ? "bg-primary/20 border-primary text-white shadow-lg shadow-primary/15 font-bold"
                    : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                <div className="text-xs font-bold">&gt; 300</div>
                <div className="text-[10px] text-zinc-400">Festival / Magno</div>
              </button>
            </div>

            {/* Slider de ajuste fino */}
            <div className="pt-2">
              <input
                type="range"
                min="20"
                max="600"
                step="10"
                value={numInvitados}
                onChange={(e) => setInvitados(e.target.value)}
                className="w-full accent-primary h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>20 pax</span>
                <span>150 pax</span>
                <span>300 pax</span>
                <span>+500 pax</span>
              </div>
            </div>
          </div>

          {/* CTA Paso 1 */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={isSavingDraft}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base rounded-2xl shadow-xl shadow-primary/25 gap-2 cursor-pointer transition-all hover:scale-[1.01]"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparando paquetes sugeridos...</span>
                </>
              ) : (
                <>
                  <span>Ver Paquetes Disponibles</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
            <p className="text-[11px] text-center text-zinc-500 mt-2">
              Sin compromisos. Podrás ajustar la duración y ver precios exactos en el siguiente paso.
            </p>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PASO 2: SIMPLIFICACIÓN DE REGLAS & PAQUETES (RIDER ADECUADO)
          ───────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-6 animate-in fade-in-0 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight">
                Elige tu Paquete y Duración
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Sugerido según tu aforo de <strong>{numInvitados} invitados</strong> en{" "}
                <strong>
                  {isMunicipioManual ? municipioManual || "tu ciudad" : municipio}, {estado}
                </strong>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs text-primary hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Modificar fecha o aforo
            </button>
          </div>

          {/* --- CATÁLOGO DE 3 PAQUETES PRINCIPALES --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Paquete 1: Essential */}
            <div
              onClick={() => setPaquete("Essential")}
              className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                paquete === "Essential"
                  ? "bg-primary/15 border-primary shadow-xl shadow-primary/20 ring-1 ring-primary"
                  : "bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900/90"
              }`}
            >
              {suggestedPackage === "Essential" && (
                <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black tracking-wide uppercase flex items-center gap-1 shadow-md">
                  <BadgeCheck className="w-3 h-3 stroke-[2.5]" /> Recomendado para tu aforo
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Boutique & Íntimo
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      paquete === "Essential"
                        ? "border-primary bg-primary text-black"
                        : "border-zinc-600"
                    }`}
                  >
                    {paquete === "Essential" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Essential</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Audio compacto de alta fidelidad para espacios cerrados o bodas boutique.
                  </p>
                </div>

                <div className="pt-1">
                  <div className="text-xl font-black text-primary">
                    {MXN(calculateShowPackageBasePrice("Essential", horasShow))} MXN
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium">
                    Show de {horasShow} horas (Base 2h: $8,500 + $5,000/h extra)
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Banda completa en vivo (4 músicos + voz)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Rider de audio estéreo para hasta 100 pax</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Iluminación escénica básica para la banda</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Staff técnico e ingeniero de sonido</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Paquete 2: Experience */}
            <div
              onClick={() => setPaquete("Experience")}
              className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                paquete === "Experience"
                  ? "bg-primary/15 border-primary shadow-xl shadow-primary/20 ring-1 ring-primary"
                  : "bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900/90"
              }`}
            >
              {suggestedPackage === "Experience" && (
                <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black tracking-wide uppercase flex items-center gap-1 shadow-md">
                  <BadgeCheck className="w-3 h-3 stroke-[2.5]" /> Recomendado para tu aforo
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    El más contratado
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      paquete === "Experience"
                        ? "border-primary bg-primary text-black"
                        : "border-zinc-600"
                    }`}
                  >
                    {paquete === "Experience" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Experience</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Audio lineal con refuerzo de subwoofers dobles e iluminación show pro.
                  </p>
                </div>

                <div className="pt-1">
                  <div className="text-xl font-black text-primary">
                    {MXN(calculateShowPackageBasePrice("Experience", horasShow))} MXN
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium">
                    Show de {horasShow} horas (Base 2h: $15,500 + $7,750/h extra)
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Todo lo incluido en Essential</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Rider de audio lineal para 100 - 300 pax</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Robóticas y cabezas móviles sincronizadas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Monitoreo personal inalámbrico (In-Ears)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Paquete 3: Festival Premium */}
            <div
              onClick={() => setPaquete("Festival Premium")}
              className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                paquete === "Festival Premium"
                  ? "bg-primary/15 border-primary shadow-xl shadow-primary/20 ring-1 ring-primary"
                  : "bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900/90"
              }`}
            >
              {suggestedPackage === "Festival Premium" && (
                <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black tracking-wide uppercase flex items-center gap-1 shadow-md">
                  <BadgeCheck className="w-3 h-3 stroke-[2.5]" /> Recomendado para tu aforo
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Magno Impacto
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      paquete === "Festival Premium"
                        ? "border-primary bg-primary text-black"
                        : "border-zinc-600"
                    }`}
                  >
                    {paquete === "Festival Premium" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Festival Premium</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Rider para festivales, templete, pantalla LED y potencia concert-grade.
                  </p>
                </div>

                <div className="pt-1">
                  <div className="text-xl font-black text-primary">
                    {MXN(calculateShowPackageBasePrice("Festival Premium", horasShow))} MXN
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium">
                    Show de {horasShow} horas (Base 2h: $25,500 + $12,750/h extra)
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Rider masivo para +300 personas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Pantalla LED gigante y visuales dinámicos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Templete / Escenario profesional de 4x3m</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Doble operador técnico de sala y monitores</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- DURACIÓN DEL SHOW & HORARIOS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Horas de Banda */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
              <Label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-primary" />
                  Duración de Show Banda en Vivo *
                </span>
                <span className="text-xs text-primary font-bold">{horasShow} Horas de Música</span>
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHorasShowChange(h)}
                    className={`py-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      horasShow === h
                        ? "bg-primary border-primary text-black font-black shadow-md"
                        : "bg-zinc-900/80 border-white/10 text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    <div className="text-xs font-bold">{h}h</div>
                    <div className="text-[10px] opacity-80">{h === 2 ? "Estándar" : `+${h - 2}h`}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400">
                La duración mínima de show para garantizar máxima energía y repertorio es de 2 horas.
              </p>
            </div>

            {/* Servicio de DJ en descansos / Intermedios */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
              <Label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <RadioTower className="w-3.5 h-3.5 text-blue-400" />
                  Música Continua / DJ en Intermedios
                </span>
                <span className="text-xs text-blue-400 font-bold">
                  {djHours === 0 ? "Sin DJ" : `${djHours}h DJ (+${MXN(djCost)})`}
                </span>
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((dh) => (
                  <button
                    key={dh}
                    type="button"
                    onClick={() => setDjHours(dh)}
                    className={`py-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      djHours === dh
                        ? "bg-blue-600 border-blue-500 text-white font-black shadow-md"
                        : "bg-zinc-900/80 border-white/10 text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    <div className="text-xs font-bold">{dh === 0 ? "Sin DJ" : `${dh}h`}</div>
                    <div className="text-[10px] opacity-80">
                      {dh === 0 ? "Solo banda" : `+$${dh * 800}`}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400">
                DJ profesional para mantener la pista encendida en intermedios ($800/hr).
              </p>
            </div>
          </div>

          {/* Horario Tentativo */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
            <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Horario Tentativo de la Actuación
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-zinc-400 mb-1 block">Hora de inicio tentativa:</span>
                <select
                  value={horaInicio}
                  onChange={(e) => handleHoraInicioChange(e.target.value)}
                  className="w-full h-11 bg-zinc-900 border border-white/15 text-white rounded-xl px-3 text-xs font-medium focus:border-primary focus:outline-none cursor-pointer"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t} className="bg-zinc-900 text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] text-zinc-400 mb-1 block">Hora de término aproximada:</span>
                <select
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full h-11 bg-zinc-900 border border-white/15 text-white rounded-xl px-3 text-xs font-medium focus:border-primary focus:outline-none cursor-pointer"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t} className="bg-zinc-900 text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* --- EXTRAS VISUALES E INTERACTIVOS (OPCIONALES) --- */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Extras Visuales y Efectos Opcionales
              </Label>
              <p className="text-[11px] text-zinc-400">
                Selecciona elementos adicionales para elevar la experiencia visual de tu evento.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRODUCCION_ITEMS.map((item) => {
                const isSelected = produccionAdicional.includes(item.id)
                const ItemIcon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleProduccionItem(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "bg-primary/15 border-primary text-white shadow-md shadow-primary/10"
                        : "bg-zinc-900/60 border-white/10 hover:border-white/20 text-zinc-300"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? "bg-primary text-black" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <ItemIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{item.label}</span>
                        <span className="text-xs font-black text-primary shrink-0">
                          +{MXN(item.refPrice)}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{item.desc}</p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center ${
                        isSelected ? "bg-primary border-primary text-black" : "border-zinc-600"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Botones de navegación Paso 2 */}
          <div className="pt-3 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setCurrentStep(1)}
              className="h-14 sm:w-1/3 rounded-2xl border-white/15 hover:bg-white/5 text-zinc-300 font-bold text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Modificar Datos
            </Button>

            <Button
              type="submit"
              size="lg"
              className="h-14 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base rounded-2xl shadow-xl shadow-primary/25 gap-2 cursor-pointer transition-all hover:scale-[1.01]"
            >
              <span>Continuar al Resumen de Inversión</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PASO 3: PANTALLA DE RESUMEN, TRANSPARENCIA & CONTACTACIÓN
          ───────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in fade-in-0 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight">
                Resumen de Inversión y Disponibilidad
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Revisa el desglose completo. Al hacer clic, recibirás la cotización formal por WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="text-xs text-primary hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Modificar paquete o extras
            </button>
          </div>

          {/* --- TARJETA DE RESUMEN DEL EVENTO --- */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">
                Fecha
              </span>
              <span className="font-bold text-white block mt-0.5">
                {formatFechaEspanol(fecha) || fecha}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">
                Lugar
              </span>
              <span className="font-bold text-white block mt-0.5">
                {isMunicipioManual ? municipioManual || "Municipio manual" : municipio}, {estado}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">
                Aforo
              </span>
              <span className="font-bold text-white block mt-0.5">{numInvitados} personas</span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">
                Horario
              </span>
              <span className="font-bold text-white block mt-0.5">
                {horaInicio} - {horaFin} ({horasShow}h)
              </span>
            </div>
          </div>

          {/* --- DESGLOSE DE INVERSIÓN TRANSPARENTE --- */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-white/10 pb-2">
              Desglose Estimado de Inversión
            </h3>

            <div className="space-y-2 text-xs">
              {/* Show base */}
              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-primary" />
                  Show Banda en Vivo — Paquete <strong>{paquete}</strong> ({horasShow} Horas)
                </span>
                <span className="font-bold text-white">{MXN(showBasePrice)} MXN</span>
              </div>

              {/* DJ */}
              {djHours > 0 && (
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <RadioTower className="w-3.5 h-3.5 text-blue-400" />
                    Música Continua / DJ en intermedios ({djHours} Horas)
                  </span>
                  <span className="font-bold text-white">+{MXN(djCost)} MXN</span>
                </div>
              )}

              {/* Extras individuales */}
              {produccionAdicional.map((item) => {
                const found = PRODUCCION_ITEMS.find((p) => p.id === item)
                return (
                  <div key={item} className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 pl-2">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {item}
                    </span>
                    <span className="font-bold text-white">
                      +{MXN(found?.refPrice || 0)} MXN
                    </span>
                  </div>
                )
              })}

              {/* Viáticos */}
              <div className="flex items-center justify-between text-zinc-300 pt-1 border-t border-white/5">
                <span className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  Viáticos y Logística de Transporte (Toluca / Zona)
                </span>
                <span className="font-bold text-white">
                  {loadingViaticos ? (
                    <span className="text-zinc-500 font-normal">Calculando...</span>
                  ) : viaticos?.amount && viaticos.amount > 0 ? (
                    `+${MXN(viaticos.amount)} MXN`
                  ) : (
                    <span className="text-emerald-400 font-semibold">$0 MXN (Zona Local)</span>
                  )}
                </span>
              </div>

              {isOutsideZone && (
                <p className="text-[10px] text-amber-300/80 pl-5">
                  * Destino foráneo: Incluye logística extendida de transporte para 2 camionetas de equipo.
                </p>
              )}
            </div>

            {/* Total Destacado */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs uppercase tracking-wider font-black text-zinc-300">
                  Total Estimado
                </span>
                {numInvitados > 120 ? (
                  <p className="text-[11px] text-blue-300">
                    Referencial: al superar 120 pax, un productor afinará el rider definitivo.
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-400">
                    Propuesta formal sujeta a confirmación de disponibilidad en agenda.
                  </p>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-heading font-black text-primary">
                {MXN(totalEstimado)} <span className="text-xs font-sans text-zinc-400">MXN</span>
              </div>
            </div>
          </div>

          {/* --- DATOS ADICIONALES OPCIONALES (VENUE & NOTAS) --- */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
            <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Detalles Específicos del Recinto (Opcional)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Nombre del salón, hacienda o jardín..."
                value={lugarEvento}
                onChange={(e) => setLugarEvento(e.target.value)}
                className="h-11 bg-zinc-900 border-white/15 text-white placeholder:text-zinc-500 rounded-xl text-xs"
              />
              <Input
                placeholder="Enlace de Google Maps (si ya lo tienes)..."
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                className="h-11 bg-zinc-900 border-white/15 text-white placeholder:text-zinc-500 rounded-xl text-xs"
              />
            </div>

            <textarea
              placeholder="¿Canciones que no pueden faltar o peticiones especiales para tu evento? Cuéntanos aquí..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full p-3 bg-zinc-900 border border-white/15 text-white placeholder:text-zinc-500 rounded-xl text-xs focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {/* --- BOTÓN CTA PRINCIPAL (WHATSAPP FORMAL) --- */}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full h-16 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-[#25D366]/30 gap-3 cursor-pointer transition-all hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Generando tu propuesta formal...</span>
                </>
              ) : (
                <>
                  <WhatsAppIcon className="w-6 h-6 fill-white shrink-0" />
                  <span>Recibir Cotización Formal y Disponibilidad por WhatsApp</span>
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </>
              )}
            </Button>

            {/* --- OPCIÓN SECUNDARIA DISCRETA: APARTADO CON ANTICIPO (30%) --- */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/50 border border-white/10 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  ¿Quieres asegurar la fecha de inmediato? <strong>Apartado con anticipo del 30% ({MXN(anticipo30Porciento)})</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositModal(true)}
                className="text-primary hover:underline font-bold text-xs shrink-0 cursor-pointer"
              >
                Ver condiciones de apartado
              </button>
            </div>
          </div>

          {/* Modal / Callout Informativo de Apartado */}
          {showDepositModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-heading font-black text-lg">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Garantía de Fecha Vendetta
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="text-zinc-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg bg-zinc-900"
                  >
                    ✕ Cerrar
                  </button>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Vendetta Live Music reserva únicamente <strong>un evento por fecha</strong> para garantizar
                  la máxima concentración, puntualidad y rendimiento escénico de nuestro equipo.
                </p>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Inversión Total Estimada:</span>
                    <span className="text-white font-bold">{MXN(totalEstimado)} MXN</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold border-t border-white/10 pt-1.5">
                    <span>Anticipo de Bloqueo (30%):</span>
                    <span>{MXN(anticipo30Porciento)} MXN</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Saldo restante:</span>
                    <span>{MXN(totalEstimado - anticipo30Porciento)} MXN el día del show</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400">
                  El apartado se formaliza con contrato digital de prestación de servicios y comprobante de
                  transferencia fiscal o pago protegido.
                </p>

                <Button
                  type="button"
                  onClick={(e) => {
                    setShowDepositModal(false)
                    handleFinalSubmit(e)
                  }}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs rounded-xl"
                >
                  Continuar y Validar Disponibilidad de Fecha
                </Button>
              </div>
            </div>
          )}

          {/* Navegación y reinicio */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a paquetes
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reiniciar cotizador
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
