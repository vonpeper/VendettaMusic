"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"
import { submitPublicQuoteAction, saveQuoteDraftAction } from "@/actions/quote-direct"
import {
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
  ExternalLink,
  Car,
  Music,
  RotateCcw,
  Check,
  Building2,
  PhoneCall,
  Sliders,
  ChevronDown,
  ChevronUp
} from "lucide-react"

interface DirectQuoteFormProps {
  adminWhatsapp?: string | null
  initialPackage?: string | null
  initialDate?: string | null
}

const LOCAL_STORAGE_KEY = "vendetta_quote_single_v1"

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
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM",
  "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM",
  "11:00 PM", "11:30 PM", "12:00 AM", "12:30 AM",
  "01:00 AM", "01:30 AM", "02:00 AM"
]

const QUICK_GUEST_OPTIONS = [50, 80, 100, 150, 250, 350]

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

export function DirectQuoteForm({ adminWhatsapp, initialDate }: DirectQuoteFormProps) {
  // --- Datos del Evento y Contacto ---
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [fecha, setFecha] = useState(initialDate || "")
  const [estado, setEstado] = useState("Estado de México")
  const [municipio, setMunicipio] = useState("Metepec")
  const [municipioManual, setMunicipioManual] = useState("")
  const [tipoEvento, setTipoEvento] = useState("Boda")
  const [tipoEventoOtro, setTipoEventoOtro] = useState("")
  const [invitados, setInvitados] = useState("80")

  // --- Parámetros de Show (para aforo <= 100) ---
  const [horasShow, setHorasShow] = useState<2 | 3 | 4>(2)
  const [horaInicio, setHoraInicio] = useState("08:00 PM")
  const [horaFin, setHoraFin] = useState("10:00 PM")

  // --- Campos Adicionales (Venue y Notas opcionales) ---
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [lugarEvento, setLugarEvento] = useState("")
  const [mapsLink, setMapsLink] = useState("")
  const [notas, setNotas] = useState("")

  // --- Identificador de Lead en BD ---
  const [inquiryId, setInquiryId] = useState<string | null>(null)
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

  // --- Estado de Envío ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedResult, setSubmittedResult] = useState<{
    mode: "auto_quote" | "lead_captured"
    shortId?: string
    proposalUrl?: string
    waUrl: string
  } | null>(null)

  // Aforo numérico en tiempo real
  const numInvitados = parseInt(invitados, 10) || 80
  const isLargeProduction = numInvitados > 100 // UMBRAL ESTRICTO: 100 PERSONAS

  // 1. Restauración desde LocalStorage
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
        if (parsed.horasShow && [2, 3, 4].includes(parsed.horasShow)) setHorasShow(parsed.horasShow)
        if (parsed.horaInicio) setHoraInicio(parsed.horaInicio)
        if (parsed.horaFin) setHoraFin(parsed.horaFin)
        if (parsed.lugarEvento) setLugarEvento(parsed.lugarEvento)
        if (parsed.mapsLink) setMapsLink(parsed.mapsLink)
        if (parsed.notas) setNotas(parsed.notas)
        if (parsed.inquiryId) setInquiryId(parsed.inquiryId)
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

  // 2. Persistir en LocalStorage
  const persistState = useCallback(
    (newInquiryId?: string) => {
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
          horasShow,
          horaInicio,
          horaFin,
          lugarEvento,
          mapsLink,
          notas,
          inquiryId: newInquiryId ?? inquiryId,
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
      horasShow,
      horaInicio,
      horaFin,
      lugarEvento,
      mapsLink,
      notas,
      inquiryId,
    ]
  )

  useEffect(() => {
    persistState()
  }, [persistState, nombre, telefono, fecha, invitados, horasShow, horaInicio, horaFin])

  // 3. Guardado en segundo plano (Debounce en BD) para no perder ningún prospecto
  const draftTimerRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    const cleanPhoneStr = telefono.replace(/\D/g, "")
    const cleanName = nombre.trim()
    const muniFinal = municipio === "Otro municipio / cotización manual" || municipio === "Otro municipio"
      ? municipioManual.trim()
      : municipio.trim()

    // Solo guardar automáticamente si hay datos mínimos de contacto y fecha
    if (cleanName.length >= 3 && cleanPhoneStr.length >= 10 && fecha && muniFinal) {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)

      draftTimerRef.current = setTimeout(async () => {
        try {
          const res = await saveQuoteDraftAction({
            nombre: cleanName,
            telefono: cleanPhoneStr,
            fecha,
            municipio: muniFinal,
            estado,
            invitados: numInvitados,
            tipoEvento: tipoEvento === "Otro" ? tipoEventoOtro.trim() || "Otro" : tipoEvento,
            inquiryId: inquiryId || undefined,
          })
          if (res.success && res.inquiryId && res.inquiryId !== inquiryId) {
            setInquiryId(res.inquiryId)
            persistState(res.inquiryId)
          }
        } catch (err) {
          console.warn("Error al registrar borrador silencioso:", err)
        }
      }, 1200)
    }

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    }
  }, [nombre, telefono, fecha, municipio, municipioManual, estado, numInvitados, tipoEvento, tipoEventoOtro, inquiryId, persistState])

  // Reiniciar formulario
  const handleReset = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch {
      // ignore
    }
    setNombre("")
    setTelefono("")
    setFecha(initialDate || "")
    setEstado("Estado de México")
    setMunicipio("Metepec")
    setMunicipioManual("")
    setTipoEvento("Boda")
    setTipoEventoOtro("")
    setInvitados("80")
    setHorasShow(2)
    setHoraInicio("08:00 PM")
    setHoraFin("10:00 PM")
    setLugarEvento("")
    setMapsLink("")
    setNotas("")
    setInquiryId(null)
    setSubmittedResult(null)
    setHasRestoredDraft(false)
    toast.info("Cotizador reiniciado. Puedes comenzar de nuevo.")
  }

  // Municipios según estado
  const municipiosDisponibles = ESTADOS_MUNICIPIOS[estado] || ["Otro municipio / cotización manual"]
  const isMunicipioManual =
    municipio === "Otro municipio / cotización manual" || municipio === "Otro municipio"

  const handleEstadoChange = (nuevoEstado: string) => {
    setEstado(nuevoEstado)
    const primerMuni = ESTADOS_MUNICIPIOS[nuevoEstado]?.[0] || "Otro municipio / cotización manual"
    setMunicipio(primerMuni)
    setMunicipioManual("")
  }

  // Sincronizar hora fin cuando cambia horasShow o horaInicio
  const handleHorasShowChange = (newHours: 2 | 3 | 4) => {
    setHorasShow(newHours)
    const startIdx = TIME_OPTIONS.indexOf(horaInicio)
    if (startIdx !== -1) {
      const stepIntervals = Math.round(newHours * 2)
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

  // Cálculos financieros (Solo aplicables cuando aforo <= 100)
  const baseEssentialPrice = useMemo(() => {
    return calculateShowPackageBasePrice("Essential", horasShow)
  }, [horasShow])

  const isOutsideZone = viaticos?.isOutsideZone ?? false
  const showBasePrice = useMemo(() => {
    return calculateShowBasePrice(baseEssentialPrice, isOutsideZone)
  }, [baseEssentialPrice, isOutsideZone])

  const viaticosAmount = viaticos?.amount || 0
  const totalEstimado = showBasePrice + viaticosAmount

  // --- ENVÍO DEL FORMULARIO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanName = nombre.trim()
    const cleanPhoneStr = telefono.replace(/\D/g, "")
    const muniFinal = isMunicipioManual ? municipioManual.trim() : municipio.trim()

    if (!cleanName) {
      toast.error("Por favor ingresa tu nombre completo.")
      return
    }

    if (cleanPhoneStr.length < 10) {
      toast.error("El número de WhatsApp debe tener al menos 10 dígitos (ej. 722 123 4567).")
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

    setIsSubmitting(true)

    const cleanAdminPhone = (
      adminWhatsapp ||
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
      "5217222880045"
    ).replace(/\D/g, "")

    const tipoEventoFinal =
      tipoEvento === "Otro"
        ? tipoEventoOtro.trim()
          ? `Otro (${tipoEventoOtro.trim()})`
          : "Otro"
        : tipoEvento

    let quoteResult: any = null
    try {
      quoteResult = await submitPublicQuoteAction({
        nombre: cleanName,
        telefono: cleanPhoneStr,
        tipoEvento: tipoEventoFinal,
        fecha,
        horaInicio,
        horaFin,
        horasShow: isLargeProduction ? 2 : horasShow,
        invitados: numInvitados,
        produccionAdicional: [],
        estado,
        municipio: muniFinal,
        lugarEvento: lugarEvento.trim() || undefined,
        mapsLink: mapsLink.trim() || undefined,
        viaticos: isLargeProduction ? null : viaticos,
        paquete: isLargeProduction ? "Producción Especial" : "Essential",
        notas: notas.trim() || undefined,
        inquiryId: inquiryId || undefined,
      })
    } catch (saveErr) {
      console.warn("Quote submit error:", saveErr)
    }

    // Armar mensaje WhatsApp para el cliente al hacer clic
    const fechaFormateada = formatFechaEspanol(fecha) || fecha
    const horarioCompleto = `${horaInicio} a ${horaFin} (${horasShow} Horas de Show en Vivo)`
    const ubicacionCompleta = `${muniFinal}, ${estado}${lugarEvento.trim() ? ` (${lugarEvento.trim()})` : ""}`

    let waMessage = ""
    let proposalFullUrl: string | undefined = undefined

    if (isLargeProduction) {
      // CASO 2: > 100 PAX (Agendar llamada técnica de producción)
      const lineas = [
        "¡Hola Vendetta Live Music! 👋🎸",
        "Completé la solicitud para mi evento en la web y me gustaría agendar una llamada técnica de producción:",
        "",
        "📋 *DETALLES DEL EVENTO*",
        `• *Cliente:* ${cleanName}`,
        `• *WhatsApp:* ${cleanPhoneStr}`,
        `• *Tipo de Evento:* ${tipoEventoFinal}`,
        `• *Fecha:* ${fechaFormateada}`,
        `• *Aforo estimado:* ${numInvitados} personas (>100 pax)`,
        `• *Ubicación:* ${ubicacionCompleta}`,
      ]
      if (mapsLink.trim()) lineas.push(`• *Google Maps:* ${mapsLink.trim()}`)
      if (notas.trim()) lineas.push(`• *Notas:* ${notas.trim()}`)
      lineas.push(
        "",
        "📌 *PRODUCCIÓN ESPECIAL*",
        "• Al ser más de 100 invitados, deseo agendar la llamada técnica para revisar requerimientos de escenario, cobertura de audio e iluminación.",
        "",
        "¿Podemos agendar una llamada breve para revisar disponibilidad? ¡Gracias!"
      )
      waMessage = lineas.join("\n")
    } else {
      // CASO 1: <= 100 PAX (Cotización Directa Essential)
      const isAutoQuote = quoteResult?.mode === "auto_quote" && quoteResult?.shortId
      if (isAutoQuote) {
        proposalFullUrl = `https://vendetta.mx/propuesta/${quoteResult.shortId}`
      }

      let textoViaticos = "Zona local (sin costo adicional de viáticos)"
      if (viaticos && viaticos.amount > 0) {
        textoViaticos = `$${viaticos.amount.toLocaleString("es-MX")} MXN (casetas y combustible)`
      }

      const lineas = [
        "¡Hola Vendetta Live Music! 👋🎸",
        "Acabo de generar la cotización de mi evento con el Paquete Essential:",
        "",
        "📋 *RESUMEN DE COTIZACIÓN (PAQUETE ESSENTIAL)*",
        ...(quoteResult?.shortId ? [`• *Folio:* ${quoteResult.shortId}`] : []),
        `• *Cliente:* ${cleanName}`,
        `• *WhatsApp:* ${cleanPhoneStr}`,
        `• *Tipo de Evento:* ${tipoEventoFinal}`,
        `• *Fecha:* ${fechaFormateada}`,
        `• *Horario:* ${horarioCompleto}`,
        `• *Aforo:* ${numInvitados} personas`,
        `• *Ubicación:* ${ubicacionCompleta}`,
        `• *Show Banda en Vivo:* ${MXN(showBasePrice)} MXN`,
        `• *Logística y Viáticos:* ${textoViaticos}`,
        `• *Total Estimado:* ${MXN(totalEstimado)} MXN`,
      ]
      if (mapsLink.trim()) lineas.push(`• *Google Maps:* ${mapsLink.trim()}`)
      if (notas.trim()) lineas.push(`• *Notas:* ${notas.trim()}`)
      if (proposalFullUrl) {
        lineas.push(
          "",
          "🔗 *Propuesta interactiva en línea:*",
          proposalFullUrl
        )
      }
      lineas.push(
        "",
        "¿Tienen disponible esta fecha para apartarla? ¡Quedo atento!"
      )
      waMessage = lineas.join("\n")
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanAdminPhone}&text=${encodeURIComponent(waMessage)}`

    setSubmittedResult({
      mode: isLargeProduction ? "lead_captured" : "auto_quote",
      shortId: quoteResult?.shortId,
      proposalUrl: proposalFullUrl,
      waUrl,
    })

    setIsSubmitting(false)

    // Limpiar localStorage tras envío para evitar colisiones
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch {
      // ignore
    }

    toast.success(
      isLargeProduction
        ? "¡Solicitud registrada! Abriendo WhatsApp para agendar tu llamada."
        : "¡Cotización lista! Enviando el desglose a tu WhatsApp."
    )
  }

  // --- VISTA DE CONFIRMACIÓN POST-ENVÍO ---
  if (submittedResult) {
    const isLeadCaptured = submittedResult.mode === "lead_captured"

    return (
      <div className="bg-zinc-950/90 border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl backdrop-blur-xl space-y-6 animate-in fade-in-0 duration-300">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg ${
            isLeadCaptured
              ? "bg-purple-500/20 border border-purple-500/40 text-purple-400 shadow-purple-500/20"
              : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-emerald-500/20"
          }`}
        >
          {isLeadCaptured ? <PhoneCall className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight">
            {isLeadCaptured ? "¡Solicitud de Producción Recibida!" : "¡Tu Cotización Está Lista!"}
          </h2>

          <div className="p-3.5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 text-emerald-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 max-w-md mx-auto">
            <WhatsAppIcon className="w-4 h-4 fill-[#25D366] shrink-0" />
            <span>
              {isLeadCaptured
                ? "Un productor de Vendetta revisará la disponibilidad técnica contigo."
                : `Enviamos el desglose formal a tu WhatsApp (${telefono}).`}
            </span>
          </div>

          <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
            {isLeadCaptured ? (
              <>
                Por el aforo de <strong>{numInvitados} invitados</strong>, preparamos un diseño
                técnico a la medida del recinto. Haz clic en el botón inferior para abrir WhatsApp y
                agendar tu llamada de producción técnica.
              </>
            ) : (
              <>
                Generamos tu propuesta con el <strong>Paquete Essential</strong>
                {submittedResult.shortId ? ` (Folio: ${submittedResult.shortId})` : ""}. Estaremos
                asistiéndote directamente por WhatsApp para validar la fecha y resolver cualquier duda.
              </>
            )}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {!isLeadCaptured && submittedResult.proposalUrl && (
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
              <span>{isLeadCaptured ? "Agendar Llamada en WhatsApp" : "Abrir WhatsApp"}</span>
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

  // --- FORMULARIO ÚNICO Y DIRECTO ---
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-950/85 border border-white/10 rounded-3xl p-5 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-7"
    >
      {/* Glows de ambientación */}
      <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-[#25D366]/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Notificación sutil de borrador restaurado */}
      {hasRestoredDraft && (
        <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-between text-xs text-zinc-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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

      {/* Encabezado */}
      <div className="text-center sm:text-left space-y-1">
        <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight">
          Cotiza tu Evento al Instante
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Completa los datos de tu festejo para verificar disponibilidad y obtener tu propuesta formal.
        </p>
      </div>

      {/* BLOQUE 1: DATOS PRINCIPALES DEL EVENTO (GRID 2 COLUMNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre Completo */}
        <div className="space-y-1.5">
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

        {/* WhatsApp */}
        <div className="space-y-1.5">
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
        </div>

        {/* Fecha tentativa */}
        <div className="space-y-1.5">
          <Label htmlFor="fecha" className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            Fecha Tentativa *
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
        <div className="space-y-1.5">
          <Label htmlFor="tipoEvento" className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Tipo de Evento *
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
              placeholder="Especifica el motivo de tu festejo..."
              value={tipoEventoOtro}
              onChange={(e) => setTipoEventoOtro(e.target.value)}
              className="h-10 mt-1.5 bg-zinc-900/90 border-white/15 text-white placeholder:text-zinc-500 rounded-xl text-xs"
            />
          )}
        </div>

        {/* Estado */}
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
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
              className="h-10 mt-1.5 bg-zinc-900/90 border-white/15 text-white placeholder:text-zinc-500 rounded-xl text-xs"
            />
          )}
        </div>
      </div>

      {/* BLOQUE 2: SELECTOR DE AFORO (INVITADOS) — UMBRAL CRÍTICO A LAS 100 PERSONAS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <Label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Número aproximado de invitados *
            </Label>
            <p className="text-[11px] text-zinc-400">
              Desliza o presiona un botón rápido para configurar el aforo de tu festejo.
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black self-start sm:self-auto ${
              isLargeProduction
                ? "bg-purple-500/15 border border-purple-500/30 text-purple-300"
                : "bg-primary/15 border border-primary/30 text-primary"
            }`}
          >
            <span>{numInvitados} personas</span>
            {isLargeProduction ? (
              <span className="text-[10px] font-semibold text-purple-400">(Producción Especial)</span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-400">(Paquete Essential)</span>
            )}
          </div>
        </div>

        {/* Botones de Selección Rápida */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_GUEST_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setInvitados(opt.toString())}
              className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                numInvitados === opt
                  ? opt <= 100
                    ? "bg-primary border-primary text-black font-black shadow-md shadow-primary/20"
                    : "bg-purple-600 border-purple-500 text-white font-black shadow-md shadow-purple-600/20"
                  : "bg-zinc-900/80 border-white/10 text-zinc-300 hover:text-white hover:border-white/20 text-xs font-bold"
              }`}
            >
              {opt} pax
            </button>
          ))}
        </div>

        {/* Slider continuo */}
        <div className="pt-1">
          <input
            type="range"
            min="20"
            max="500"
            step="5"
            value={numInvitados}
            onChange={(e) => setInvitados(e.target.value)}
            className="w-full accent-primary h-2 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
            <span>20 pax (Íntimo)</span>
            <span className="text-primary font-bold">100 pax (Límite Essential)</span>
            <span className="text-purple-400 font-bold">+100 pax (Producción Especial)</span>
            <span>500 pax</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BIFURCACIÓN COMERCIAL POR AFORO (UMBRAL: 100 PERSONAS)
          ───────────────────────────────────────────────────────────── */}

      {/* CASO 1: AFORO <= 100 (PAQUETE ESSENTIAL - COTIZACIÓN DIRECTA) */}
      {!isLargeProduction && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          {/* Card Paquete Essential */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-primary/40 shadow-xl shadow-primary/10 relative overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-3 h-3" /> Cotización Directa Inmediata
                </div>
                <h3 className="text-lg font-black text-white">Paquete Essential</h3>
                <p className="text-xs text-zinc-300">
                  Audio profesional de alta fidelidad para eventos íntimos / bodas boutique (hasta 100 personas).
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">Base 2 Horas</span>
                <span className="text-xl font-black text-primary">$8,500 MXN</span>
              </div>
            </div>

            {/* Inclusiones Essential */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Banda completa en vivo (4 músicos + voz estelar)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Audio profesional para eventos íntimos / boutique</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Iluminación escénica básica para la banda</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Staff técnico e ingeniero de audio en sala</span>
              </div>
            </div>

            {/* Selector de Horas de Show */}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <Label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Duración de Show Banda en Vivo:
                </span>
                <span className="text-xs text-primary font-bold">{horasShow} Horas de Música</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleHorasShowChange(2)}
                  className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    horasShow === 2
                      ? "bg-primary border-primary text-black font-black shadow-md"
                      : "bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold">2 Horas (Base)</div>
                  <div className="text-[10px] opacity-80">$8,500 MXN</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleHorasShowChange(3)}
                  className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    horasShow === 3
                      ? "bg-primary border-primary text-black font-black shadow-md"
                      : "bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold">3 Horas (+1h)</div>
                  <div className="text-[10px] opacity-80">$13,500 MXN</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleHorasShowChange(4)}
                  className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    horasShow === 4
                      ? "bg-primary border-primary text-black font-black shadow-md"
                      : "bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold">4 Horas (+2h)</div>
                  <div className="text-[10px] opacity-80">$18,500 MXN</div>
                </button>
              </div>
            </div>

            {/* Horario Sugerido */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Hora de inicio:</span>
                <select
                  value={horaInicio}
                  onChange={(e) => handleHoraInicioChange(e.target.value)}
                  className="w-full h-10 bg-zinc-900 border border-white/15 text-white rounded-lg px-2 text-xs focus:border-primary focus:outline-none cursor-pointer"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t} className="bg-zinc-900 text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Hora de término aproximada:</span>
                <select
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full h-10 bg-zinc-900 border border-white/15 text-white rounded-lg px-2 text-xs focus:border-primary focus:outline-none cursor-pointer"
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

          {/* Desglose de Inversión Transparente */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-white/10 pb-2">
              Desglose Estimado de Inversión
            </h4>

            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-primary" />
                Show Banda en Vivo (Paquete Essential - {horasShow}h)
              </span>
              <span className="font-bold text-white">{MXN(showBasePrice)} MXN</span>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-emerald-400" />
                Logística y Viáticos ({municipio}, {estado})
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
                * Destino fuera de zona local: Incluye gastos de casetas ida y vuelta y combustible para transporte de equipo.
              </p>
            )}

            {/* Total Destacado */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-black text-zinc-300 block">
                  Total Estimado
                </span>
                <span className="text-[10px] text-zinc-400">
                  Sin costos ocultos ni intermediarios
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-heading font-black text-primary">
                {MXN(totalEstimado)} <span className="text-xs font-sans text-zinc-400">MXN</span>
              </div>
            </div>
          </div>

          {/* CTA Principal Caso 1: Recibir Cotización por WhatsApp */}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full h-16 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-[#25D366]/30 gap-3 cursor-pointer transition-all hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generando tu cotización formal...</span>
              </>
            ) : (
              <>
                <WhatsAppIcon className="w-6 h-6 fill-white shrink-0" />
                <span>Recibir Cotización por WhatsApp</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* CASO 2: AFORO > 100 (PRODUCCIÓN ESPECIAL - SIN PRECIOS EN PANTALLA) */}
      {isLargeProduction && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <div className="p-6 rounded-2xl bg-purple-950/30 border border-purple-500/40 shadow-xl shadow-purple-500/10 space-y-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
                <Sliders className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
                  Evento de Gran Aforo (+100 Invitados)
                </span>
                <h3 className="text-lg sm:text-xl font-heading font-black text-white">
                  Diseño de Producción Técnica Personalizada
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
                  Tu evento supera los 100 invitados y requiere diseño técnico y de producción
                  personalizado (templete, pantalla LED, iluminación y cobertura de audio según el
                  recinto).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-zinc-300 space-y-1">
              <p className="font-semibold text-white">¿Por qué no mostramos un precio genérico?</p>
              <p className="text-[11px] text-zinc-400">
                En eventos de esta magnitud, las dimensiones del escenario, tiros de sonido y potencia
                eléctrica varían drásticamente entre un salón, hacienda o jardín. Un productor de
                Vendetta revisará contigo los planos y logística para darte la solución exacta sin sobrecostos.
              </p>
            </div>
          </div>

          {/* CTA Principal Caso 2: Agendar llamada técnica por WhatsApp */}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full h-16 bg-purple-600 hover:bg-purple-500 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-purple-600/30 gap-3 cursor-pointer transition-all hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Registrando solicitud de producción...</span>
              </>
            ) : (
              <>
                <PhoneCall className="w-6 h-6 shrink-0" />
                <span>Agendar Llamada Técnica por WhatsApp</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* BLOQUE OPCIONAL: LUGAR ESPECÍFICO Y NOTAS (COLAPSABLE) */}
      <div className="border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="text-xs text-zinc-400 hover:text-white flex items-center justify-between w-full py-1.5 cursor-pointer font-medium"
        >
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            {showOptionalFields
              ? "Ocultar detalles adicionales del recinto"
              : "¿Ya tienes el nombre del salón o hacienda? Agregar detalles opcionales"}
          </span>
          {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showOptionalFields && (
          <div className="mt-3 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3 animate-in fade-in-0 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400 block">Nombre del recinto:</span>
                <Input
                  placeholder="Ej. Hacienda San Martín / Salón Castalia"
                  value={lugarEvento}
                  onChange={(e) => setLugarEvento(e.target.value)}
                  className="h-10 bg-zinc-900 border-white/15 text-white placeholder:text-zinc-500 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400 block">Enlace de Google Maps (si aplica):</span>
                <Input
                  placeholder="https://maps.app.goo.gl/..."
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  className="h-10 bg-zinc-900 border-white/15 text-white placeholder:text-zinc-500 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400 block">Notas o peticiones especiales:</span>
              <textarea
                placeholder="¿Canciones que no pueden faltar o peticiones especiales? Cuéntanos aquí..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-zinc-900 border border-white/15 text-white placeholder:text-zinc-500 rounded-xl text-xs focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Pie de formulario con botón de reinicio discreto */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
        <span className="text-[11px]">Vendetta Live Music · Exclusividad de fecha</span>
        <button
          type="button"
          onClick={handleReset}
          className="hover:text-zinc-300 flex items-center gap-1 cursor-pointer text-xs"
        >
          <RotateCcw className="w-3 h-3" /> Reiniciar formulario
        </button>
      </div>
    </form>
  )
}
