"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"
import { submitContactInquiry } from "@/actions/contact"
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
}

const EVENT_TYPES = [
  { value: "Boda", label: "💒 Boda" },
  { value: "XV Años", label: "👸 XV Años" },
  { value: "Cumpleaños / Aniversario", label: "🎂 Cumpleaños / Aniversario" },
  { value: "Corporativo / Fin de Año", label: "🏢 Corporativo / Fin de Año" },
  { value: "Bar / Restaurante / Festival", label: "🍸 Bar / Restaurante / Festival" },
  { value: "Graduación", label: "🎓 Graduación" },
  { value: "Fiesta Privada / Otro", label: "🎸 Fiesta Privada / Otro" },
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

export function DirectQuoteForm({ adminWhatsapp }: DirectQuoteFormProps) {
  // Datos de contacto
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [tipoEvento, setTipoEvento] = useState("Boda")
  const [fecha, setFecha] = useState("")

  // Horario seleccionable en formato 12h AM/PM
  const [horaInicio, setHoraInicio] = useState("08:00 PM")
  const [horaFin, setHoraFin] = useState("01:00 AM")

  // Invitados y producción adicional (>100)
  const [invitados, setInvitados] = useState("150")
  const [produccionAdicional, setProduccionAdicional] = useState<string[]>([])

  // Ubicación y viáticos
  const [estado, setEstado] = useState("Estado de México")
  const [municipio, setMunicipio] = useState("Metepec")
  const [municipioManual, setMunicipioManual] = useState("")
  const [lugarEvento, setLugarEvento] = useState("")

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
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null)

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

    const muniFinal = isMunicipioManual ? municipioManual.trim() : municipio
    if (!muniFinal) {
      toast.error("Por favor selecciona o ingresa el municipio del evento")
      return
    }

    setIsSubmitting(true)

    const horarioCompleto = `${horaInicio} a ${horaFin}`
    const ubicacionCompleta = `${muniFinal}, ${estado}${lugarEvento.trim() ? ` (${lugarEvento.trim()})` : ""}`

    // 1. Guardar prospecto en CRM
    try {
      const inquiryForm = new FormData()
      inquiryForm.set("nombre", nombre.trim())
      inquiryForm.set("telefono", telefono.trim())
      inquiryForm.set("email", `cliente_${telefono.replace(/\D/g, "") || Date.now()}@cotizacion.vendetta.mx`)
      inquiryForm.set("fecha", fecha)
      inquiryForm.set("tipo", `${tipoEvento} - Propuesta Personalizada`)

      let detallesExtra = `Horario: ${horarioCompleto} | Invitados: ${numInvitados} | Ubicación: ${ubicacionCompleta}`
      if (tieneMasDe100Invitados && produccionAdicional.length > 0) {
        detallesExtra += ` | Producción extra: ${produccionAdicional.join(", ")}`
      }
      if (viaticos) {
        detallesExtra += ` | Viáticos: ${viaticos.isOutsideZone ? `$${viaticos.amount} MXN` : "Zona Local ($0)"}`
      }
      if (notas.trim()) {
        detallesExtra += ` | Notas: ${notas.trim()}`
      }

      inquiryForm.set("mensaje", detallesExtra)

      await submitContactInquiry(inquiryForm).catch((err) =>
        console.warn("Could not save contact inquiry in DB:", err)
      )
    } catch (dbErr) {
      console.warn("Inquiry save error:", dbErr)
    }

    // 2. Formatear texto de viáticos para WhatsApp
    let textoViaticos = "Zona local (sin costo adicional de viáticos)"
    if (viaticos) {
      if (viaticos.requiresManualQuote) {
        textoViaticos = "Distancia extendida (>250 km, cotización logística personalizada)"
      } else if (viaticos.amount > 0) {
        const casetasPorCamioneta = Math.round(viaticos.tollCost / 2)
        const gasolinaPorCamioneta = Math.round(viaticos.fuelCost / 2)
        const totalPorCamioneta = casetasPorCamioneta + gasolinaPorCamioneta

        textoViaticos = `${MXN(viaticos.amount)} MXN
   • Por camioneta (1 SUV ida y vuelta):
     - Casetas: ${MXN(casetasPorCamioneta)} MXN
     - Gasolina Premium (7.1 km/L): ${MXN(gasolinaPorCamioneta)} MXN
     - Subtotal por camioneta: ${MXN(totalPorCamioneta)} MXN
   • Total 2 camionetas (flota completa):
     - Casetas totales: ${MXN(viaticos.tollCost)} MXN
     - Gasolina total: ${MXN(viaticos.fuelCost)} MXN`
      }
    }

    // 3. Formatear producción adicional
    let textoProduccion = ""
    if (tieneMasDe100Invitados && produccionAdicional.length > 0) {
      textoProduccion = `\n🎪 *Producción adicional de interés (>100 invitados):*\n${produccionAdicional.map((p) => `  • ${p}`).join("\n")}\n`
    }

    // 4. Construir mensaje de WhatsApp
    const waMessage = 
`¡Hola Vendetta Live Music! 🎸⚡
Llené el formulario para personalizar la propuesta para mi evento:

👤 *Nombre:* ${nombre.trim()}
📱 *WhatsApp:* ${telefono.trim()}
🎉 *Tipo de Evento:* ${tipoEvento}
📅 *Fecha:* ${fecha}
⏰ *Horario:* ${horarioCompleto}
👥 *Invitados estimados:* ${numInvitados} personas${textoProduccion}
📍 *Ubicación:* ${ubicacionCompleta}
🚗 *Viáticos estimados:* ${textoViaticos}
⚠️ *(Nota: No incluye planta de luz. Viáticos para 2 camionetas, gasolina y casetas únicamente. No incluye alimentos.)*
${notas.trim() ? `\n📝 *Notas / Peticiones especiales:* ${notas.trim()}\n` : ""}
¿Tienen disponibilidad para esta fecha? ¡Quedo atento a la propuesta!`

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`
    setSubmittedUrl(waUrl)
    setIsSubmitting(false)

    toast.success("¡Propuesta preparada! Abriendo tu WhatsApp...")

    // Abrir WhatsApp
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank")
    }
  }

  // Pantalla de confirmación y reintento
  if (submittedUrl) {
    return (
      <div className="bg-card/90 border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl backdrop-blur-xl space-y-6 animate-in fade-in-0 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight">
            ¡Propuesta Preparada!
          </h2>
          <p className="text-sm text-gray-300 max-w-md mx-auto">
            Hemos organizado los detalles de tu evento en un mensaje listo para WhatsApp. Si no se abrió automáticamente, toca el botón de abajo para enviarlo directamente.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={submittedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              size="lg"
              className="w-full h-14 px-8 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-base rounded-2xl shadow-xl shadow-[#25D366]/30 gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <WhatsAppIcon className="w-5 h-5 fill-white" />
              <span>Enviar por WhatsApp</span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
            </Button>
          </a>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setSubmittedUrl(null)}
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
            min={10}
            max={5000}
            step={10}
            placeholder="Ej: 150"
            value={invitados}
            onChange={(e) => setInvitados(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
          />
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

        {/* Nombre del Salón / Lugar opcional */}
        <div className="space-y-1">
          <span className="text-[11px] text-gray-400 font-medium">Nombre del salón, hacienda o jardín (Opcional):</span>
          <Input
            type="text"
            placeholder="Ej: Hacienda San Martín, Jardín La Concordia, Domicilio particular..."
            value={lugarEvento}
            onChange={(e) => setLugarEvento(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
          />
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
                      <div className="text-xs text-gray-300">
                        Cálculo para 2 camionetas SUV (Gasolina Premium a 7.1 km/L y casetas ida y vuelta):
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Por camioneta (1 SUV):</span>
                          <p className="text-xs text-emerald-400 font-semibold">• Casetas (ida y vuelta): {MXN(Math.round(viaticos.tollCost / 2))} MXN</p>
                          <p className="text-xs text-amber-400 font-semibold">• Gasolina Premium: {MXN(Math.round(viaticos.fuelCost / 2))} MXN</p>
                          <div className="border-t border-white/10 pt-1 text-xs font-bold text-white">
                            Subtotal 1 SUV: {MXN(Math.round((viaticos.tollCost + viaticos.fuelCost) / 2))} MXN
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-black/40 border border-primary/20 space-y-1">
                          <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Total Flota (2 SUVs):</span>
                          <p className="text-xs text-emerald-400 font-semibold">• Casetas totales: {MXN(viaticos.tollCost)} MXN</p>
                          <p className="text-xs text-amber-400 font-semibold">• Gasolina total: {MXN(viaticos.fuelCost)} MXN</p>
                          <div className="border-t border-white/10 pt-1 text-xs font-black text-primary">
                            Total Viáticos: {MXN(viaticos.amount)} MXN
                          </div>
                        </div>
                      </div>
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
