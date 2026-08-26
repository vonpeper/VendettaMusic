"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import * as Icons from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon"

const {
  Check, X, Sparkles, Music2,
  Mic2, Lightbulb, Users, Volume2, Monitor, Star,
  ArrowUpRight, Calendar, Clock, MapPin, User, PartyPopper
} = Icons

// Helper to get Lucide icon from string
const getIcon = (name: string | null) => {
  if (!name) return Check
  const Icon = (Icons as any)[name]
  return Icon || Check
}

interface ServiceItem {
  id: string
  name: string
  icon: string | null
  category: string
}

interface PackageData {
  id: string
  name: string
  baseCostPerHour: number
  minDuration: number
  description: string | null
  serviceItems: ServiceItem[]
  includes?: string
  exclusions?: string
  active?: boolean
}

// Estilos visuales por defecto para paquetes
const PACKAGE_STLYES: Record<number, any> = {
  0: { // Primer paquete
    emoji: "🎸",
    gradient: "from-violet-900/70 via-violet-800/40 to-violet-900/30",
    border: "border-violet-500/40 hover:border-violet-400/70",
    glow: "shadow-violet-500/10",
    accentColor: "text-violet-300",
    badgeColor: "bg-violet-500/20 text-violet-200 border-violet-400/30",
    highlight: false
  },
  1: { // Segundo paquete (Highlight)
    emoji: "🎵",
    gradient: "from-red-900/80 via-rose-800/50 to-red-900/40",
    border: "border-red-500/60",
    glow: "shadow-red-500/20",
    accentColor: "text-red-300",
    badgeColor: "bg-red-500/20 text-red-200 border-red-400/40",
    highlight: true
  },
  2: { // Tercer paquete
    emoji: "🏆",
    gradient: "from-amber-900/70 via-yellow-800/40 to-amber-900/30",
    border: "border-amber-500/40 hover:border-amber-400/70",
    glow: "shadow-amber-500/10",
    accentColor: "text-amber-300",
    badgeColor: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    highlight: false
  }
}

const HARDCODED_FEATURES: Record<string, { includes: {icon: string, text: string}[], notIncludes: string[] }> = {
  "Essential": {
    includes: [
      { icon: "Volume2",    text: "Audio Electro-Voice (2 tops + 1 sub + consola digital)" },
      { icon: "Music2",     text: "Backline completo (batería, amps, microfonía)" },
      { icon: "Lightbulb",  text: "Iluminación básica RGB" },
      { icon: "Users",      text: "4 integrantes + Ingeniero + Staff" },
      { icon: "Music2",     text: "Repertorio Pop Rock (Inglés/Español)" },
      { icon: "Sparkles",   text: "2 horas de show (2 sets)" },
    ],
    notIncludes: ["Templete", "Pantalla LED", "Iluminación robótica", "Viáticos"]
  },
  "Experience": {
    includes: [
      { icon: "Sparkles",  text: "Todo lo del paquete Essential" },
      { icon: "Volume2",   text: "Audio profesional (100 a 300 personas)" },
      { icon: "Volume2",   text: "Mejora en calidad y cobertura de sonido" },
      { icon: "Mic2",      text: "Monitoreo inalámbrico profesional" },
      { icon: "Music2",    text: "2 horas de show potente" },
    ],
    notIncludes: ["Templete", "Pantalla LED", "Viáticos"]
  },
  "Festival Premium": {
    includes: [
      { icon: "Sparkles",   text: "Todo lo del paquete Experience" },
      { icon: "Monitor",    text: "Pantalla LED 3×2 m" },
      { icon: "Lightbulb",  text: "Iluminación robótica avanzada" },
      { icon: "Star",       text: "Templete (Escenario)" },
      { icon: "Users",      text: "Producción completa tipo concierto" },
      { icon: "Music2",     text: "2 horas de máxima experiencia" },
    ],
    notIncludes: ["Viáticos"]
  },
  "Bar": {
    includes: [
      { icon: "Volume2",    text: "Audio EV" },
      { icon: "Music2",     text: "Backline completo" },
      { icon: "Users",      text: "4 integrantes + Ing. en audio + Staff" },
      { icon: "Sparkles",   text: "2 turnos de 45 mins" },
    ],
    notIncludes: ["Templete", "Pantalla LED", "Iluminación robótica", "Viáticos"]
  }
}

