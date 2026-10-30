"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"
import { submitPublicQuoteAction, saveQuoteDraftAction } from "@/actions/quote-direct"
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
  Copy,
  Check,
  Building2,
  Music2,
  ArrowRight
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface DirectQuoteFormProps {
  adminWhatsapp?: string | null
  initialPackage?: string | null
  initialDate?: string | null
}

const EVENT_TYPES = [
  { value: "Boda", label: "💒 Boda" },
  { value: "XV Años", label: "👸 XV Años" },
  { value: "Corporativo", label: "🏢 Corporativo" },
  { value: "Cumpleaños / Aniversario", label: "🎂 Cumpleaños" },
  { value: "Graduación", label: "🎓 Graduación" },
  { value: "Fiesta Privada", label: "🎸 Fiesta Privada" },
  { value: "Otro", label: "✨ Otro Motivo" },
]

const GUEST_RANGES = [
  { label: "< 100 pax", desc: "Íntimo / Boutique", value: 80 },
  { label: "100 - 300 pax", desc: "Salón / Gran Celebración", value: 200 },
  { label: "+300 pax", desc: "Festival / Gran Escala", value: 400 },
]

const PACKAGE_FORMATS = [
  {
    id: "essential",
    name: "Essential",
    headline: "Boutique & Íntimo",
    description: "Formato acústico y compacto para eventos íntimos y bodas boutique (hasta 100 pax).",
    badge: "Hasta 100 pax"
  },
  {
    id: "experience",
    name: "Experience",
    headline: "Full Band & Salón",
    description: "Show completo con refuerzo de audio y diseño de iluminación para salones (100 a 300 pax).",
    badge: "100 - 300 pax"
  },
  {
    id: "festival",
    name: "Festival",
    headline: "Concert-Grade",
    description: "Producción de gran escala con templete, pantalla e ingeniería de audio (+300 pax).",
    badge: "+300 pax"
  },
  {
    id: "definir",
    name: "Por Definir",
    headline: "Asesoría Técnica",
    description: "No estoy seguro, deseo que el equipo me oriente según las características del recinto.",
    badge: "Personalizado"
  }
]

const TIME_OPTIONS = [
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM",
  "12:00 AM", "01:00 AM", "02:00 AM"
]

