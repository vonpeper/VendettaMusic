import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { ChevronRight, Music2, Star, Zap, Volume2, Clock } from "lucide-react"
import Image from "next/image"
import { WhatsAppButton } from "@/components/public/WhatsAppButton"
import { NeonBorder } from "@/components/public/NeonBorder"

const LOCATIONS: Record<string, any> = {
  "metepec": {
    name: "Metepec",
    fullName: "Metepec y Alrededores",
    title: "Música en Vivo y Shows para Fiestas y Eventos en Metepec | Vendetta",
    description: "El mejor show de pop & rock en vivo en inglés y español para fiestas privadas, cumpleaños, eventos corporativos y celebraciones en Metepec. Experiencia real de concierto.",
    heroImage: "https://images.unsplash.com/photo-1468359601543-843bfaef291a?q=80&w=2074&auto=format&fit=crop",
  },
  "toluca": {
    name: "Toluca",
    fullName: "Toluca y Metepec",
    title: "Banda de Pop & Rock en Vivo para Eventos en Toluca | Vendetta",
    description: "Show musical de alto impacto para eventos corporativos, cumpleaños, festivales y fiestas privadas en Toluca y Lerma. Producción profesional completa.",
    heroImage: "https://images.unsplash.com/photo-1468359601543-843bfaef291a?q=80&w=2074&auto=format&fit=crop",
  },
  "cdmx": {
    name: "CDMX",
    fullName: "Ciudad de México y Poniente",
    title: "Banda de Pop & Rock para Eventos y Corporativos en CDMX | Vendetta",
    description: "Show en vivo con sonido de festival para eventos corporativos, galas y fiestas privadas en CDMX (Santa Fe, Polanco, Interlomas y más).",
    heroImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&auto=format&fit=crop",
  },
  "valle-de-bravo": {
    name: "Valle de Bravo",
    fullName: "Valle de Bravo y el Lago",
    title: "Show de Pop & Rock en Vivo en Valle de Bravo | Vendetta",
    description: "Música en vivo para casas de fin de semana, eventos corporativos y celebraciones exclusivas en Valle de Bravo. Experiencia premium de concierto.",
    heroImage: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=2070&auto=format&fit=crop",
  },
  "avandaro": {
    name: "Avándaro",
    fullName: "Avándaro y Valle de Bravo",
    title: "Música en Vivo para Fiestas Privadas en Avándaro | Vendetta",
    description: "Lleva un show de pop & rock de primer nivel a tu casa, rancho o club en Avándaro. Cero pistas pregrabadas, energía real de festival.",
    heroImage: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=2070&auto=format&fit=crop",
  },
  "cuernavaca": {
    name: "Cuernavaca",
    fullName: "Cuernavaca y Morelos",
    title: "Banda de Rock en Vivo para Jardines y Eventos en Cuernavaca | Vendetta",
    description: "Show estelar y happening de pop & rock para jardines de eventos, haciendas, cumpleaños y corporativos en Cuernavaca, Jiutepec y Morelos.",
    heroImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop",
  },
  "queretaro": {
    name: "Querétaro",
    fullName: "Querétaro, Viñedos y San Juan del Río",
    title: "Música en Vivo para Eventos y Viñedos en Querétaro | Vendetta",
    description: "Show musical en vivo para haciendas, viñedos, eventos corporativos y fiestas privadas en Querétaro y Tequisquiapan. Producción de audio de gira.",
    heroImage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=2070&auto=format&fit=crop",
  }
}

