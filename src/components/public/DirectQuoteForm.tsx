"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"
import { submitContactInquiry } from "@/actions/contact"
import { toast } from "sonner"
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  PartyPopper, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  Music2,
  ExternalLink
} from "lucide-react"

interface PackageOption {
  id: string
  name: string
  description?: string | null
}

interface DirectQuoteFormProps {
  packages: PackageOption[]
  adminWhatsapp?: string | null
}

const EVENT_TYPES = [
  { value: "Boda", label: "💒 Boda" },
  { value: "XV Años", label: "👸 XV Años" },
  { value: "Cumpleaños / Aniversario", label: "🎂 Cumpleaños / Aniversario" },
  { value: "Corporativo / Gala", label: "🏢 Corporativo / Gala" },
  { value: "Bar / Restaurante", label: "🍸 Bar / Restaurante" },
  { value: "Festival / Masivo", label: "🎪 Festival / Masivo" },
  { value: "Graduación", label: "🎓 Graduación" },
  { value: "Fiesta Privada / Otro", label: "🎸 Fiesta Privada / Otro" },
]

export function DirectQuoteForm({ packages, adminWhatsapp }: DirectQuoteFormProps) {
  const [packageName, setPackageName] = useState<string>(
    packages.length > 0 ? packages[0].name : "Essential"
  )
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [tipoEvento, setTipoEvento] = useState("Boda")
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("21:00")
  const [invitados, setInvitados] = useState("150")
  const [ubicacion, setUbicacion] = useState("")
  const [notas, setNotas] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null)

  const cleanPhone = (adminWhatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5217222880045").replace(/\D/g, "")

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
    if (!ubicacion.trim()) {
      toast.error("Por favor indica la ciudad o municipio del evento")
      return
    }

    setIsSubmitting(true)

    // 1. Guardar prospecto en base de datos CRM
    try {
      const inquiryForm = new FormData()
      inquiryForm.set("nombre", nombre.trim())
      inquiryForm.set("telefono", telefono.trim())
      inquiryForm.set("email", email.trim() || "contacto@vendetta.mx")
      inquiryForm.set("fecha", fecha)
      inquiryForm.set("tipo", `${tipoEvento} - Paquete: ${packageName}`)
      inquiryForm.set(
        "mensaje",
        `Hora: ${hora.trim()} | Invitados: ${invitados.trim()} | Ubicación: ${ubicacion.trim()}${notas.trim() ? ` | Notas: ${notas.trim()}` : ""}`
      )
      await submitContactInquiry(inquiryForm).catch((err) =>
        console.warn("Could not save contact inquiry in DB:", err)
      )
    } catch (dbErr) {
      console.warn("Inquiry save error:", dbErr)
    }

    // 2. Construir mensaje estructurado de WhatsApp
    const waMessage = 
`¡Hola Vendetta Live Music! 🎸⚡
Acabo de llenar mi solicitud de cotización en su página:

📦 *Paquete de interés:* ${packageName}
👤 *Nombre:* ${nombre.trim()}
📱 *Teléfono:* ${telefono.trim()}
${email.trim() ? `📧 *Correo:* ${email.trim()}\n` : ""}🎉 *Tipo de Evento:* ${tipoEvento}
📅 *Fecha:* ${fecha}
⏰ *Hora estimada:* ${hora.trim()}
👥 *Invitados estimados:* ${invitados.trim()} personas
📍 *Ubicación / Ciudad:* ${ubicacion.trim()}
${notas.trim() ? `📝 *Notas / Requerimientos:* ${notas.trim()}\n` : ""}
¿Tienen disponibilidad para esta fecha? ¡Muchas gracias!`

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`
    setSubmittedUrl(waUrl)
    setIsSubmitting(false)

    toast.success("¡Información lista! Abriendo tu WhatsApp...")

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
            ¡Formulario Completado!
          </h2>
          <p className="text-sm text-gray-300 max-w-md mx-auto">
            Hemos preparado tu mensaje con todos los datos de tu evento. Si no se abrió automáticamente, presiona el botón a continuación para enviarlo por WhatsApp.
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

      {/* 1. SELECCIÓN DE PAQUETE */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Music2 className="w-4 h-4 text-primary" /> Paquete de Interés
        </Label>
        <select
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer font-medium"
        >
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.name} className="bg-zinc-900 text-white">
              {pkg.name} {pkg.name === "Essential" ? "— Show 2 Horas (Básico Audio & Luces)" : pkg.name === "Experience" ? "— Show 2 Horas (Audio Ampliado + Monitoreo)" : pkg.name === "Festival Premium" ? "— Gran Producción Masiva" : ""}
            </option>
          ))}
          <option value="Personalizado / Por definir" className="bg-zinc-900 text-white">
            Personalizado / Aún no lo sé (Asesoría directa)
          </option>
        </select>
      </div>

      {/* 2. NOMBRE Y TELÉFONO */}
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

      {/* 3. CORREO Y TIPO DE EVENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-primary" /> Correo Electrónico (Opcional)
          </Label>
          <Input
            type="email"
            placeholder="Ej: mariana@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
          />
        </div>

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
      </div>

      {/* 4. FECHA Y HORA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" /> Horario Estimado del Show <span className="text-red-500">*</span>
          </Label>
          <Input
            required
            type="text"
            placeholder="Ej: 21:00 a 23:00 hrs"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
          />
        </div>
      </div>

      {/* 5. INVITADOS Y UBICACIÓN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" /> No. Estimado de Invitados <span className="text-red-500">*</span>
          </Label>
          <Input
            required
            type="text"
            placeholder="Ej: 150"
            value={invitados}
            onChange={(e) => setInvitados(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" /> Ciudad / Municipio del Evento <span className="text-red-500">*</span>
          </Label>
          <Input
            required
            type="text"
            placeholder="Ej: Metepec, Toluca, CDMX, Valle de Bravo..."
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm rounded-xl focus:border-primary"
          />
        </div>
      </div>

      {/* 6. NOTAS O REQUERIMIENTOS */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          Comentarios o Peticiones Especiales (Opcional)
        </Label>
        <textarea
          rows={3}
          placeholder="¿Alguna canción especial para vals, detalles del salón, dudas de audio o logística?"
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
              <span>Preparando Cotización...</span>
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
