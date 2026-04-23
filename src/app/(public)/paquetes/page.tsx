import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

export default function PaquetesPage() {
  const paquetes = [
    {
      name: "Vendetta Essential",
      description: "Ideal para eventos de día o sociales con menos de 100 invitados que requieren un ambiente increíble.",
      price: "$15,000 MXN",
      duration: "Base de 3 horas",
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
      price: "$35,000 MXN",
      duration: "Base de 5 horas",
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
      price: "$8,000 MXN",
      duration: "Base de 2 horas",
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
            Transparencia total, sin costos ocultos. Configuramos el show ideal según la escala de tu fiesta.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {paquetes.map((pkg, i) => (
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
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white">{pkg.price}</span>
                  </div>
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

                <Link href="/contacto">
                  <Button variant={pkg.popular ? "default" : "outline"} className={`w-full font-bold ${pkg.popular ? "text-primary-foreground" : "text-white"}`}>
                    Elegir {pkg.name.split(" ")[1]}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          
          <div className="mt-24 max-w-3xl mx-auto text-center border-t border-white/10 pt-16">
             <h3 className="text-2xl font-bold text-white mb-4">¿La cotización que buscas no encaja aquí?</h3>
             <p className="text-muted-foreground mb-8">
               Contamos con un sistema cotizador dinámico. Puedes agregar <strong>Horas Extras</strong>, <strong>Audio Extendido para miles de personas</strong> o <strong>Pantallas LED de alta resolución</strong> según requieras.
             </p>
             <Link href="/auth/login" className="inline-block">
               <Button size="lg" className="px-10">Entrar al Cotizador Personalizado</Button>
             </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