export function generateStaticParams() {
  return Object.keys(LOCATIONS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const loc = LOCATIONS[slug]
  if (!loc) return {}
  const title = loc.title;
  const description = loc.description;
  const image = 'https://vendetta.mx/images/shows/arma-tu-show.jpg';
  return {
    title,
    description,
    alternates: {
      canonical: `/musica-para-eventos/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://vendetta.mx/musica-para-eventos/${slug}`,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const loc = LOCATIONS[slug]
  if (!loc) notFound()

  return (
    <div className="flex flex-col min-h-screen">
      <NeonBorder />
      <WhatsAppButton />

      {/* -- HERO ---------------------------------------------------------- */}
      <section className="relative h-[65vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-background z-10" />
          <Image
            src={loc.heroImage}
            alt={`Show en vivo Vendetta en ${loc.fullName}`}
            fill
            priority
            className="object-cover opacity-80 blur-[1px]"
          />
        </div>

        <div className="container relative z-20 px-4 text-center mt-16 flex flex-col items-center">
          <div className="inline-block relative mb-4 z-30 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.3em] backdrop-blur-md">
            ✦ Show en Vivo & Happening • {loc.name}
          </div>
          <h1 className="animated-title font-heading font-black text-4xl md:text-6xl lg:text-7xl tracking-tighter mb-6 uppercase drop-shadow-2xl leading-[0.9] relative text-white">
            El Show Perfecto <br /> para tu Evento en {loc.name}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            Energía real de concierto, metales en vivo y los mejores himnos de pop & rock en inglés y español. Cero pistas pregrabadas, 100% adrenalina para celebraciones en {loc.fullName}.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a href="/cotizar">
              <Button size="lg" className="font-black text-base px-8 h-14 rounded-xl shadow-xl shadow-primary/25 gap-2 bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB]">
                Cotizar Fecha en {loc.name} <ChevronRight className="w-5 h-5" />
              </Button>
            </a>
            <a href="/#servicios">
              <Button variant="outline" size="lg" className="font-bold text-base px-6 h-14 rounded-xl border-white/20 text-[#F2F0EB] hover:bg-white/10">
                Ver Rider & Formato
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* -- MANIFIESTO POP ROCK EN VIVO & CONTENIDO SEO ----------------------- */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF5A5F]/30 bg-[#6F0D2B]/20 text-[#FF5A5F] font-bold text-xs uppercase tracking-widest mb-4">
              Cero Pistas • Sonido de Gira
            </div>
            <h2 className="text-3xl md:text-5xl font-heading font-black text-white mb-8 uppercase tracking-tight">
              ¿Por qué elegir un show de pop & rock en lugar de la banda tradicional en {loc.fullName}?
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300 text-lg leading-relaxed space-y-6">
              <p>
                En <strong>Vendetta</strong> entendemos que en una gran celebración no hay espacio para la monotonía. Ofrecemos un show auténtico de pop & rock en inglés y español: no usamos pistas pregrabadas, sombreros de hule espuma ni coreografías acartonadas.
              </p>
              <p>
                Tocamos con la fuerza, distorsión, armonías vocales y clímax de una <strong>banda en gira de festival</strong>. Ya sea para un <strong>happening estelar</strong>, una <strong>fiesta de cumpleaños inolvidable (30, 40 o 50 años)</strong>, una <strong>gala o cena corporativa</strong>, o un <strong>festival en {loc.name}</strong>, llevamos un concierto real que pone a todos a cantar a todo pulmón.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
              {[
                { 
                  icon: Star, 
                  title: "Happening & Show Estelar", 
                  text: "El momento cumbre de la fiesta: 2 a 3 horas continuas de energía explosiva para cuando la pista necesita arder." 
                },
                { 
                  icon: Music2, 
                  title: "Repertorio de Concierto", 
                  text: "Himnos legendarios de los 80s, 90s y 2000s en inglés y español. Queen, Guns N' Roses, Soda Stereo, Bon Jovi, Caifanes y más." 
                },
                { 
                  icon: Volume2, 
                  title: "Audio Pro Line Array & In-Ear", 
                  text: "Sistemas Electro-Voice de alta fidelidad y monitoreo inalámbrico para sonido cristalino y cero ruido de escenario en el salón o jardín." 
                },
                { 
                  icon: Clock, 
                  title: "Puntualidad Militar & Logística", 
                  text: "Llegamos 4 horas antes para montaje silencioso y soundcheck invisible. Cero estrés para el anfitrión." 
                }
              ].map((f, i) => (
                <div key={i} className="flex gap-4 p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#FF5A5F]/30 transition-all">
                  <f.icon className="w-10 h-10 text-primary shrink-0" />
                  <div>
                    <h3 className="text-white font-black uppercase text-sm mb-2">{f.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{f.text}</p>
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
          <h2 className="text-4xl md:text-5xl font-heading font-black text-white mb-6 uppercase tracking-tighter">
            ¿Listos para prender fuego <br /> a la pista en {loc.name}?
          </h2>
          <p className="text-gray-400 mb-10 text-lg max-w-xl mx-auto">
            Disponibilidad para eventos privados, cumpleaños y corporativos en {loc.fullName}.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <a href="/cotizar">
                <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-lg shadow-2xl shadow-primary/40 gap-3 bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB]">
                  <Zap className="w-6 h-6 fill-white" /> Cotizar ahora en {loc.name}
                </Button>
              </a>
          </div>
        </div>
      </section>
    </div>
  )
}
