import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { ChevronRight, Music2, Star, Zap, Volume2, Clock } from "lucide-react"
import Image from "next/image"
import { WhatsAppButton } from "@/components/public/WhatsAppButton"
import { NeonBorder } from "@/components/public/NeonBorder"

const LOCATIONS: Record<string, any> = {
  "toluca": {
    name: "Toluca",
    fullName: "Toluca y Metepec",
    title: "Música en Vivo para Bodas y Eventos en Toluca | Vendetta",
    description: "El mejor grupo musical versátil en Toluca y Metepec. Show en vivo de alto nivel para bodas, eventos corporativos y fiestas privadas.",
    heroImage: "https://images.unsplash.com/photo-1468359601543-843bfaef291a?q=80&w=2074&auto=format&fit=crop",
  },
  "cdmx": {
    name: "CDMX",
    fullName: "Ciudad de México",
    title: "Música en Vivo para Eventos en CDMX | Vendetta Live Music",
    description: "Contrata la mejor banda para eventos sociales en la Ciudad de México. Especialistas en bodas y eventos corporativos de alta gama.",
    heroImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&auto=format&fit=crop",
  },
  "valle-de-bravo": {
    name: "Valle de Bravo",
    fullName: "Valle de Bravo",
    title: "Música para Bodas en Valle de Bravo | Vendetta Show",
    description: "Especialistas en bodas destino en Valle de Bravo. Música en vivo de primer nivel para que tu evento en el lago sea inolvidable.",
    heroImage: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=2070&auto=format&fit=crop",
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const loc = LOCATIONS[params.slug]
  if (!loc) return {}
  return {
    title: loc.title,
    description: loc.description,
  }
}

export default function LocationPage({ params }: { params: { slug: string } }) {
  const loc = LOCATIONS[params.slug]
  if (!loc) notFound()

  return (
    <div className="flex flex-col min-h-screen">
      <NeonBorder />
      <WhatsAppButton />

      {/* -- HERO ---------------------------------------------------------- */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-background z-10" />
          <Image
            src={loc.heroImage}
            alt={`Música en vivo Vendetta en ${loc.fullName}`}
            fill
            priority
            className="object-cover opacity-90 blur-[1px]"
          />
        </div>

        <div className="container relative z-20 px-4 text-center mt-16 flex flex-col items-center">
          <div className="inline-block relative mb-4 z-30 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.3em] backdrop-blur-md">
            ✦ Música en Vivo {loc.name}
          </div>
          <h1 className="animated-title font-heading font-black text-4xl md:text-6xl lg:text-7xl tracking-tighter mb-6 uppercase drop-shadow-2xl leading-[0.85] relative">
            El Show Perfecto <br /> para tu Evento en {loc.name}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Energía real, talento profesional y el mejor repertorio versátil para bodas y eventos en {loc.fullName}.
          </p>
          <a href="/cotizar">
            <Button size="lg" className="font-black text-lg px-10 h-16 rounded-2xl shadow-xl shadow-primary/25 gap-2">
              Cotizar mi fecha <ChevronRight className="w-5 h-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* -- CONTENIDO SEO ------------------------------------------------- */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-black text-white mb-8 uppercase tracking-tight">
              ¿Buscas el mejor grupo musical para tu boda en {loc.fullName}?
            </h2>
            <div className="prose prose-invert max-w-none text-gray-400 text-lg leading-relaxed">
              <p className="mb-6">
                En Vendetta sabemos que la música es el alma de cualquier celebración. Si estás planeando un evento social, una boda o una convención corporativa en <strong>{loc.fullName}</strong>, necesitas un equipo que garantice puntualidad, calidad sonora y sobre todo, una pista de baile llena.
              </p>
              <p className="mb-6">
                Nuestro show incluye lo último en tecnología digital, audio de alta fidelidad y un repertorio que viaja desde los clásicos de los 80s hasta los hits actuales más movidos. Nos adaptamos a la atmósfera de {loc.name} para ofrecer una experiencia personalizada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
              {[
                { icon: Star, title: "Experiencia Premium", text: "Cuidamos cada detalle de nuestra presentación para eventos de alta gama." },
                { icon: Music2, title: "Repertorio Versátil", text: "Desde rock y pop hasta música latina y hits de festival." },
                { icon: Volume2, title: "Audio Profesional", text: "Sistemas Electro-Voice para una claridad de sonido inigualable." },
                { icon: Clock, title: "Logística Total", text: "Llegamos con anticipación para que tú solo te preocupes por disfrutar." }
              ].map((f, i) => (
                <div key={i} className="flex gap-4 p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <f.icon className="w-10 h-10 text-primary shrink-0" />
                  <div>
                    <h3 className="text-white font-black uppercase text-sm mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* -- CTA FINAL ------------------------------------------------------ */}
      <section className="py-24 bg-[#050505] border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-black text-white mb-8 uppercase tracking-tighter">
            ¿Listos para prender fuego <br /> a la pista en {loc.name}?
          </h2>
          <p className="text-gray-400 mb-12 text-lg">
            Estamos agendando fechas para 2026. ¡No te quedes sin la mejor música!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <a href="/cotizar">
                <Button size="lg" className="h-16 px-12 rounded-2xl font-black text-xl shadow-2xl shadow-primary/40 gap-3">
                  <Zap className="w-6 h-6 fill-white" /> Cotizar ahora
                </Button>
              </a>
          </div>
        </div>
      </section>
    </div>
  )
}
