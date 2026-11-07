import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WhatsAppButton } from "@/components/public/WhatsAppButton"
import { NeonBorder } from "@/components/public/NeonBorder"
import { 
  Flame, 
  Sparkles, 
  ChevronRight, 
  Zap, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  Volume2, 
  Music, 
  Disc, 
  Radio, 
  Sliders, 
  Home, 
  XCircle,
  Clock,
  Phone
} from "lucide-react"

export const metadata: Metadata = {
  title: "Banda de Pop Rock para Fiestas y Cumpleaños en Metepec | Vendetta",
  description: "Grupo de Pop Rock en vivo (80s, Rock en tu Idioma, Ska, Disco, 2000s) para fiestas privadas, terrazas y cumpleaños en Metepec y Toluca. ¡Cotiza tu fecha!",
  alternates: {
    canonical: "/fiestas-privadas-metepec",
  },
  openGraph: {
    title: "Banda de Pop Rock para Fiestas y Cumpleaños en Metepec | Vendetta",
    description: "Lleva un concierto de Pop Rock 100% en vivo a tu fiesta privada o cumpleaños en Metepec y Toluca. Cero pistas pregrabadas. ¡Cotiza tu fecha con apartado del 30%!",
    url: "https://vendetta.mx/fiestas-privadas-metepec",
    siteName: "Vendetta Live Music",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "https://vendetta.mx/images/galeria/vendetta-banda-en-vivo-evento.jpg",
        width: 1200,
        height: 630,
        alt: "Banda de Pop Rock en vivo para fiestas privadas en Metepec - Vendetta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Banda de Pop Rock para Fiestas y Cumpleaños en Metepec | Vendetta",
    description: "Música 100% en vivo para fiestas caseras, terrazas y cumpleaños en Metepec. Cero pistas. Cero música genérica.",
    images: ["https://vendetta.mx/images/galeria/vendetta-banda-en-vivo-evento.jpg"],
  },
}

const REPERTOIRE_BLOCKS = [
  {
    title: "Rock en tu Idioma",
    badge: "Clásicos en Español",
    icon: Flame,
    color: "text-[#FF5A5F]",
    bgColor: "bg-[#6F0D2B]/20",
    borderColor: "border-[#FF5A5F]/30",
    artists: "Caifanes, Soda Stereo, Enanitos Verdes, Hombres G, Miguel Mateos, El Tri, Jaguares, Duncan Dhu",
    description: "Las canciones que todos tus invitados cantan a coro de principio a fin, con la fuerza y autenticidad del rock latinoamericano."
  },
  {
    title: "Pop & Rock 80's en Inglés",
    badge: "Golden Era",
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    artists: "Queen, Bon Jovi, The Police, Journey, Billy Idol, Def Leppard, Michael Jackson, Dire Straits",
    description: "Poderosas guitarras eléctricas, solos legendarios y armonías vocales estelares que elevan la adrenalina de la pista."
  },
  {
    title: "Ska Festivo",
    badge: "Explosión y Baile",
    icon: Radio,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    artists: "Los Fabulosos Cadillacs, Panteón Rococó, Inspector, Los Auténticos Decadentes, La Castañeda",
    description: "El momento cumbre del slam y la fiesta: ritmos bailables con percusión enérgica que ponen a saltar a todos sin excepción."
  },
  {
    title: "Disco & Funk Classics",
    badge: "Groove en Vivo",
    icon: Disc,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    artists: "ABBA, Bee Gees, Earth Wind & Fire, Kool & The Gang, KC and the Sunshine Band, Gloria Gaynor",
    description: "Líneas de bajo con funk demoledor y ritmo bailable ininterrumpido ejecutado con batería acústica real."
  },
  {
    title: "Himnos de los 2000's",
    badge: "Millennial Rock",
    icon: Music,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    artists: "The Killers, Coldplay, Zoé, Maroon 5, Franz Ferdinand, Muse, Moderatto, Kinky",
    description: "Los himnos modernos que marcaron tus años de universidad y juventud, recreados con la frescura y fidelidad de estudio."
  }
]

