import { Button } from "@/components/ui/button"
import { Check, MessageCircle, ArrowUpRight } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Paquetes y Precios | Vendetta Live Music",
  description: "Conoce nuestros paquetes musicales (Essential, Premium y Acústico) para tu boda o evento. Contáctanos por WhatsApp para disponibilidad y atención inmediata.",
  alternates: {
    canonical: '/paquetes',
  }
}

export default function PaquetesPage() {
  const WHATSAPP_PHONE = "527222417045"

  const paquetes = [
    {
      name: "Vendetta Essential",
      description: "Ideal para eventos de día o sociales con menos de 100 invitados que requieren un ambiente increíble.",
      price: "Desde $8,500 MXN",
      duration: "Base de 2 horas",
      hasPrice: true,
      popular: false,
      features: [
        "Quinteto Base (Voz F, Voz M, Guitarra, Bajo, Batería)",
        "Audio para 100 personas",
        "Iluminación arquitectónica básica",
        "Staff técnico (2 elementos)",
        "Show interactivo"
      ]
    },
    {
      name: "Vendetta Premium",
      description: "Nuestro paquete estelar. La experiencia completa con metales y producción a nivel concierto. Bodas y corporativos.",
      price: "Cotización personalizada",
      duration: "Producción completa",
      hasPrice: false,
      popular: true,
      features: [
        "Septeto (Incluye Sax y Trompeta)",
        "Audio Line Array para hasta 300 personas",
        "Estructura cuadrada con Iluminación Robótica",
        "Ingeniero de sala y monitores",
        "Chisperos y Pirotecnia Fría",
        "Souvenirs premium para invitados",
        "DJ para música en recesos"
      ]
    },
    {
      name: "Vendetta Acústico",
      description: "El toque elegante para tu hora del cocktail, ceremonias civiles o cenas formales.",
      price: "Cotización personalizada",
      duration: "Formato íntimo / cocktail",
      hasPrice: false,
      popular: false,
      features: [
        "Trío Acústico (Voz, Guitarra Acústica, Percusión)",
        "Repertorio adaptado (Jazz, Bossa, Baladas)",
        "Audio minimalista oculto",
        "Ideal para recibir invitados"
      ]
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-black py-24 md:py-32 border-b border-white/10">
        <div className="container px-4 text-center">
          <h1 className="font-heading font-black text-4xl md:text-6xl text-white uppercase tracking-widest mb-6">
            Nuestros <span className="text-primary italic">Paquetes</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Configuramos el show ideal según la escala de tu fiesta. Contáctanos por WhatsApp para consultar disponibilidad.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {paquetes.map((pkg, i) => {
              const waMessage = encodeURIComponent(`¡Hola Vendetta! Me interesa cotizar el paquete "${pkg.name}" para mi evento. ¿Me podrían dar información de disponibilidad?`)
              const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${waMessage}`

              return (
                <div 
                  key={i} 
                  className={`relative flex flex-col rounded-2xl border p-8 shadow-xl ${
                    pkg.popular 
                      ? "bg-primary/5 border-primary/50 shadow-primary/10 lg:-translate-y-4" 
                      : "bg-card border-white/10"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                      Más Solicitado
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="font-heading font-bold text-2xl text-white mb-2">{pkg.name}</h3>
                    <p className="text-muted-foreground text-sm">{pkg.description}</p>
                  </div>
                  
                  <div className="mb-8 pb-8 border-b border-white/10">
                    <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Inversión</div>
                    {pkg.hasPrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{pkg.price}</span>
                      </div>
                    ) : (
                      <div className="text-xl font-black text-white/90">{pkg.price}</div>
                    )}
                    <div className="text-sm text-primary font-medium mt-1">{pkg.duration}</div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold text-white mb-4 uppercase tracking-wider">¿Qué incluye?</p>
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-sm text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a 
                    href={waUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full mt-auto"
                  >
                    <Button 
                      className={`w-full font-bold gap-2 cursor-pointer ${
                        pkg.popular 
                          ? "bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg shadow-[#25D366]/20" 
                          : "bg-white/10 hover:bg-[#25D366] text-white border border-white/20 hover:border-[#25D366]"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Cotizar por WhatsApp</span>
                      <ArrowUpRight className="w-4 h-4 opacity-70" />
                    </Button>
                  </a>
                </div>
              )
            })}
          </div>
          
          <div className="mt-24 max-w-3xl mx-auto text-center border-t border-white/10 pt-16">
             <h3 className="text-2xl font-bold text-white mb-4">¿Buscas una propuesta a la medida?</h3>
             <p className="text-muted-foreground mb-8">
               Platícanos los requerimientos de tu evento. Te atendemos directamente por WhatsApp para estructurar el show perfecto con horas extras, producción extendida o requerimientos especiales.
             </p>
             <a 
               href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("¡Hola Vendetta! Busco una propuesta personalizada para mi evento.")}`} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="inline-block"
             >
               <Button size="lg" className="px-10 font-bold bg-[#25D366] hover:bg-[#20ba59] text-white gap-2 cursor-pointer">
                 <MessageCircle className="w-5 h-5" />
                 Chatear con un Asesor por WhatsApp
               </Button>
             </a>
          </div>
        </div>
      </section>
    </div>
  )
}