const EVENT_MOTIVOS = [
  { value: "Boda", label: "💍 Boda" },
  { value: "XV Años", label: "✨ XV Años" },
  { value: "Cumpleaños", label: "🎂 Cumpleaños" },
  { value: "Corporativo", label: "🏢 Corporativo / Empresarial" },
  { value: "Bar", label: "🍸 Bar / Restaurante" },
  { value: "Happening", label: "⚡ Happening / Fiesta Privada" },
  { value: "Otro", label: "🎶 Otro" },
]

export function PaquetesSection({ dbPackages }: { dbPackages: PackageData[]; viaticosConfig?: any }) {
  const WHATSAPP_PHONE = "527222417045"

  // Estado del modal de cotización
  const [selectedPkg, setSelectedPkg] = useState<PackageData | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    motivo: "Boda",
    fecha: "",
    hora: "",
    invitados: "",
    ubicacion: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenQuote = (pkg: PackageData) => {
    setSelectedPkg(pkg)
  }

  const handleCloseModal = () => {
    setSelectedPkg(null)
    setIsSubmitting(false)
  }

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error("Por favor ingresa tu nombre")
      return
    }
    if (!formData.fecha) {
      toast.error("Por favor selecciona la fecha de tu evento")
      return
    }
    if (!formData.hora.trim()) {
      toast.error("Por favor indica la hora estimada")
      return
    }
    if (!formData.invitados.trim()) {
      toast.error("Por favor indica el número aproximado de invitados")
      return
    }
    if (!formData.ubicacion.trim()) {
      toast.error("Por favor indica la ubicación o municipio del evento")
      return
    }

    setIsSubmitting(true)

    // Formatear mensaje para WhatsApp
    const pkgName = selectedPkg ? selectedPkg.name : "Personalizado"
    const waMessage = 
