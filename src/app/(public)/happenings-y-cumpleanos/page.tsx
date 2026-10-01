import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WhatsAppButton } from "@/components/public/WhatsAppButton"
import { NeonBorder } from "@/components/public/NeonBorder"
import { 
  PartyPopper, Flame, Music, Sparkles, Volume2, 
  ChevronRight, Zap, CheckCircle2, MapPin, HeartHandshake
} from "lucide-react"

export const metadata: Metadata = {
  title: "Show de Pop & Rock para Fiestas de Cumpleaños y Happenings | Vendetta",
  description: "Lleva un concierto real en vivo a tu fiesta de cumpleaños (30, 40 o 50 años) o happening de evento privado. Cero grupo versátil genérico: sonido de festival, metales y pura adrenalina.",
  alternates: {
    canonical: "/happenings-y-cumpleanos",
  },
  openGraph: {
    title: "Show de Pop & Rock para Cumpleaños y Fiestas Privadas | Vendetta",
    description: "¿Cansado del grupo versátil de siempre? Celebra tu cumpleaños con un concierto en vivo en Metepec, Toluca, Avándaro, CDMX, Cuernavaca o Querétaro.",
    url: "https://vendetta.mx/happenings-y-cumpleanos",
    images: [{ url: "https://vendetta.mx/images/galeria/vendetta-cantante-escenario.jpg" }],
  },
}