const RESIDENTIAL_ZONES = [
  "Club de Golf San Carlos",
  "La Asunción",
  "Providencia",
  "Bellavista",
  "Condado del Valle",
  "Foresta Laguna",
  "Calzada del Pacífico",
  "San Jerónimo Chicahualco",
  "Metepec Centro",
  "Toluca Residencial",
  "San Mateo Atenco",
  "Lerma / Los Encinos"
]

export default function FiestasPrivadasMetepecPage() {
  const quoteUrl = "/cotizar?motivo=Cumplea%C3%B1os&estado=Estado+de+M%C3%A9xico&municipio=Metepec"
  const waUrl = "https://wa.me/5217222880045?text=Hola,%20me%20interesa%20cotizar%20la%20banda%20Vendetta%20para%20una%20fiesta%20privada%20o%20cumpleaños%20en%20Metepec."

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MusicGroup",
        "name": "Vendetta Live Music",
        "url": "https://vendetta.mx/fiestas-privadas-metepec",
        "image": "https://vendetta.mx/images/galeria/vendetta-banda-en-vivo-evento.jpg",
        "description": "Banda de Pop Rock 100% en vivo para fiestas privadas, terrazas y cumpleaños en Metepec y Toluca.",
        "genre": [
          "Pop Rock",
          "Rock en Español",
          "80s Rock",
          "Ska",
          "Disco",
          "2000s Rock"
        ],
        "knowsAbout": "Música en vivo para cumpleaños y fiestas privadas en jardines",
        "areaServed": [
          { "@type": "City", "name": "Metepec" },
          { "@type": "City", "name": "Toluca" },
          { "@type": "City", "name": "San Mateo Atenco" },
          { "@type": "City", "name": "Lerma" },
          { "@type": "City", "name": "Zinacantepec" }
        ]
      },
      {
        "@type": "EntertainmentBusiness",
        "name": "Vendetta Live Music - Fiestas Privadas Metepec",
        "image": "https://vendetta.mx/images/galeria/vendetta-banda-en-vivo-evento.jpg",
        "url": "https://vendetta.mx/fiestas-privadas-metepec",
        "telephone": "+527222880045",
        "priceRange": "$$",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Metepec",
          "addressRegion": "Estado de México",
          "addressCountry": "MX"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "19.2564",
          "longitude": "-99.6048"
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
          ],
          "opens": "09:00",
          "closes": "23:00"
        }
      }
    ]
  }

  return (
    <div className="flex flex-col min-h-screen w-full relative bg-[#07080D] text-[#F2F0EB]">
      {/* Schema Markup Local */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <NeonBorder />
      <WhatsAppButton />

      {/* -- 1. HERO SECTION ------------------------------------------------ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32 pb-20 border-b border-white/10">
        {/* Fondo de Concierto con Degradado Cinemático */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#07080D]/95 via-[#07080D]/80 to-[#07080D] z-10" />
          <Image
            src="/images/galeria/vendetta-banda-en-vivo-evento.jpg"
            alt="Banda de Pop Rock Vendetta tocando en vivo para fiesta privada en Metepec"
            fill
            priority
            className="object-cover opacity-35 object-center"
          />
        </div>

        <div className="container relative z-20 px-4 text-center flex flex-col items-center max-w-5xl mx-auto">
          {/* Badge Posicionamiento Frontal Anti-Versátil */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF5A5F]/40 bg-[#6F0D2B]/35 text-[#FF5A5F] text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] mb-8 backdrop-blur-md shadow-lg shadow-black/60">
            <Flame className="w-3.5 h-3.5 fill-[#FF5A5F]" />
            Banda en Vivo en Metepec & Toluca • NO somos grupo versátil
          </div>

          <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] tracking-tighter uppercase mb-6 leading-[0.93] drop-shadow-2xl max-w-4xl">
            Lleva la energía de un concierto de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A5F] via-[#FF8A8E] to-[#FFC2C4] italic">
              Pop Rock
            </span>{" "}
            a tu fiesta privada
          </h1>

          <p className="text-base sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 font-normal leading-relaxed">
            El soundtrack de tu generación <strong className="text-white font-bold">100% en vivo</strong> para tu cumpleaños, jardín o terraza residencial. Audio de alta definición calibrado para no saturar tu espacio.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href={quoteUrl} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-16 px-10 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] shadow-2xl shadow-[#FF5A5F]/30 hover:scale-[1.02] hover:opacity-95 transition-all gap-3 cursor-pointer">
                Cotizar Fiesta en Metepec <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>

            <a 
              href={waUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-8 rounded-2xl font-bold text-sm sm:text-base uppercase tracking-wider border-white/20 hover:bg-white/10 text-[#F2F0EB] gap-2.5 cursor-pointer backdrop-blur-md">
                <Phone className="w-4 h-4 text-[#25D366]" /> Contactar por WhatsApp
              </Button>
            </a>
          </div>

          {/* Badges de Cobertura Residencial Metepec */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-12 text-xs text-gray-400 font-medium max-w-3xl">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" /> Metepec
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" /> San Carlos
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" /> La Asunción
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" /> Providencia
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" /> Bellavista
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" /> Toluca
            </span>
          </div>
        </div>
      </section>

      {/* -- 2. REPERTORIO CURADO: "LO QUE SÍ TOCAMOS" ---------------------- */}
      <section className="py-24 bg-[#0B0B14] relative overflow-hidden border-b border-white/10">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#FF5A5F] text-xs font-black uppercase tracking-widest mb-4">
              <Music className="w-3.5 h-3.5" /> Repertorio Curado & Demoledor
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-white uppercase tracking-tight mb-4">
              Lo que SÍ tocamos: Solo himnos legendarios
            </h2>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Curaduría musical sin relleno. Diseñamos un setlist dinámico de 2 a 3 horas que conecta de inmediato con tus amigos y familiares, manteniendo la pista encendida sin baches.
            </p>
          </div>

          {/* Grid de 5 Bloques de Repertorio */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REPERTOIRE_BLOCKS.map((block, idx) => {
              const Icon = block.icon
              return (
                <div 
                  key={idx}
                  className={`p-7 rounded-3xl bg-gradient-to-b from-white/[0.05] via-black/40 to-black/70 border ${block.borderColor} shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${block.bgColor} ${block.color}`}>
                        <Icon className="w-3 h-3" /> {block.badge}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight mb-3">
                      {block.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
                      {block.description}
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-4 mt-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-gray-400 tracking-wider block mb-1.5">
                      Artistas en el Setlist:
                    </span>
                    <span className="text-xs font-semibold text-white/90 leading-snug block">
                      {block.artists}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Tarjeta Promesa de Valor: Cero Pistas */}
            <div className="p-7 rounded-3xl bg-gradient-to-br from-[#6F0D2B]/40 via-black to-[#07080D] border-2 border-[#FF5A5F]/50 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF5A5F]/20 text-[#FF5A5F] mb-4">
                  <ShieldCheck className="w-3.5 h-3.5" /> Garantía de Ejecución
                </div>

                <h3 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight mb-3">
                  100% En Vivo en Tiempo Real
                </h3>

                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed space-y-2">
                  <span>Toda la música se ejecuta <strong>en tiempo real</strong> por músicos profesionales con instrumentos de alta gama y voces estelares.</span>
                </p>
              </div>

              <div className="border-t border-[#FF5A5F]/30 pt-4 mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" /> Cero pistas pregrabadas
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" /> Cero dinámicas de foami o globos
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" /> Cero música genérica de salón
                </div>
              </div>
            </div>
          </div>

          {/* Banner de Valor Anti-Versátil Categórico */}
          <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-[#6F0D2B]/15 border border-[#FF5A5F]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FF5A5F]/20 border border-[#FF5A5F]/40 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-[#FF5A5F]" />
              </div>
              <div>
                <h4 className="text-lg font-heading font-black text-white uppercase">
                  Declaración Anti-Versátil
                </h4>
                <p className="text-xs sm:text-sm text-gray-300">
                  No tocamos cumbia, reggaetón ni géneros de baile de salón tradicional. Somos una <strong>banda especializada de Pop Rock</strong> que hace de tu fiesta una experiencia de concierto memorable.
                </p>
              </div>
            </div>

            <Link href={quoteUrl} className="shrink-0 w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-12 px-6 rounded-xl font-black text-xs uppercase tracking-wider bg-[#FF5A5F] hover:bg-[#ff4348] text-white">
                Apartar mi Fecha
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* -- 3. DISEÑADO PARA CASAS Y JARDINES RESIDENCIALES ------------------ */}
      <section className="py-24 bg-[#07080D] relative border-b border-white/10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">
              <Home className="w-3.5 h-3.5" /> Especialistas Residenciales
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-white uppercase tracking-tight mb-4">
              Diseñado para casas, terrazas y jardines en Metepec
            </h2>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Sabemos que organizar un evento en tu propia casa o fraccionamiento exige respeto por tu espacio, estética impecable y un sonido que no sature la convivencia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Beneficio 1 */}
            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mb-6">
                  <Sliders className="w-6 h-6 text-[#FF5A5F]" />
                </div>
                <h3 className="text-xl font-heading font-black text-white uppercase mb-3">
                  Montaje Compacto & Limpio
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Cero armatostes industriales, estructuras aparatosas ni cableado atravesado por el jardín. Montamos con microfonía inalámbrica y equipo modular de alta gama que respeta la estética de tu hogar.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-mono font-bold text-gray-400">
                ✓ Espacio mínimo: 4x3 metros
              </div>
            </div>

            {/* Beneficio 2 */}
            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
                  <Volume2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-heading font-black text-white uppercase mb-3">
                  Control Inteligente de Decibeles
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Sonido nítido, potente y con pegada en la pista de baile, pero con dispersión dirigida para que en las mesas tus invitados puedan platicar cómodamente sin necesidad de gritarse.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-mono font-bold text-gray-400">
                ✓ Audio Line Array Hi-Fi calibrado
              </div>
            </div>

            {/* Beneficio 3 */}
            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-heading font-black text-white uppercase mb-3">
                  Logística Residencial Puntual
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Conocemos la logística de privadas y fraccionamientos residenciales en Metepec. Coordinamos accesos con la caseta de vigilancia, llegamos 2 horas antes y realizamos soundcheck silencioso.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-mono font-bold text-gray-400">
                ✓ Respeto a horarios de tu privada
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- 4. TABLA COMPARATIVA: EL CLICHÉ VS VENDETTA --------------------- */}
      <section className="py-24 bg-[#0B0B14] relative border-b border-white/10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-white uppercase tracking-tight mb-4">
              ¿Por qué elegir a Vendetta y no a un grupo versátil?
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Si buscas una experiencia de concierto genuina donde la música sea la protagonista, compara el estándar tradicional con nuestra propuesta:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Grupo Versátil Tradicional */}
            <div className="p-8 rounded-3xl bg-black/50 border border-red-500/20 opacity-80">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 uppercase tracking-widest mb-3">
                <XCircle className="w-4 h-4" /> El Cliché Convencional
              </div>
              <h3 className="text-xl font-bold text-white mb-6">Grupo Versátil de Salón</h3>
              <ul className="space-y-4 text-xs sm:text-sm text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Pistas pregrabadas:</strong> Secuencias de sintetizador baratas que suenan a karaoke genérico.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Sombreros de foami y globos:</strong> Las mismas dinámicas mecánicas que interrumpen el flujo de la fiesta.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Bocinas estridentes:</strong> Ruido ensordecedor que aturde a los comensales y ahuyenta la plática.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Músicos improvisados:</strong> Integrantes que leen partituras en tabletas sin conectar con la gente.</span>
                </li>
              </ul>
            </div>

            {/* Vendetta Live Music */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#6F0D2B]/35 to-black border-2 border-[#FF5A5F]/60 shadow-2xl shadow-[#FF5A5F]/20">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF5A5F] uppercase tracking-widest mb-3">
                <CheckCircle2 className="w-4 h-4" /> La Experiencia Vendetta
              </div>
              <h3 className="text-xl font-bold text-white mb-6">Show de Pop Rock en Vivo</h3>
              <ul className="space-y-4 text-xs sm:text-sm text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-[#FF5A5F] font-bold">✓</span>
                  <span><strong>100% en vivo:</strong> Guitarras acústicas y eléctricas, bajo firme, batería real y voces estelares.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF5A5F] font-bold">✓</span>
                  <span><strong>Repertorio generacional:</strong> Los himnos de Pop, Rock en tu Idioma, 80s y Ska que marcaron tu vida.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF5A5F] font-bold">✓</span>
                  <span><strong>Sonido calibrado Hi-Fi:</strong> Claridad de estudio sin aturdir a las mesas de conversación.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#FF5A5F] font-bold">✓</span>
                  <span><strong>Energía de festival:</strong> Músicos apasionados que interactúan y contagian euforia a tus invitados.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -- 5. RESIDENCIALES DE MAYOR COBERTURA EN METEPEC ----------------- */}
      <section className="py-20 bg-[#07080D] border-b border-white/10">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight mb-4">
            Presencia habitual en fraccionamientos de Metepec & Toluca
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-2xl mx-auto mb-8">
            Conocemos los accesos, la seguridad de caseta y las normas de decibeles de las principales zonas residenciales del Valle de Toluca:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {RESIDENTIAL_ZONES.map((zone, idx) => (
              <span 
                key={idx}
                className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white hover:border-[#FF5A5F]/40 transition-colors"
              >
                📍 {zone}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* -- 6. CTA FINAL DE CONVERSIÓN CON PRELLENADO ---------------------- */}
      <section className="py-24 bg-gradient-to-b from-[#0B0B14] via-[#42112D]/40 to-[#07080D] relative overflow-hidden">
        <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#FF5A5F] text-xs font-black uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Temporada de Fiestas y Cumpleaños
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-white uppercase tracking-tight mb-6 leading-tight">
            Haz de tu fiesta en Metepec un concierto inolvidable
          </h2>

          <p className="text-gray-300 mb-10 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Verifica disponibilidad inmediata para tu fecha. Recibe tu propuesta personalizada con folio express y apartado seguro con el 30%.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={quoteUrl} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-16 px-10 rounded-2xl font-black text-base uppercase tracking-wider bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] shadow-2xl shadow-[#FF5A5F]/40 hover:scale-[1.02] transition-all gap-3 cursor-pointer">
                <Zap className="w-5 h-5 fill-white" /> Cotizar Fiesta en Metepec
              </Button>
            </Link>

            <a 
              href={waUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-8 rounded-2xl font-bold text-base uppercase tracking-wider border-white/20 hover:bg-white/10 text-[#F2F0EB] gap-2.5 cursor-pointer backdrop-blur-md">
                <Phone className="w-4 h-4 text-[#25D366]" /> WhatsApp Inmediato
              </Button>
            </a>
          </div>

          <p className="text-xs text-gray-400 mt-6 font-mono">
            * Consulta disponibilidad de fecha sin compromiso. Respuesta oficial en menos de 15 minutos.
          </p>
        </div>
      </section>
    </div>
  )
}
