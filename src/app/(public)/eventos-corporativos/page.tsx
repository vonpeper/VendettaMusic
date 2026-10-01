import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WhatsAppButton } from "@/components/public/WhatsAppButton"
import { NeonBorder } from "@/components/public/NeonBorder"
import { 
  Building2, ShieldCheck, FileText, Clock, Volume2, Award, 
  ChevronRight, Zap, CheckCircle2, Sparkles, MapPin 
} from "lucide-react"

export const metadata: Metadata = {
  title: "Música en Vivo para Eventos Corporativos y Cenas de Gala | Vendetta",
  description: "Banda profesional de pop & rock en vivo para eventos empresariales, congresos, aniversarios de marca y fiestas de fin de año en CDMX, Toluca, Valle de Bravo, Cuernavaca y Querétaro. Facturación CFDI 4.0 y producción de gira.",
  alternates: {
    canonical: "/eventos-corporativos",
  },
  openGraph: {
    title: "Música en Vivo para Eventos Corporativos | Vendetta Live Music",
    description: "Eleva la experiencia de tu fiesta de fin de año, congreso o aniversario de empresa con un show de pop & rock en vivo nivel concierto. Cero grupo versátil genérico.",
    url: "https://vendetta.mx/eventos-corporativos",
    images: [{ url: "https://vendetta.mx/images/galeria/vendetta-musica-corporativo.jpg" }],
  },
}