export default function HappeningsCumpleanosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#07080D] text-[#F2F0EB]">
      <NeonBorder />
      <WhatsAppButton />

      {/* -- HERO ---------------------------------------------------------- */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-28 pb-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#07080D]/90 via-[#07080D]/65 to-[#07080D] z-10" />
          <Image
            src="/images/galeria/vendetta-cantante-escenario.jpg"
            alt="Show en vivo Vendetta para fiestas de cumpleaños y happenings"
            fill
            priority
            className="object-cover opacity-35"
          />
        </div>

        <div className="container relative z-20 px-4 text-center flex flex-col items-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF5A5F]/40 bg-[#6F0D2B]/30 text-[#FF5A5F] text-xs font-black uppercase tracking-[0.25em] mb-6 backdrop-blur-md">
            <Flame className="w-3.5 h-3.5" /> El Show que Reemplaza al Grupo Versátil
          </div>

          <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl tracking-tighter uppercase mb-6 leading-[0.95] drop-shadow-2xl">
            Un Concierto en Vivo para <br />
            tu <span className="text-gradient-encore italic pr-2">Cumpleaños o Happening</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            ¿Cumples <strong>30, 40 o 50 años</strong> o buscas el momento cumbre para tu fiesta privada? 
            Olvídate de los sombreros de hule espuma y las pistas pregrabadas. Llevamos la energía y el sonido de un festival a tu jardín, quinta o salón.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href="/cotizar" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all gap-2">
                Cotizar mi Cumpleaños o Fiesta <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <a 
              href="https://wa.me/5217222880045?text=Hola,%20quiero%20cotizar%20el%20show%20de%20Vendetta%20para%20un%20cumpleaños/fiesta%20privada." 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 rounded-xl font-bold text-sm uppercase tracking-wider border-white/20 hover:bg-white/10 text-[#F2F0EB]">
                Preguntar por WhatsApp
              </Button>
            </a>
          </div>

          {/* Badges de Cobertura */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Metepec & Toluca</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Avándaro & Valle de Bravo</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> CDMX</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Cuernavaca</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Querétaro</span>
          </div>
        </div>
      </section>

      {/* -- MANIFIESTO: POR QUÉ NO SOMOS GRUPO VERSÁTIL -------------------- */}
      <section className="py-20 bg-[#0B0B14] border-y border-white/10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-bold uppercase tracking-widest mb-4">
              La Diferencia Vendetta
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-white uppercase tracking-tight mb-4">
              ¿Por qué decir adiós al grupo versátil tradicional?
            </h2>
            <p className="text-gray-400 text-base">
              Compara lo que ofrece el estándar convencional frente a la experiencia de concierto que entregamos en cada fecha:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* El Grupo Versátil Clásico */}
            <div className="p-8 rounded-3xl bg-black/40 border border-white/10 opacity-75">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">El Cliché de Siempre</span>
              <h3 className="text-xl font-bold text-white mt-2 mb-4">Grupo Versátil Convencional</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">❌ Pistas pregrabadas de sintetizador que suenan a karaoke.</li>
                <li className="flex items-start gap-2">❌ Las mismas dinámicas de globos, sombreros de foami y pausas constantes.</li>
                <li className="flex items-start gap-2">❌ Bocinas de piso ruidosas que aturden a las mesas cercanas y no dejan platicar.</li>
                <li className="flex items-start gap-2">❌ Músicos improvisados que leen partituras sin conectar con tus amigos.</li>
              </ul>
            </div>

            {/* Vendetta Live Music */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#6F0D2B]/30 to-black/80 border border-[#FF5A5F]/40 shadow-2xl">
              <span className="text-xs font-mono font-bold text-[#FF5A5F] uppercase tracking-widest">Experiencia Vendetta</span>
              <h3 className="text-xl font-bold text-white mt-2 mb-4">Show de Concierto en Vivo</h3>
              <ul className="space-y-3 text-sm text-gray-200">
                <li className="flex items-start gap-2">⚡ <strong>100% en vivo:</strong> Guitarras reales, bajo potente, batería acústica, metales y dos voces estelares.</li>
                <li className="flex items-start gap-2">⚡ <strong>Repertorio demoledor:</strong> Himnos de Pop & Rock de los 80s, 90s y 2000s que todos se saben de memoria.</li>
                <li className="flex items-start gap-2">⚡ <strong>Audio Hi-Fi Line Array e In-Ear:</strong> Sonido nítido como en un disco, calibrado para la acústica de tu espacio.</li>
                <li className="flex items-start gap-2">⚡ <strong>Happening explosivo:</strong> La banda entra y convierte tu fiesta en un festival donde nadie se queda sentado.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -- IDEAL PARA ESTOS MOMENTOS -------------------------------------- */}
      <section className="py-24 bg-[#07080D]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-white uppercase tracking-tight mb-4">
              Momentos Hechos para Vendetta
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
              Diseñado para eventos donde la música en vivo es el plato fuerte y no un simple fondo sonoro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <PartyPopper className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-bold text-white uppercase mb-2">Cumpleaños 30, 40 y 50 Años</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Celebra un cambio de década cantando los himnos de tu juventud: rock en tu idioma, rock clásico en inglés y el mejor pop de época con producción estelar.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <Flame className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white uppercase mb-2">Happening Sorpresa</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                El DJ termina un bloque, se apagan las luces y entra Vendetta a romper la pista. Una intervención de 2 a 3 horas de adrenalina continua sin pausas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <HeartHandshake className="w-10 h-10 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white uppercase mb-2">Fiestas en Ranchos & Jardines</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Nos adaptamos a residenciales en Metepec, quintas en Cuernavaca o casas frente al lago en Avándaro. Montaje limpio, cables ocultos y cero desorden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -- CTA FINAL ------------------------------------------------------ */}
      <section className="py-24 bg-gradient-to-b from-[#0B0B14] to-[#07080D] border-t border-white/10">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl sm:text-5xl font-heading font-black text-white uppercase tracking-tight mb-6">
            Haz de tu Próximo Cumpleaños una Noche Legendaria
          </h2>
          <p className="text-gray-300 mb-10 text-base sm:text-lg leading-relaxed">
            Aparta tu fecha con anticipación y dale a tus invitados una experiencia de concierto que seguirán recordando por años.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/cotizar">
              <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-lg shadow-2xl shadow-primary/40 gap-3 bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB]">
                <Zap className="w-6 h-6 fill-white" /> Cotizar mi Fecha
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
