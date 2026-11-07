"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"
import { submitPublicQuoteAction, saveQuoteDraftAction } from "@/actions/quote-direct"
import { ESTADOS_MUNICIPIOS } from "@/lib/municipios"
import { toast } from "sonner"
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  ArrowRight,
  PartyPopper,
  Clock
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

const MOTIVOS_FESTEJO = [
  "Boda",
  "XV Años",
  "Cumpleaños",
  "Corporativo",
  "Graduación",
  "Fiesta Privada",
  "Otro"
]

const AFORO_OPCIONES = [
  { label: "Íntimo (<100)", value: 80 },
  { label: "Salón (100-300)", value: 200 },
  { label: "Masivo (+300)", value: 400 },
]

const ESTADOS_DISPONIBLES = [
  "Estado de México",
  "Ciudad de México",
  "Morelos",
  "Querétaro",
  "Hidalgo",
  "Puebla",
  "Michoacán",
  "Guerrero",
  "Tlaxcala",
  "Otro"
]

export function DirectQuoteForm({ adminWhatsapp, initialPackage, initialDate }: DirectQuoteFormProps) {
  // Campos del formulario
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [fecha, setFecha] = useState(initialDate || "")
  const [horaInicio, setHoraInicio] = useState("21:00")
  const [horaFin, setHoraFin] = useState("23:00")

  // Ubicación normalizada
  const [selectedEstado, setSelectedEstado] = useState<string>("Estado de México")
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>("Metepec")
  const [customMunicipio, setCustomMunicipio] = useState<string>("")
  const [lugarReferencia, setLugarReferencia] = useState<string>("")

  const [aforoLabel, setAforoLabel] = useState<string>("Salón (100-300)")
  const [aforo, setAforo] = useState<number>(200)
  const [motivo, setMotivo] = useState<string>("Boda")

  // Estado del proceso
  const [inquiryId, setInquiryId] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<{
    shortId: string
    nombre: string
    motivo: string
    fecha: string
    horario?: string
    municipio: string
  } | null>(null)
  const [copiedFolio, setCopiedFolio] = useState(false)

  // Teléfono normalizado
  const cleanPhone = telefono.replace(/\D/g, "")
  const isPhoneValid = cleanPhone.length === 10

  // Es municipio personalizado si se elige 'Otro municipio...' o estado 'Otro'
  const isCustomMuni = selectedMunicipio === "Otro municipio / cotización manual" || selectedEstado === "Otro"

  const handleEstadoChange = (newEstado: string) => {
    setSelectedEstado(newEstado)
    if (newEstado === "Otro") {
      setSelectedMunicipio("Otro municipio / cotización manual")
    } else {
      const muniList = ESTADOS_MUNICIPIOS[newEstado] || []
      setSelectedMunicipio(muniList[0] || "Otro municipio / cotización manual")
    }
  }

  // Fecha mínima: mañana
  const minDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split("T")[0]
  }, [])

  // Auto-guardado de borrador al ingresar nombre y teléfono válido (Zero friction)
  const draftTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (nombre.trim().length >= 3 && isPhoneValid) {
      if (draftTimer.current) clearTimeout(draftTimer.current)
      draftTimer.current = setTimeout(async () => {
        try {
          const finalMuni = isCustomMuni
            ? (customMunicipio.trim() || undefined)
            : selectedMunicipio
          const res = await saveQuoteDraftAction({
            nombre: nombre.trim(),
            telefono: cleanPhone,
            fecha: fecha || undefined,
            municipio: finalMuni,
            estado: selectedEstado,
            invitados: aforo,
            tipoEvento: motivo,
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
  }, [nombre, cleanPhone, isPhoneValid, fecha, selectedEstado, selectedMunicipio, customMunicipio, isCustomMuni, aforo, motivo, inquiryId])

  // Manejo del envío
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

    if (isCustomMuni && !customMunicipio.trim()) {
      toast.error("Por favor especifica tu municipio o localidad.")
      return
    }

    setIsSubmitting(true)

    try {
      const finalMunicipio = isCustomMuni ? customMunicipio.trim() : selectedMunicipio
      const finalEstado = selectedEstado
      const isUrl =
        lugarReferencia.trim().startsWith("http://") ||
        lugarReferencia.trim().startsWith("https://") ||
        lugarReferencia.trim().includes("maps.app.goo.gl") ||
        lugarReferencia.trim().includes("goo.gl/maps")

      const mapsLink = isUrl ? lugarReferencia.trim() : undefined
      const lugarEvento = lugarReferencia.trim() || undefined

      // Resolver paquete inicial si venía en URL
      let pkgLabel: string | undefined = undefined
      if (initialPackage) {
        const p = initialPackage.toLowerCase()
        if (p.includes("essential")) pkgLabel = "Essential"
        else if (p.includes("festival")) pkgLabel = "Festival"
        else pkgLabel = "Experience"
      }

      const res = await submitPublicQuoteAction({
        nombre: nombre.trim(),
        telefono: cleanPhone,
        tipoEvento: motivo,
        fecha,
        horaInicio,
        horaFin,
        invitados: aforo,
        estado: finalEstado,
        municipio: finalMunicipio,
        lugarEvento,
        mapsLink,
        paquete: pkgLabel,
        inquiryId
      })

      if (res.success && res.shortId) {
        setSubmittedData({
          shortId: res.shortId,
          nombre: res.clientName || nombre.trim(),
          motivo: res.motivo || motivo,
          fecha: res.fecha || fecha,
          horario: `${horaInicio} a ${horaFin}`,
          municipio: `${finalMunicipio}, ${finalEstado}`
        })
        toast.success(`¡Solicitud enviada con éxito! Folio: ${res.shortId}`)
      } else {
        toast.error(res.error || "No se pudo registrar la solicitud. Intenta nuevamente.")
      }
    } catch (err) {
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
      <div className="relative bg-zinc-950/85 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden">
        {/* Glow atmosférico sobrio con acento rubí y ámbar */}
        <div className="absolute -top-12 -right-12 w-72 h-72 bg-[#e11d48]/15 blur-[90px] pointer-events-none rounded-full" />
        <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-[#f59e0b]/10 blur-[90px] pointer-events-none rounded-full" />

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">

          {/* Fila 1: Nombre Completo y WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#e11d48]" /> Nombre Completo *
              </Label>
              <Input
                id="nombre"
                type="text"
                required
                placeholder="Ej. Mariana González"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="bg-black/50 border-white/15 text-white placeholder:text-gray-500 rounded-xl h-12 focus:border-[#e11d48] focus:ring-[#e11d48]/20 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="telefono" className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#e11d48]" /> WhatsApp (10 dígitos) *
                </Label>
                {isPhoneValid && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Válido
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs flex items-center gap-1 pointer-events-none">
                  <span className="font-bold text-[#e11d48]">+52</span>
                </div>
                <Input
                  id="telefono"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="7221234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="bg-black/50 border-white/15 text-white placeholder:text-gray-500 rounded-xl h-12 pl-14 font-mono text-sm focus:border-[#e11d48] focus:ring-[#e11d48]/20"
                />
              </div>
            </div>
          </div>

          {/* Fila 2: Fecha Tentativa y Horario Tentativo (Inicio / Fin) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha" className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#f59e0b]" /> Fecha Tentativa del Evento *
              </Label>
              <Input
                id="fecha"
                type="date"
                required
                min={minDate}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-black/50 border-white/15 text-white rounded-xl h-12 focus:border-[#f59e0b] focus:ring-[#f59e0b]/20 text-sm [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#f59e0b]" /> Horario Tentativo (Inicio / Fin) *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="horaInicio"
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="bg-black/50 border-white/15 text-white rounded-xl h-12 px-3 text-xs sm:text-sm font-mono focus:border-[#f59e0b] focus:ring-[#f59e0b]/20 [color-scheme:dark]"
                />
                <Input
                  id="horaFin"
                  type="time"
                  required
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="bg-black/50 border-white/15 text-white rounded-xl h-12 px-3 text-xs sm:text-sm font-mono focus:border-[#f59e0b] focus:ring-[#f59e0b]/20 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Fila 3: Ubicación Normalizada (Estado, Municipio y Recinto/Maps) */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado" className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#f59e0b]" /> Estado *
                </Label>
                <select
                  id="estado"
                  value={selectedEstado}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 text-white rounded-xl h-12 px-3 text-sm focus:border-[#f59e0b] focus:ring-[#f59e0b]/20 [color-scheme:dark] outline-none cursor-pointer"
                >
                  {ESTADOS_DISPONIBLES.map((est) => (
                    <option key={est} value={est} className="bg-zinc-900 text-white">
                      {est}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipio" className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#f59e0b]" /> Municipio o Alcaldía *
                </Label>
                <select
                  id="municipio"
                  value={selectedMunicipio}
                  onChange={(e) => setSelectedMunicipio(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 text-white rounded-xl h-12 px-3 text-sm focus:border-[#f59e0b] focus:ring-[#f59e0b]/20 [color-scheme:dark] outline-none cursor-pointer"
                >
                  {(ESTADOS_MUNICIPIOS[selectedEstado] || ["Otro municipio / cotización manual"]).map((mun) => (
                    <option key={mun} value={mun} className="bg-zinc-900 text-white">
                      {mun}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input condicional si selecciona 'Otro' o 'Otro municipio / cotización manual' */}
            {isCustomMuni && (
              <div className="space-y-1.5 animate-fadeIn">
                <Label htmlFor="customMunicipio" className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b]">
                  Especifica tu Municipio o Localidad *
                </Label>
                <Input
                  id="customMunicipio"
                  type="text"
                  required
                  placeholder="Ej. Cuautitlán, Huamantla, Taxco..."
                  value={customMunicipio}
                  onChange={(e) => setCustomMunicipio(e.target.value)}
                  className="bg-black/50 border-white/15 text-white placeholder:text-gray-500 rounded-xl h-12 focus:border-[#f59e0b] focus:ring-[#f59e0b]/20 text-sm"
                />
              </div>
            )}

            {/* Campo auxiliar opcional: Salón, Recinto o Link de Google Maps */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="lugarReferencia" className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Salón, Recinto o Link Google Maps
                </Label>
                <span className="text-[10px] text-gray-400 font-normal">Opcional</span>
              </div>
              <Input
                id="lugarReferencia"
                type="text"
                placeholder="Ej. Salón Bellavista o https://maps.app.goo.gl/..."
                value={lugarReferencia}
                onChange={(e) => setLugarReferencia(e.target.value)}
                className="bg-black/50 border-white/15 text-white placeholder:text-gray-500 rounded-xl h-12 focus:border-[#f59e0b] focus:ring-[#f59e0b]/20 text-sm"
              />
            </div>
          </div>

          {/* Fila 4: Aforo Estimado (Pills Rápidas) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#e11d48]" /> Aforo Estimado de Invitados *
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {AFORO_OPCIONES.map((op) => {
                const isSelected = aforoLabel === op.label
                return (
                  <button
                    key={op.label}
                    type="button"
                    onClick={() => {
                      setAforoLabel(op.label)
                      setAforo(op.value)
                    }}
                    className={`h-12 px-3 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-[#e11d48] to-[#be123c] text-white border-[#e11d48] shadow-lg shadow-[#e11d48]/25 ring-1 ring-[#e11d48]"
                        : "bg-black/40 border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {op.label}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic pt-1">
              El aforo determina los requerimientos técnicos de audio. Tarifas y rider sujetos a disponibilidad de agenda y equipo técnico para tu fecha.
            </p>
          </div>

          {/* Fila 5: Motivo del Festejo (Pills Rápidas) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <PartyPopper className="w-3.5 h-3.5 text-[#f59e0b]" /> Motivo del Festejo *
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {MOTIVOS_FESTEJO.map((item) => {
                const isSelected = motivo === item
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMotivo(item)}
                    className={`h-11 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black border-[#f59e0b] shadow-lg shadow-[#f59e0b]/25 ring-1 ring-[#f59e0b] font-black"
                        : "bg-black/40 border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {item}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Botón de Acción Principal: Solicitar Disponibilidad */}
          <div className="pt-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#be123c] via-[#e11d48] to-[#f59e0b] text-white font-black uppercase tracking-widest text-sm hover:opacity-95 transition-all shadow-xl shadow-[#e11d48]/25 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 border border-white/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando Disponibilidad...
                </>
              ) : (
                <>
                  Solicitar Disponibilidad
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
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

            <div className="inline-flex items-center gap-2 mx-auto px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-[#f59e0b] font-black">
              <span>Folio: {submittedData?.shortId}</span>
              <button
                type="button"
                onClick={handleCopyFolio}
                className="hover:text-white transition-colors cursor-pointer"
                title="Copiar Folio"
              >
                {copiedFolio ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <DialogTitle className="text-2xl sm:text-3xl font-heading font-black uppercase tracking-tight text-white">
              ¡Solicitud Recibida!
            </DialogTitle>

            <DialogDescription className="text-gray-300 text-sm leading-relaxed max-w-sm mx-auto">
              Un productor de Vendetta revisará la disponibilidad de tu fecha y preparará tu propuesta personalizada. Te contactaremos vía WhatsApp.
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
            {submittedData?.horario && (
              <div className="flex justify-between items-center text-gray-400">
                <span>Horario:</span>
                <span className="text-white font-mono font-bold">{submittedData.horario}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-gray-400">
              <span>Ubicación:</span>
              <span className="text-white font-bold">{submittedData?.municipio}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => setSubmittedData(null)}
              className="w-full h-11 rounded-xl bg-white text-black font-black uppercase text-xs tracking-wider hover:bg-gray-200 transition-all cursor-pointer"
            >
              Entendido
            </Button>

            {adminWhatsapp && (
              <Button
                asChild
                variant="outline"
                className="w-full h-11 rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs gap-2 cursor-pointer"
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