export function DirectQuoteForm({ adminWhatsapp, initialPackage, initialDate }: DirectQuoteFormProps) {
  // Datos de Contacto
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")

  // Datos del Evento
  const [tipoEvento, setTipoEvento] = useState("Boda")
  const [fecha, setFecha] = useState(initialDate || "")
  const [horaInicio, setHoraInicio] = useState("09:00 PM")
  const [horaFin, setHoraFin] = useState("11:00 PM")
  const [horasShow, setHorasShow] = useState<number>(2)

  // Ubicación y Aforo
  const [estado, setEstado] = useState("Estado de México")
  const [municipio, setMunicipio] = useState("Metepec")
  const [municipioManual, setMunicipioManual] = useState("")
  const [lugarEvento, setLugarEvento] = useState("")
  const [invitados, setInvitados] = useState<number>(200)

  // Formato de interés
  const resolveInitialPkg = () => {
    if (!initialPackage) return "experience"
    const p = initialPackage.toLowerCase()
    if (p.includes("essential")) return "essential"
    if (p.includes("festival")) return "festival"
    if (p.includes("experience")) return "experience"
    return "experience"
  }
  const [paquete, setPaquete] = useState<string>(resolveInitialPkg())
  const [notas, setNotas] = useState("")

  // Estados de proceso
  const [inquiryId, setInquiryId] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<{
    shortId: string
    nombre: string
    motivo: string
    fecha: string
    municipio: string
  } | null>(null)
  const [copiedFolio, setCopiedFolio] = useState(false)

  // Lista de municipios según el estado seleccionado
  const municipiosDisponibles = useMemo(() => {
    return ESTADOS_MUNICIPIOS[estado] || ["Toluca", "Metepec", "Otro municipio / cotización manual"]
  }, [estado])

  // Fecha mínima: mañana
  const minDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split("T")[0]
  }, [])

  // Auto-guardado de borrador cuando ingresa nombre y 10 dígitos de WhatsApp
  const cleanPhone = telefono.replace(/\D/g, "")
  const isPhoneValid = cleanPhone.length === 10
  const draftTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (nombre.trim().length >= 3 && isPhoneValid) {
      if (draftTimer.current) clearTimeout(draftTimer.current)
      draftTimer.current = setTimeout(async () => {
        try {
          const res = await saveQuoteDraftAction({
            nombre: nombre.trim(),
            telefono: cleanPhone,
            fecha: fecha || undefined,
            municipio: municipio === "Otro municipio / cotización manual" ? municipioManual : municipio,
            estado,
            invitados,
            tipoEvento,
            inquiryId
          })
          if (res.success && res.inquiryId) {
            setInquiryId(res.inquiryId)
          }
        } catch {
          // Fallo silencioso en borrador
        }
      }, 1200)
    }
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current)
    }
  }, [nombre, cleanPhone, isPhoneValid, fecha, municipio, municipioManual, estado, invitados, tipoEvento, inquiryId])

  // Manejo del Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      toast.error("Por favor ingresa tu nombre completo.")
      return
    }

    if (!isPhoneValid) {
      toast.error("Por favor ingresa un número de WhatsApp válido de 10 dígitos.")
      return
    }

    if (!fecha) {
      toast.error("Por favor selecciona la fecha tentativa de tu evento.")
      return
    }

    const finalMunicipio = municipio === "Otro municipio / cotización manual" 
      ? municipioManual.trim() 
      : municipio

    if (!finalMunicipio) {
      toast.error("Por favor especifica el municipio o ciudad de tu evento.")
      return
    }

    setIsSubmitting(true)

    try {
      const selectedPkgObj = PACKAGE_FORMATS.find(p => p.id === paquete)
      const selectedPkgLabel = selectedPkgObj?.name || "Experience"

      const res = await submitPublicQuoteAction({
        nombre: nombre.trim(),
        telefono: cleanPhone,
        tipoEvento,
        fecha,
        horaInicio,
        horaFin,
        horasShow,
        invitados,
        estado,
        municipio: finalMunicipio,
        lugarEvento: lugarEvento.trim() || undefined,
        paquete: selectedPkgLabel,
        notas: notas.trim() || undefined,
        inquiryId
      })

      if (res.success && res.shortId) {
        setSubmittedData({
          shortId: res.shortId,
          nombre: res.clientName || nombre.trim(),
          motivo: res.motivo || tipoEvento,
          fecha: res.fecha || fecha,
          municipio: res.municipio || finalMunicipio
        })
        toast.success(`¡Solicitud enviada con éxito! Folio: ${res.shortId}`)
      } else {
        toast.error(res.error || "No se pudo registrar la solicitud. Intenta nuevamente.")
      }
    } catch (err: any) {
      console.error("Error submitting direct quote:", err)
      toast.error("Ocurrió un error inesperado al enviar la solicitud.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyFolio = () => {
    if (submittedData?.shortId) {
      navigator.clipboard.writeText(submittedData.shortId)
      setCopiedFolio(true)
      toast.success("Folio copiado al portapapeles")
      setTimeout(() => setCopiedFolio(false), 2500)
    }
  }

  return (
    <>
      <div className="relative bg-zinc-950/80 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden">
        {/* Glow de acento */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
          
          {/* SECCIÓN 1: DATOS DE CONTACTO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-[0.2em]">
              <User className="w-4 h-4" /> 1. Datos de Contacto
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Nombre Completo *
                </Label>
                <div className="relative">
                  <Input
                    id="nombre"
                    type="text"
                    required
                    placeholder="Ej. Mariana González"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="bg-black/40 border-white/15 text-white placeholder:text-gray-500 rounded-xl h-11 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="telefono" className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    WhatsApp (10 dígitos) *
                  </Label>
                  {isPhoneValid && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Válido
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs flex items-center gap-1 pointer-events-none">
                    <Phone className="w-3.5 h-3.5 text-primary" /> +52
                  </div>
                  <Input
                    id="telefono"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="7221234567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="bg-black/40 border-white/15 text-white placeholder:text-gray-500 rounded-xl h-11 pl-16 font-mono text-sm focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DETALLES DEL EVENTO */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-[0.2em]">
              <Calendar className="w-4 h-4" /> 2. Detalles del Evento
            </div>

            {/* Motivo del Evento */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Motivo de la Celebración *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EVENT_TYPES.map((ev) => {
                  const isSelected = tipoEvento === ev.value
                  return (
                    <button
                      key={ev.value}
                      type="button"
                      onClick={() => setTipoEvento(ev.value)}
                      className={`h-11 px-3 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-primary text-black border-primary shadow-lg shadow-primary/20 font-black"
                          : "bg-black/30 border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20"
                      }`}
                    >
                      {ev.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Fecha y Horario */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha" className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Fecha Tentativa *
                </Label>
                <div className="relative">
                  <Input
                    id="fecha"
                    type="date"
                    required
                    min={minDate}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="bg-black/40 border-white/15 text-white rounded-xl h-11 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horaInicio" className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Horario de Inicio Tentativo
                </Label>
                <select
                  id="horaInicio"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 text-white text-xs rounded-xl h-11 px-3 focus:border-primary focus:outline-none"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={`start-${t}`} value={t} className="bg-zinc-900 text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Horas de Show en Vivo
                </Label>
                <div className="grid grid-cols-4 gap-1.5 h-11">
                  {[2, 3, 4, 5].map((h) => {
                    const isSelected = horasShow === h
                    return (
                      <button
                        key={`horas-${h}`}
                        type="button"
                        onClick={() => setHorasShow(h)}
                        className={`rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-white text-black border-white font-black"
                            : "bg-black/30 border-white/10 text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        {h} hrs
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: UBICACIÓN Y AFORO */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-[0.2em]">
              <MapPin className="w-4 h-4" /> 3. Ubicación y Aforo
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado" className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Estado *
                </Label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => {
                    setEstado(e.target.value)
                    const muns = ESTADOS_MUNICIPIOS[e.target.value]
                    if (muns && muns.length > 0) setMunicipio(muns[0])
                  }}
                  className="w-full bg-black/40 border border-white/15 text-white text-xs rounded-xl h-11 px-3 focus:border-primary focus:outline-none"
                >
                  {Object.keys(ESTADOS_MUNICIPIOS).map((est) => (
                    <option key={est} value={est} className="bg-zinc-900 text-white">
                      {est}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipio" className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Municipio / Zona *
                </Label>
                <select
                  id="municipio"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 text-white text-xs rounded-xl h-11 px-3 focus:border-primary focus:outline-none"
                >
                  {municipiosDisponibles.map((m) => (
                    <option key={m} value={m} className="bg-zinc-900 text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {municipio === "Otro municipio / cotización manual" && (
              <div className="space-y-2">
                <Label htmlFor="municipioManual" className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Especifica tu Municipio o Ciudad *
                </Label>
                <Input
                  id="municipioManual"
                  type="text"
                  required
                  placeholder="Ej. Cuernavaca, Morelos"
                  value={municipioManual}
                  onChange={(e) => setMunicipioManual(e.target.value)}
                  className="bg-black/40 border-white/15 text-white placeholder:text-gray-500 rounded-xl h-11 focus:border-primary focus:ring-primary/20"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="lugarEvento" className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Nombre del Recinto o Salón <span className="text-gray-500 font-normal">(Opcional)</span>
              </Label>
              <Input
                id="lugarEvento"
                type="text"
                placeholder="Ej. Hacienda San Martín, Jardín Los Pinos, Domicilio particular..."
                value={lugarEvento}
                onChange={(e) => setLugarEvento(e.target.value)}
                className="bg-black/40 border-white/15 text-white placeholder:text-gray-500 rounded-xl h-11 focus:border-primary focus:ring-primary/20"
              />
            </div>

            {/* Selector de Aforo */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between">
                <span>Aforo Estimado de Invitados *</span>
                <span className="text-primary font-bold">{invitados} invitados aprox.</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {GUEST_RANGES.map((r) => {
                  const isSelected = invitados === r.value
                  return (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setInvitados(r.value)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-md shadow-primary/10"
                          : "bg-black/30 border-white/10 hover:bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-black ${isSelected ? "text-primary" : "text-white"}`}>
                          {r.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium">{r.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: FORMATO MUSICAL DE INTERÉS */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-[0.2em]">
              <Music2 className="w-4 h-4" /> 4. Formato de Interés
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PACKAGE_FORMATS.map((pkg) => {
                const isSelected = paquete === pkg.id
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setPaquete(pkg.id)}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? "bg-primary/15 border-primary shadow-lg shadow-primary/10 ring-1 ring-primary"
                        : "bg-black/30 border-white/10 hover:bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-base font-black ${isSelected ? "text-primary" : "text-white"}`}>
                        {pkg.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {pkg.badge}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-300 mb-1">{pkg.headline}</div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{pkg.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SECCIÓN 5: REQUERIMIENTOS ESPECIALES */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <Label htmlFor="notas" className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Comentarios o Requerimientos Especiales <span className="text-gray-500 font-normal">(Opcional)</span>
            </Label>
            <Textarea
              id="notas"
              rows={3}
              placeholder="Platícanos si tienes alguna temática, canción especial para el vals/entrada, o detalle técnico del recinto..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="bg-black/40 border-white/15 text-white placeholder:text-gray-500 rounded-xl resize-none text-xs leading-relaxed focus:border-primary focus:ring-primary/20"
            />
          </div>

          {/* BOTÓN DE ACCIÓN PRINCIPAL */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-sm hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando Solicitud...
                </>
              ) : (
                <>
                  Solicitar Propuesta Personalizada
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <p className="text-center text-[11px] text-gray-500 mt-3 font-medium">
              🔒 Disponibilidad sujeta a confirmación técnica. Recibirás tu propuesta oficial directamente en tu WhatsApp.
            </p>
          </div>
        </form>
      </div>

      {/* MODAL DE CONFIRMACIÓN ELEGANTE */}
      <Dialog open={!!submittedData} onOpenChange={() => setSubmittedData(null)}>
        <DialogContent className="bg-zinc-950 border border-white/15 text-white max-w-lg rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="text-center sm:text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="inline-flex items-center gap-2 mx-auto px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-primary font-black">
              <span>Folio: {submittedData?.shortId}</span>
              <button
                type="button"
                onClick={handleCopyFolio}
                className="hover:text-white transition-colors"
                title="Copiar Folio"
              >
                {copiedFolio ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <DialogTitle className="text-2xl sm:text-3xl font-heading font-black uppercase tracking-tight text-white">
              ¡Solicitud Recibida!
            </DialogTitle>

            <DialogDescription className="text-gray-300 text-sm leading-relaxed max-w-sm mx-auto">
              Un productor de Vendetta revisará la disponibilidad de tu fecha y preparará tu propuesta técnica personalizada. Te contactaremos vía WhatsApp.
            </DialogDescription>
          </DialogHeader>

          {/* Resumen del evento */}
          <div className="my-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span>Cliente:</span>
              <span className="text-white font-bold">{submittedData?.nombre}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Evento:</span>
              <span className="text-white font-bold">{submittedData?.motivo}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Fecha:</span>
              <span className="text-white font-bold">{submittedData?.fecha}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Ubicación:</span>
              <span className="text-white font-bold">{submittedData?.municipio}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => setSubmittedData(null)}
              className="w-full h-11 rounded-xl bg-white text-black font-black uppercase text-xs tracking-wider hover:bg-gray-200 transition-all"
            >
              Entendido
            </Button>

            {adminWhatsapp && (
              <Button
                asChild
                variant="outline"
                className="w-full h-11 rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs gap-2"
              >
                <a
                  href={`https://wa.me/${adminWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hola Vendetta 👋 Acabo de enviar mi solicitud con Folio ${submittedData?.shortId} para mi ${submittedData?.motivo}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-emerald-400" />
                  Escribir a Producción Directamente
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