export default function EventosCorporativosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#07080D] text-[#F2F0EB]">
      <NeonBorder />
      <WhatsAppButton />

      {/* -- HERO CORPORATIVO ---------------------------------------------- */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-28 pb-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#07080D]/90 via-[#07080D]/70 to-[#07080D] z-10" />
          <Image
            src="/images/galeria/vendetta-musica-corporativo.jpg"
            alt="Música en vivo para eventos corporativos Vendetta"
            fill
            priority
            className="object-cover opacity-35"
          />
        </div>

        <div className="container relative z-20 px-4 text-center flex flex-col items-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.25em] mb-6 backdrop-blur-md">
            <Building2 className="w-3.5 h-3.5" /> Entretenimiento Empresarial de Alto Nivel
          </div>

          <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl tracking-tighter uppercase mb-6 leading-[0.95] drop-shadow-2xl">
            El Show en Vivo que tu <br />
            <span className="text-gradient-encore italic pr-2">Evento Corporativo</span> Merece
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            Reemplaza el típico grupo versátil de siempre por una <strong>experiencia real de concierto</strong>. 
            Sonido de gira, ejecución 100% en vivo, puntualidad militar y respaldo administrativo completo para empresas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href="/cotizar" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all gap-2">
                Cotizar Evento Empresarial <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <a 
              href="https://wa.me/5217222880045?text=Hola,%20requiero%20información%20y%20rider%20para%20un%20evento%20corporativo." 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 rounded-xl font-bold text-sm uppercase tracking-wider border-white/20 hover:bg-white/10 text-[#F2F0EB]">
                Contacto Directo con Productor
              </Button>
            </a>
          </div>

          {/* Badges de Cobertura */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> CDMX (Santa Fe · Polanco)</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Toluca & Metepec</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Valle de Bravo</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Cuernavaca</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> Querétaro</span>
          </div>
        </div>
      </section>

      {/* -- PILARES DE CONFIANZA EMPRESARIAL -------------------------------- */}
      <section className="py-20 bg-[#0B0B14] border-y border-white/10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-white uppercase tracking-tight mb-4">
              Cero Complicaciones para tu Comité o Agencia
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Sabemos el nivel de exigencia que requiere un evento empresarial. Cuidamos cada detalle técnico, legal y logístico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FileText,
                title: "Facturación CFDI 4.0",
                text: "Emitimos facturas fiscales en orden con constancia de situación fiscal al día y cumplimiento de normativas."
              },
              {
                icon: Clock,
                title: "Puntualidad Militar",
                text: "Montaje 4 horas antes. Soundcheck discreto e invisible para que la sala esté impecable al recibir a tus invitados."
              },
              {
                icon: Volume2,
                title: "In-Ear & Audio Cristalino",
                text: "Monitoreo inalámbrico. Sin bocinas ruidosas en el piso: el cóctel y las conversaciones de negocio se escuchan con claridad."
              },
              {
                icon: ShieldCheck,
                title: "Foros de Gran Formato",
                text: "Experiencia en recintos de alta exigencia: WTC CDMX, centros de convenciones, haciendas y hoteles de cadena internacional."
              }
            ].map((card, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/40 transition-all">
                <card.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-white font-bold text-lg mb-2 uppercase tracking-tight">{card.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- FORMATOS ADAPTABLES PARA TU EVENTO ------------------------------ */}
      <section className="py-24 bg-[#07080D]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Formatos Modulares
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-white uppercase tracking-tight mb-4">
              De la Elegancia del Cóctel al Clímax de la Fiesta
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
              Nos adaptamos a las distintas fases del itinerario corporativo con transiciones suaves y energía calculada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-black/50 border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">Fase 1</span>
                <h3 className="text-xl font-bold text-white mt-2 mb-4 uppercase">Cóctel & Networking</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Set acústico o ensamble lounge pop/rock instrumental y vocal a volumen moderado para ambientar la llegada de invitados sin interrumpir el networking.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Volumen controlado</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Presencia elegante</li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-black/50 border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">Fase 2</span>
                <h3 className="text-xl font-bold text-white mt-2 mb-4 uppercase">Premiación & Protocolo</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Fanfarrias en vivo, entradas sonoras con metales y ambientación dinámica para lanzamientos de producto, rifas o reconocimientos de fin de año.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Microfonía lista para speakers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sincronía con timeline del evento</li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#6F0D2B]/30 to-black/80 border border-primary/40 flex flex-col justify-between shadow-2xl">
              <div>
                <span className="text-xs font-mono font-bold text-[#FF5A5F] uppercase tracking-widest">Fase 3 · Estelar</span>
                <h3 className="text-xl font-bold text-white mt-2 mb-4 uppercase">Fiesta Total en Vivo</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Show estelar de 2 a 3 horas continuas. Septeto con sección de metales, dos vocalistas y los himnos de pop & rock más coreados de los 80s, 90s y 2000s.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-gray-200">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pista 100% encendida</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cero canciones trilladas</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -- CASO DE ÉXITO WTC RESALTADO ----------------------------------- */}
      <section className="py-20 bg-[#0B0B14] border-t border-white/10">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs uppercase tracking-widest mb-4">
            <Award className="w-4 h-4 text-primary" /> Caso de Éxito Corporativo
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-white uppercase tracking-tight mb-6">
            Más de 800 médicos y directivos en el World Trade Center CDMX
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Fuimos la banda estelar en la Cena de Inauguración del LI Curso Anual de Anestesiología en el Salón Olmeca del WTC, llevando un viaje musical que desbordó energía y ovaciones.
          </p>
          <Link href="/noticias/wtc-comexane">
            <Button variant="outline" className="border-white/20 text-[#F2F0EB] hover:bg-white/10">
              Leer reseña y ver fotos del WTC <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* -- CTA FINAL CORPORATIVO ------------------------------------------ */}
      <section className="py-24 bg-gradient-to-b from-[#0B0B14] to-[#07080D] border-t border-white/10">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl sm:text-5xl font-heading font-black text-white uppercase tracking-tight mb-6">
            Asegura la Fecha de tu Evento Empresarial
          </h2>
          <p className="text-gray-300 mb-10 text-base sm:text-lg leading-relaxed">
            Las fechas de fin de año, aniversarios y congresos se reservan con meses de anticipación.
            Consulta disponibilidad y recibe una propuesta formal con desglose técnico.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/cotizar">
              <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-lg shadow-2xl shadow-primary/40 gap-3 bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB]">
                <Zap className="w-6 h-6 fill-white" /> Solicitar Propuesta Corporativa
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