`¡Hola Vendetta Live Music! 🎸⚡
Me gustaría cotizar el *Paquete ${pkgName}* para mi evento:

👤 *Nombre:* ${formData.nombre.trim()}
🎉 *Motivo:* ${formData.motivo}
📅 *Fecha:* ${formData.fecha}
⏰ *Hora estimada:* ${formData.hora.trim()}
👥 *Invitados:* ${formData.invitados.trim()} personas
📍 *Ubicación:* ${formData.ubicacion.trim()}

¿Tienen disponibilidad para esta fecha? ¡Muchas gracias!`

    const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(waMessage)}`

    toast.success("¡Redirigiendo a WhatsApp con los datos de tu evento!")
    
    // Abrir WhatsApp en nueva pestaña
    window.open(waUrl, "_blank")
    handleCloseModal()
  }

  return (
    <section id="paquetes" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&auto=format&fit=crop"
          alt=""
          fill
          className="object-cover opacity-[0.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Nuestros Paquetes
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight uppercase mb-4 animated-title pr-4">
            Elige tu Show
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg font-medium">
            Producción musical de primer nivel para tu evento. Completa tus datos y cotiza de inmediato por WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {dbPackages.map((pkg, i) => {
            const style = PACKAGE_STLYES[i % 3] || PACKAGE_STLYES[0]
            const isUnavailable = pkg.active === false
            const isEssential = pkg.name.toLowerCase().includes("essent")
            
            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 bg-gradient-to-br ${style.gradient} ${
                  isUnavailable 
                    ? "border-neutral-800 opacity-60 filter grayscale-[40%] cursor-not-allowed" 
                    : style.border
                } ${
                  !isUnavailable && style.highlight ? `shadow-2xl ${style.glow} lg:-translate-y-5 scale-[1.03]` : "hover:scale-[1.01] hover:shadow-xl"
                }`}
              >
                {style.highlight && !isUnavailable && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full border ${style.badgeColor}`}>
                    ★ Más Solicitado
                  </div>
                )}
                {isUnavailable && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-900 text-neutral-400 text-[9px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full border border-neutral-700">
                    No Disponible
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-3xl mb-2">{style.emoji}</div>
                  <h3 className={`font-heading font-black text-2xl mb-2 ${style.accentColor}`}>{pkg.name}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{pkg.description}</p>
                </div>

                {/* Precios: Solo se despliega para Essential */}
                {isEssential ? (
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Inversión</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">Desde $8,500</span>
                      <span className="text-xs text-primary font-bold">MXN</span>
                    </div>
                    <div className="text-xs text-primary font-semibold mt-1">2 horas de show</div>
                  </div>
                ) : (
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Inversión</div>
                    <div className="text-lg font-black text-white/90">Cotización personalizada</div>
                    <div className="text-xs text-muted-foreground mt-1">Atención directa a la medida</div>
                  </div>
                )}

                <div className="flex-1 mb-6">
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${style.accentColor}`}>¿Qué incluye?</div>
                  <ul className="space-y-2.5">
                    {HARDCODED_FEATURES[pkg.name] ? (
                      HARDCODED_FEATURES[pkg.name].includes.map((item, j) => {
                        const IconComp = getIcon(item.icon)
                        return (
                          <li key={j} className="flex items-start gap-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${style.badgeColor}`}>
                              <IconComp className="w-2.5 h-2.5" />
                            </div>
                            <span className="text-sm text-white/80 leading-snug">{item.text}</span>
                          </li>
                        )
                      })
                    ) : pkg.serviceItems && pkg.serviceItems.length > 0 ? (
                      pkg.serviceItems.map((item) => {
                        const IconComp = getIcon(item.icon)
                        return (
                          <li key={item.id} className="flex items-start gap-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${style.badgeColor}`}>
                              <IconComp className="w-2 h-2" />
                            </div>
                            <span className="text-sm text-white/80 leading-snug">{item.name}</span>
                          </li>
                        )
                      })
                    ) : (
                      pkg.includes?.split(',').map((inc, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${style.badgeColor}`}>
                            <Check className="w-2 h-2" />
                          </div>
                          <span className="text-sm text-white/80 leading-snug">{inc.trim()}</span>
                        </li>
                      ))
                    )}
                  </ul>

                  {HARDCODED_FEATURES[pkg.name]?.notIncludes.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {HARDCODED_FEATURES[pkg.name].notIncludes.map((item, j) => (
                        <li key={j} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-white/5 border border-white/15 flex items-center justify-center shrink-0">
                            <X className="w-2.5 h-2.5 text-white/30" />
                          </div>
                          <span className="text-xs text-white/30">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button
                  disabled={isUnavailable}
                  onClick={() => handleOpenQuote(pkg)}
                  className={`w-full h-12 font-black gap-2 cursor-pointer transition-all duration-300 mt-auto group ${
                    isUnavailable
                      ? "bg-neutral-800 border border-neutral-700/50 text-neutral-500 cursor-not-allowed"
                      : style.highlight
                        ? "bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl shadow-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98]"
                        : "bg-white/10 hover:bg-[#25D366] text-white hover:text-white border border-white/20 hover:border-[#25D366] hover:scale-[1.01] active:scale-[0.98]"
                  }`}
                >
                  {isUnavailable ? "No Disponible" : (
                    <>
                      <WhatsAppIcon className="w-4 h-4 fill-white transition-transform duration-300 group-hover:scale-110" />
                      <span>Cotizar Paquete</span>
                      <ArrowUpRight className="w-4 h-4 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* -- MODAL DE COTIZACIÓN A WHATSAPP ----------------------------- */}
      {selectedPkg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200"
          onClick={handleCloseModal}
        >
          <div 
            className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest mb-3">
                <Sparkles className="w-3 h-3" /> Cotizando: {selectedPkg.name}
              </div>
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight">
                Datos de tu Evento
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Completa estos datos para generar tu cotización formal con disponibilidad inmediata vía WhatsApp.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitQuote} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mariana Gómez / Corporativo Liverpool"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Motivo (Dropdown) */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <PartyPopper className="w-3.5 h-3.5 text-primary" /> Motivo del Evento *
                </label>
                <div className="relative">
                  <select
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                  >
                    {EVENT_MOTIVOS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-zinc-900 text-white">
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/40">
                    <ArrowUpRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha del Evento *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" /> Hora Estimada *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 21:00 hrs"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Invitados y Ubicación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" /> No. de Invitados *
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    placeholder="Ej: 150"
                    value={formData.invitados}
                    onChange={(e) => setFormData({ ...formData, invitados: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Ubicación *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Valle de Bravo / CDMX"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Botón de Enviar a WhatsApp */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-13 font-black text-sm uppercase tracking-wider gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl shadow-[#25D366]/25 transition-all duration-300 rounded-xl cursor-pointer group hover:scale-[1.01] active:scale-[0.99]"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
                  <span>Continuar a WhatsApp</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
                <p className="text-[10px] text-gray-500 text-center mt-2.5">
                  ⚡ Tu información se abrirá automáticamente en WhatsApp para atención personalizada y formalización.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

