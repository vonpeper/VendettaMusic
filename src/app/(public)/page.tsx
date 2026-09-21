import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PaquetesSection } from "@/components/public/PaquetesSection"
import {
  Volume2, Cpu, Music2, Star, Clock, ChevronRight, Quote, Zap, Loader2, MapPin, Activity, Flame, Radio, Disc3
} from "lucide-react"
import { MusiciansSection } from "@/components/public/MusiciansSection"
import { UpcomingGigs } from "@/components/public/UpcomingGigs"
import { VideoSection } from "@/components/public/VideoSection"
import { InstagramReelsSection } from "@/components/public/InstagramReelsSection"
import { PhotoGallery } from "@/components/public/PhotoGallery"
import { NeonBorder } from "@/components/public/NeonBorder"
import { ConcertAtmosphere } from "@/components/public/ConcertAtmosphere"
import { LiveStageMixer } from "@/components/public/LiveStageMixer"
import { VinylShowcase } from "@/components/public/VinylShowcase"
import { WhatsAppButton } from "@/components/public/WhatsAppButton"
import { VendettaExperience } from "@/components/public/VendettaExperience"
import { Suspense } from "react"
import Image from "next/image"
import { db } from "@/lib/db"
import { ReviewModal } from "@/components/public/ReviewModal"
import { StatusSearch } from "@/components/public/StatusSearch"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vendetta | Banda de Pop & Rock en Vivo para Bodas y Eventos",
  description: "Banda profesional de pop y rock en vivo para bodas, eventos corporativos y celebraciones en Toluca, CDMX y Valle de Bravo. Experiencia real de concierto con producción de gira.",
  keywords: ["música en vivo bodas", "banda pop rock eventos", "show pop rock en vivo toluca", "concierto eventos cdmx", "música para eventos valle de bravo"],
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'xjvpyyI3SwGAqhLJVUhNf23uPakHwn4fkJ82NMkpNpY',
  },
}

// La home lee paquetes/medios/reseñas de la DB en cada request — no debe pre-renderizarse
// estáticamente o queda con el snapshot del build (vacío si la DB se llenó después del deploy).
export const dynamic = "force-dynamic"

const CLIENTS = [
  "WTC México", "COMEXANE A.C", "Secretaría de Salud Edomex",
  "Ayuntamiento de Toluca", "Ayuntamiento de Ocoyoacac",
  "Ayuntamiento de Santiago Tianguistenco", "UNTICKET",
  "Harley Davidson", "Bistró Mecha", "Alquimia 73",
  "Bruma", "McCarthy's Irish Pub",
  "Ayuntamiento de Ixtapan de la Sal", "Teatro Quimera"
]

export default async function HomePage() {
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  const allMedia = await db.siteMedia.findMany()
  const mediaMap = {
    hero: allMedia.find((m: any) => m.section === "hero")?.url || "https://images.unsplash.com/photo-1468359601543-843bfaef291a?q=80&w=2074&auto=format&fit=crop",
    mentiras: allMedia.find((m: any) => m.section === "mentiras")?.url || "/images/shows/mentiras.jpg",
    arma_tu_show: allMedia.find((m: any) => m.section === "arma_tu_show")?.url || "/images/shows/arma-tu-show.jpg",
    video_home: allMedia.find((m: any) => m.section === "video_home")?.url || "",
    reels: allMedia.filter((m: any) => (m.section === "reels" || m.section === "instagram") && m.url),
    galeria: allMedia
      .filter((m: any) => m.section === "galeria" && m.url && !m.url.includes("_n.jpg"))
      .map((m: any) => m.url as string),
  }
  
  const liveDbReviews = await db.review.findMany({ 
    where: { status: "approved" }, 
    orderBy: { createdAt: "desc" } 
  })
  
  const liveMusicians = await db.publicBandMember.findMany({
    orderBy: { order: "asc" }
  })

  const dbPackages = await db.package.findMany({
    where: { NOT: { isCustom: true } },
    include: { serviceItems: { orderBy: { order: "asc" } } },
    orderBy: { baseCostPerHour: "asc" }
  })

  return (
    <div className="flex flex-col min-h-screen">
      <NeonBorder />
      <ConcertAtmosphere />
      <WhatsAppButton />

      {/* -- HERO ---------------------------------------------------------- */}
      <section id="inicio" className="relative min-h-screen lg:h-screen flex items-center justify-start overflow-hidden bg-gradient-to-br from-[#07080D] via-[#15152B] to-[#42112D] pt-24 pb-12 lg:py-0">
        {/* Dynamic Aurora lighting beams in background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="aurora-layer-1 -top-20 left-10 animate-aurora-drift opacity-70" />
          <div className="aurora-layer-2 bottom-10 right-20 animate-aurora-reverse opacity-60" />
          <div className="aurora-layer-3 top-1/2 left-1/3 opacity-40" />
          <div className="absolute inset-0 stage-grid-overlay opacity-30" />
        </div>

        {/* Background Image Container - Desktop (>=lg) */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[60%] xl:w-[63%] 2xl:w-[66%] z-0 select-none pointer-events-none animate-hero-bg hidden lg:block">
          <Image
            src="/images/vendetta-web-assets/vendetta-hero.jpg"
            alt="Banda de pop y rock en vivo Vendetta para eventos sociales y bodas"
            fill
            priority
            unoptimized
            className="opacity-95 object-contain object-bottom-right"
          />
          {/* Smooth gradient blend into Midnight Stage background */}
          <div className="absolute inset-y-0 left-0 w-44 bg-gradient-to-r from-[#07080D] via-[#07080D]/85 to-transparent z-10" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#07080D]/90 via-[#07080D]/50 to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-20 sm:h-24 bg-gradient-to-t from-[#07080D] to-transparent z-10" />
        </div>

        <div className="container relative z-20 px-4 md:px-8 lg:px-16 mx-auto flex items-center w-full">
          <div className="w-full lg:max-w-[480px] xl:max-w-[540px] 2xl:max-w-[600px] text-left flex flex-col items-start pt-6 lg:pt-0">
            {/* Amplifier Pilot Light & Season Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F2F0EB] mb-4 animate-hero-line-1">
              <span className="w-2.5 h-2.5 rounded-full amp-jewel-ruby" />
              <span>LIVE POP & ROCK CONCERT • 2026</span>
            </div>
            
            <h1 className="font-sans font-black uppercase text-left tracking-tight leading-[0.92] text-[clamp(2.3rem,5vw,4.2rem)] mb-6 select-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              <span className="block animate-hero-line-1 whitespace-nowrap">
                <span className="text-[#F2F0EB]">EL </span>
                <span className="text-gradient-encore">SOUNDTRACK</span>
              </span>
              <span className="block text-[#F2F0EB] mt-1.5 sm:mt-2 animate-hero-line-2 lg:whitespace-nowrap">
                <span className="block lg:inline">DE TU MEJOR </span>
                <span className="block lg:inline">NOCHE</span>
              </span>
            </h1>

            {/* Dedicated mobile photo: HD framing with ALL 5 band members completely visible */}
            <div className="w-full relative my-5 rounded-3xl overflow-hidden aspect-[195/144] border border-white/20 shadow-2xl lg:hidden animate-hero-bg backdrop-blur-xl">
              <Image
                src="/images/vendetta-web-assets/vendetta-hero-mobile.jpg"
                alt="Banda de pop y rock en vivo Vendetta para eventos sociales y bodas"
                fill
                priority
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080D]/70 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="animate-hero-cta flex flex-col items-start w-full">
              <p className="text-sm md:text-base text-[#F2F0EB]/80 max-w-md mb-8 md:mb-10 font-sans font-normal leading-relaxed text-left">
                Pop y rock en vivo con energía real de concierto para bodas, eventos corporativos y celebraciones inolvidables.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <a href="#paquetes" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto font-sans font-semibold text-xs md:text-sm px-8 h-12 md:h-14 rounded-xl uppercase tracking-wider bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] hover:from-[#7e1032] hover:to-[#ff6d72] text-[#F2F0EB] shadow-xl shadow-[#FF5A5F]/25 hover:shadow-[#FF5A5F]/40 hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-white/20"
                  >
                    COTIZAR MI EVENTO
                  </Button>
                </a>
                <a href="#servicios" className="w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto font-sans font-semibold text-xs md:text-sm px-8 h-12 md:h-14 rounded-xl uppercase tracking-wider glass-card hover:bg-white/10 text-[#F2F0EB] flex items-center justify-center gap-2 border border-white/20 hover:border-[#FF5A5F]/50 transition-all duration-300 cursor-pointer"
                  >
                    VER EL SHOW 
                    <ChevronRight className="w-4 h-4 text-[#FF5A5F]" />
                  </Button>
                </a>
              </div>
              
              <div className="flex items-center gap-2.5 mt-8 md:mt-12 text-[10px] md:text-xs font-sans font-semibold uppercase tracking-[0.22em] text-[#F2F0EB]/70">
                <MapPin className="w-4 h-4 text-[#FF5A5F] shrink-0" />
                <span>TOLUCA</span>
                <span className="text-[#FF5A5F] font-bold">•</span>
                <span>CDMX</span>
                <span className="text-[#FF5A5F] font-bold">•</span>
                <span>VALLE DE BRAVO Y ALREDEDORES</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- VENDETTA EXPERIENCE ------------------------------------------- */}
      <VendettaExperience />

       {/* -- PAQUETES ------------------------------------------------------- */}
      <PaquetesSection 
        dbPackages={dbPackages as any} 
        adminWhatsapp={config?.adminWhatsapp || process.env.ADMIN_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_ADMIN_WA || null}
      />

      {mediaMap.video_home && <VideoSection videoUrl={mediaMap.video_home} />}
      {!mediaMap.video_home && <VideoSection />}

      {/* -- INSTAGRAM LIVE REELS ------------------------------------------ */}
      <InstagramReelsSection reels={mediaMap.reels} />

      {/* -- TRIBUTO MENTIRAS HERO ------------------------------------------ */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-b from-[#0E0E1A] via-[#2D0F22]/90 to-[#0B0B14]">
        {/* Máscara de mezcla de gradiente para transición suave */}
        <div className="section-blend-top bg-gradient-to-b from-[#0E0E1A] to-transparent" />

        {/* Glow de concierto detrás del contenido */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#6F0D2B]/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-[#FF5A5F]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="lg:w-1/2 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#6F0D2B]/30 to-[#FF5A5F]/20 blur-3xl animate-pulse" />
            <div className="relative aspect-video rounded-3xl overflow-hidden glass-card border border-white/15 shadow-2xl shadow-black/80">
              <Image 
                src={mediaMap.mentiras}
                alt="Show Tributo Mentiras por Vendetta - Pop & Rock en vivo"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080D]/90 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#6F0D2B] to-[#FF5A5F] text-[#F2F0EB] text-[11px] font-bold uppercase tracking-widest shadow-lg">
                🔥 Estreno Exclusivo
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF5A5F]/30 bg-[#6F0D2B]/20 text-[#FF5A5F] font-bold uppercase tracking-[0.3em] text-xs mb-4">
              <span className="w-2.5 h-2.5 rounded-full amp-jewel-amber" />
              <span>HOMENAJE OFICIAL • 80s POP</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-white uppercase tracking-tight leading-tight md:leading-none mb-6">
              Tributo <br />
              <span className="text-gradient-encore italic pr-4">Mentiras</span>
            </h2>
            <p className="text-[#F2F0EB]/80 text-lg mb-8 leading-relaxed max-w-xl font-normal">
              Revive la época dorada del pop en español con nuestro show homenaje a &quot;Mentiras&quot;. Un concierto electrizante en vivo que pondrá a todos a cantar de principio a fin.
            </p>
            <a href="#paquetes">
              <Button size="lg" className="h-14 px-8 font-bold gap-2 text-base cursor-pointer bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] hover:opacity-95 shadow-xl shadow-[#6F0D2B]/30 rounded-2xl">
                Contratar Tributo <ChevronRight className="w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>

        {/* Máscara de mezcla de gradiente para transición suave hacia servicios */}
        <div className="section-blend-bottom bg-gradient-to-t from-[#0B0B14] to-transparent" />
      </section>

      {/* -- CERTIFICADOS DE CALIDAD (SERVICIOS - BENTO CARDS) ------------- */}
      <section id="servicios" className="py-28 bg-[#0B0B14] relative overflow-hidden">
        {/* Aurora stage effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="aurora-layer-1 -top-32 left-1/4 animate-aurora-drift opacity-45" />
          <div className="aurora-layer-2 bottom-10 right-1/4 animate-aurora-reverse opacity-40" />
          <div className="absolute inset-0 stage-grid-overlay opacity-30" />
        </div>

        {/* Máscara de mezcla de gradiente para transición suave */}
        <div className="section-blend-top bg-gradient-to-b from-[#0B0B14] to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF5A5F]/30 bg-[#6F0D2B]/20 text-[#FF5A5F] font-bold text-xs uppercase tracking-[0.2em] mb-6 shadow-lg shadow-[#6F0D2B]/20">
              <span className="w-2.5 h-2.5 rounded-full amp-jewel-ruby" />
              <span>ESTÁNDAR VENDETTA • BENTO SHOWCASE</span>
            </div>
            <h2 className="font-heading font-black text-4xl sm:text-5xl md:text-7xl tracking-tighter mb-4 leading-tight md:leading-none uppercase text-white">
              Show de Épocas <br /> <span className="text-gradient-encore italic">Pop & Rock</span>
            </h2>
            <p className="text-[#F2F0EB]/70 max-w-lg mx-auto font-normal text-base">
              No somos un grupo convencional. Somos una experiencia de concierto en vivo diseñada para romper esquemas.
            </p>
          </div>

          {/* -- BENTO GRID CON FOTOS DE CONCIERTO -- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
            
            {/* Bento Card 1: HERO BENTO (Spans 2 cols, 2 rows on lg) */}
            <div className="lg:col-span-2 lg:row-span-2 rounded-3xl p-8 sm:p-10 border-2 border-white/20 bg-black/60 relative overflow-hidden flex flex-col justify-between group shadow-2xl glass-card-hover neon-live-coral">
              {/* Real Concert Photo Background */}
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/galeria/vendetta-cantante-escenario.jpg"
                  alt="Voz en Escenario Vendetta"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover opacity-25 group-hover:opacity-45 group-hover:scale-105 transition-all duration-700"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/85 to-transparent" />
              </div>

              {/* Glow ambiental */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#FF5A5F]/20 rounded-full blur-3xl group-hover:bg-[#FF5A5F]/35 transition-colors pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#6F0D2B]/30 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="px-3 py-1 rounded-full bg-[#6F0D2B]/70 border border-[#FF5A5F]/40 text-[#F2F0EB] text-[10px] font-bold uppercase tracking-widest shadow backdrop-blur-md">
                    🔥 Experiencia Insignia
                  </span>
                  <span className="px-3 py-1 rounded-full bg-black/50 border border-white/15 text-[#F2F0EB]/80 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md">
                    80s · 90s · 2000s
                  </span>
                </div>

                <h3 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-white uppercase tracking-tight leading-tight mb-4 drop-shadow-md">
                  Concierto Real en Vivo <br />
                  <span className="text-gradient-encore italic">Cero Poses, Cero Pistas</span>
                </h3>

                <p className="text-[#F2F0EB]/90 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                  Erradicamos el cliché del grupo convencional. Tocamos con el pulso, la distorsión, las armonías y el clímax de una banda en gira de estadio. Cada solo, cada coro y cada remate suceden en tiempo real.
                </p>

                {/* Visualizador de Ecualizador / Soundwave Animado */}
                <div className="p-4 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-md mb-6">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#FF5A5F] tracking-widest mb-3">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Sound Spectrum
                    </span>
                    <span className="font-mono text-white/60">48kHz · 24-bit Hi-Fi</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-12 w-full pt-2">
                    {[
                      "animate-vu-1", "animate-vu-2", "animate-vu-3", "animate-vu-1", 
                      "animate-vu-2", "animate-vu-1", "animate-vu-3", "animate-vu-2",
                      "animate-vu-1", "animate-vu-3", "animate-vu-2", "animate-vu-1",
                      "animate-vu-3", "animate-vu-2", "animate-vu-1", "animate-vu-2"
                    ].map((anim, idx) => (
                      <div 
                        key={idx} 
                        className={`flex-1 rounded-t-sm bg-gradient-to-t from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] ${anim}`}
                        style={{ minHeight: "15%" }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-[#F2F0EB]/80 font-medium">
                <span>Garantía de Pista Encendida</span>
                <span className="text-[#FF5A5F] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-[#FF5A5F]" /> 100% Directo
                </span>
              </div>
            </div>

            {/* Bento Card 2: Audio Pro Line Array con Foto */}
            <div className="rounded-3xl p-6 border border-white/15 bg-black/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group glass-card-hover">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/galeria/vendetta-musica-corporativo.jpg"
                  alt="Evento Corporativo Vendetta"
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover opacity-20 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/85 to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6F0D2B]/60 to-[#FF5A5F]/30 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-lg backdrop-blur-md">
                  <Volume2 className="w-6 h-6 text-[#FF5A5F]" />
                </div>
                <h4 className="font-bold text-white text-lg mb-2 uppercase tracking-tight group-hover:text-[#FF5A5F] transition-colors">
                  Audio Pro Line Array
                </h4>
                <p className="text-xs sm:text-sm text-[#F2F0EB]/80 leading-relaxed font-normal">
                  Sistemas Electro-Voice de tiro largo y consolas digitales para un impacto sonoro claro y sin saturación.
                </p>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/60">
                <span>SPL: 128 dB MAX</span>
                <span className="text-emerald-400 font-bold">CRYSTAL CLEAR</span>
              </div>
            </div>

            {/* Bento Card 3: Monitoreo In-Ear con Foto */}
            <div className="rounded-3xl p-6 border border-white/15 bg-black/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group glass-card-hover">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/galeria/vendetta-vocalista-grupo.jpg"
                  alt="Vocalistas Vendetta"
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover opacity-20 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/85 to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7777FF]/40 to-[#20D5E5]/30 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-lg backdrop-blur-md">
                  <Cpu className="w-6 h-6 text-[#20D5E5]" />
                </div>
                <h4 className="font-bold text-white text-lg mb-2 uppercase tracking-tight group-hover:text-[#20D5E5] transition-colors">
                  In-Ear & Cero Ruido
                </h4>
                <p className="text-xs sm:text-sm text-[#F2F0EB]/80 leading-relaxed font-normal">
                  Monitoreo inalámbrico profesional. Eliminamos monitores ruidosos en el piso: el salón suena impecable.
                </p>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/60">
                <span>STAGE NOISE: 0 dB</span>
                <span className="text-[#20D5E5] font-bold">WIRELESS</span>
              </div>
            </div>

            {/* Bento Card 4: Iluminación Robótica con Foto */}
            <div className="rounded-3xl p-6 border border-white/15 bg-black/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group glass-card-hover">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/galeria/vendetta-trompetista-show.jpg"
                  alt="Trompeta e Iluminación Vendetta"
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover opacity-20 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/85 to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/40 to-[#FF5A5F]/30 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-lg backdrop-blur-md">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <h4 className="font-bold text-white text-lg mb-2 uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                  Robótica & Atmósfera
                </h4>
                <p className="text-xs sm:text-sm text-[#F2F0EB]/80 leading-relaxed font-normal">
                  Cabezas móviles beam, wash y barras perimetrales coreografiadas en vivo con cada cambio de tema.
                </p>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/60">
                <span>DMX SYNC 512</span>
                <span className="text-amber-400 font-bold">CONCERT LEVEL</span>
              </div>
            </div>

            {/* Bento Card 5: Backline Boutique con Foto */}
            <div className="rounded-3xl p-6 border border-white/15 bg-black/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group glass-card-hover">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/galeria/vendetta-saxofonista-metales.jpg"
                  alt="Saxofón y Metales Vendetta"
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover opacity-20 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/85 to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6F0D2B]/50 to-[#A91D4D]/30 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-lg backdrop-blur-md">
                  <Music2 className="w-6 h-6 text-[#FF5A5F]" />
                </div>
                <h4 className="font-bold text-white text-lg mb-2 uppercase tracking-tight group-hover:text-[#FF5A5F] transition-colors">
                  Backline de Gira
                </h4>
                <p className="text-xs sm:text-sm text-[#F2F0EB]/80 leading-relaxed font-normal">
                  Batería acústica microfoneada, sintetizadores analógicos, guitarras Fender / Gibson y bajos de precisión.
                </p>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/60">
                <span>BOUTIQUE GEAR</span>
                <span className="text-[#FF5A5F] font-bold">100% PRO</span>
              </div>
            </div>

            {/* Bento Card 6: Logística & Timeline Cronometrado (lg:col-span-2) */}
            <div className="lg:col-span-2 rounded-3xl p-8 border border-white/15 bg-black/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group glass-card-hover">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/galeria/vendetta-grupo-musical-animacion.jpg"
                  alt="Animación y Logística Vendetta"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover opacity-20 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/85 to-transparent" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6F0D2B]/40 border border-[#FF5A5F]/40 flex items-center justify-center backdrop-blur-md">
                      <Clock className="w-5 h-5 text-[#FF5A5F]" />
                    </div>
                    <h4 className="font-bold text-white text-lg uppercase tracking-tight">
                      Logística Impecable & Cero Estrés
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF5A5F] px-2.5 py-1 rounded bg-[#6F0D2B]/30 border border-[#FF5A5F]/40 backdrop-blur-md">
                    Puntualidad Absoluta
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#F2F0EB]/80 mb-6 font-normal">
                  Llegamos con 4 horas de anticipación. Coordinamos con tu wedding planner o staff del salón para un montaje silencioso y prueba de sonido invisible.
                </p>

                {/* Timeline Visual en Línea */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-center backdrop-blur-md">
                    <div className="text-[10px] font-mono text-[#FF5A5F] font-bold">T-4 HORAS</div>
                    <div className="text-[11px] text-white font-bold mt-0.5">Montaje</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-center backdrop-blur-md">
                    <div className="text-[10px] font-mono text-amber-400 font-bold">T-2 HORAS</div>
                    <div className="text-[11px] text-white font-bold mt-0.5">Soundcheck</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-center backdrop-blur-md">
                    <div className="text-[10px] font-mono text-emerald-400 font-bold">SHOWTIME</div>
                    <div className="text-[11px] text-white font-bold mt-0.5">Concierto</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#6F0D2B]/50 to-[#FF5A5F]/30 border border-[#FF5A5F]/40 text-center backdrop-blur-md">
                    <div className="text-[10px] font-mono text-[#FF5A5F] font-bold">ENCORE</div>
                    <div className="text-[11px] text-white font-bold mt-0.5">Fiesta Total</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 7: Métrica y Prestigio (lg:col-span-2) */}
            <div className="lg:col-span-2 rounded-3xl p-8 border border-white/15 bg-black/50 backdrop-blur-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 group glass-card-hover neon-live-cyan">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/galeria/vendetta-concierto-versatil.jpg"
                  alt="Prestigio y Reputación Vendetta"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover opacity-20 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/85 to-transparent" />
              </div>

              <div className="flex-1 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-3 backdrop-blur-md">
                  <Star className="w-3 h-3 fill-amber-400" /> Reputación 5.0 Estrellas
                </div>
                <h4 className="font-bold text-white text-xl sm:text-2xl uppercase tracking-tight mb-2 drop-shadow-md">
                  +500 Eventos que Fueron Leyenda
                </h4>
                <p className="text-xs sm:text-sm text-[#F2F0EB]/80 font-normal">
                  Empresas multinacionales, bodas de ensueño y recintos icónicos respaldan nuestra trayectoria en todo México.
                </p>
              </div>
              <div className="shrink-0 flex sm:flex-col items-center justify-center p-5 rounded-2xl bg-black/70 border border-white/15 text-center w-full sm:w-auto relative z-10 backdrop-blur-md">
                <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A5F] to-amber-300">
                  100%
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#F2F0EB]/70 mt-1">
                  Recomendados
                </div>
              </div>
            </div>

          </div>

          {/* -- VINYL SHOWCASE TOCADISCOS INTERACTIVO -- */}
          <VinylShowcase />

        </div>

        {/* Máscara de mezcla de gradiente para transición suave */}
        <div className="section-blend-bottom bg-gradient-to-t from-[#15152B] to-transparent" />
      </section>

      {/* -- SIMULADOR DE CONSOLA O MEZCLADORA (WEB AUDIO API) ------------ */}
      <LiveStageMixer />

      {/* -- MÚSICOS (NOSOTROS) ------------------------------------------- */}
      <MusiciansSection musicians={liveMusicians} />

      {/* -- PRÓXIMAS FECHAS ------------------------------------------------ */}
      <Suspense fallback={
        <section className="py-24 bg-gradient-to-b from-[#0E0E1A] to-[#120F24]">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 text-[#FF5A5F]/60 text-xs font-bold uppercase tracking-widest animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando próximas fechas...
            </div>
          </div>
        </section>
      }>
        <UpcomingGigs />
      </Suspense>

      {/* -- CLIENTES ------------------------------------------------------- */}
      <section className="py-32 relative overflow-hidden bg-gradient-to-b from-[#07080D] via-[#15152B] to-[#0E0E1A]">
        {/* Máscara de mezcla de gradiente para transición suave */}
        <div className="section-blend-top bg-gradient-to-b from-[#07080D] to-transparent" />

        {/* Fondo decorativo con gradientes radiales */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6F0D2B]/15 rounded-full blur-[140px] opacity-60" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#7777FF]/10 rounded-full blur-[120px] opacity-40" />
          <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#FF5A5F]/10 rounded-full blur-[100px] opacity-30" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[#F2F0EB]/60 text-[10px] font-bold uppercase tracking-[0.4em] mb-5">
               Trusted By
             </div>
             <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-tight leading-tight md:leading-none">
               Clientes que <span className="text-gradient-encore italic pr-4">Nos Recomiendan</span>
             </h2>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-6xl mx-auto">
            {CLIENTS.map(c => (
              <div 
                key={c} 
                className="px-8 py-4 rounded-2xl border border-white/10 glass-card-subtle text-xs font-bold text-[#F2F0EB]/70 hover:text-white hover:border-[#FF5A5F]/40 hover:bg-[#6F0D2B]/15 transition-all duration-300 cursor-default uppercase tracking-widest shadow-lg"
              >
                {c}
              </div>
            ))}
          </div>
        </div>
        
        <div id="galeria" className="pt-24 mt-20">
          <PhotoGallery images={mediaMap.galeria} />
        </div>

        {/* Máscara de mezcla de gradiente para transición suave */}
        <div className="section-blend-bottom bg-gradient-to-t from-[#0E0E1A] to-transparent" />
      </section>

      {/* -- TESTIMONIOS ---------------------------------------------------- */}
      <section id="testimonios" className="py-32 bg-gradient-to-b from-[#0E0E1A] via-[#120F24] to-[#0B0B14] relative overflow-hidden">
        {/* Máscara de mezcla de gradiente para transición suave */}
        <div className="section-blend-top bg-gradient-to-b from-[#0E0E1A] to-transparent" />

        {/* Glow ambiental */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#6F0D2B]/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF5A5F]/30 bg-[#6F0D2B]/20 text-[#FF5A5F] font-bold text-xs uppercase tracking-widest mb-6">
                ⭐ Testimoniales
              </div>
              <h2 className="font-heading font-black text-4xl sm:text-5xl md:text-7xl tracking-tighter mb-4 leading-[1] md:leading-[0.9] text-white">
                Lo que dicen <br />
                <span className="text-gradient-encore italic">nuestros clientes</span>
              </h2>
            </div>
            <p className="text-[#F2F0EB]/70 max-w-sm text-base font-normal lg:text-right">
              &quot;La mejor inversión para mi boda, todos quedaron fascinados con la energía de la banda.&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {liveDbReviews.slice(0, 9).map((r, i) => (
              <div
                key={("id" in r ? r.id : null) || i}
                className={`group relative glass-card-hover border border-white/10 rounded-3xl p-10 hover:border-[#FF5A5F]/40 transition-all duration-500 ${
                  i % 2 !== 0 ? "lg:-translate-y-8" : ""
                }`}
              >
                <Quote className="absolute top-10 right-10 w-12 h-12 text-white/5 group-hover:text-[#FF5A5F]/20 transition-colors" />
                <div className="flex gap-1 mb-8">
                   {[...Array(r.stars || 5)].map((_, sIdx) => <Star key={sIdx} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-xl font-bold text-white mb-10 leading-snug italic">&quot;{r.text}&quot;</p>
                <div className="flex items-center gap-4 border-t border-white/10 pt-8">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6F0D2B]/40 to-[#FF5A5F]/20 border border-white/10 flex items-center justify-center font-black text-[#FF5A5F] text-xl">
                      {r.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <div className="font-bold text-white text-base">{r.name}</div>
                      <div className="text-[11px] text-[#F2F0EB]/50 uppercase tracking-widest font-semibold">
                         {('event' in r) ? (r as any).event : "Verificado en sitio"}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>

          <ReviewModal />
        </div>

        {/* Máscara de mezcla de gradiente para transición suave */}
        <div className="section-blend-bottom bg-gradient-to-t from-[#0B0B14] to-transparent" />
      </section>

      {/* -- CONSULTA ESTATUS --------------------------------------------- */}
      <section id="estatus" className="py-24 relative overflow-hidden bg-gradient-to-b from-[#0B0B14] via-[#15152B]/60 to-[#0B0B14]">
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
           <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[#FF5A5F] font-bold uppercase tracking-[0.3em] text-xs mb-4">
                Zona de Clientes
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-tight leading-tight md:leading-none mb-4">
                Consulta tu <span className="text-gradient-encore italic pr-4">Estatus</span>
              </h2>
              <p className="text-[#F2F0EB]/70 text-sm font-normal">
                ¿Ya apartaste tu fecha? Ingresa el ID de tu reserva para ver detalles, pagos y contrato.
              </p>
           </div>
           <StatusSearch />
        </div>
      </section>

      {/* -- CTA FINAL ------------------------------------------------------ */}
      <section className="py-36 relative overflow-hidden bg-gradient-to-b from-[#0B0B14] via-[#42112D]/80 to-[#07080D]">
        {/* Máscara de mezcla de gradiente para transición suave */}
        <div className="section-blend-top bg-gradient-to-b from-[#0B0B14] to-transparent" />

        {/* Glow y ambiente de concierto */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#6F0D2B]/30 rounded-full blur-[150px]" />
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#FF5A5F]/20 rounded-full blur-[120px]" />
        </div>

        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&auto=format&fit=crop"
            alt="Concierto en vivo Vendetta - La mejor energía para tu fiesta"
            fill
            sizes="100vw"
            className="object-cover opacity-15 mix-blend-overlay"
          />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-heading font-black text-4xl sm:text-5xl md:text-7xl uppercase tracking-tighter mb-8 text-white leading-tight md:leading-none">
            Haz que tu evento <br />
            sea <span className="text-gradient-encore italic">Leyenda</span>
          </h2>
          <p className="text-[#F2F0EB]/85 max-w-2xl mx-auto mb-12 text-lg md:text-xl font-normal">
            Estamos listos para transformar tu celebración en un concierto inolvidable. <br />
            <span className="text-[#FF5A5F] font-bold">Agenda abierta 2026:</span> Asegura tu fecha antes de que se agote.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
             <a href="#paquetes">
                <Button size="lg" className="h-16 px-12 rounded-2xl font-bold text-xl shadow-2xl shadow-[#6F0D2B]/50 gap-3 bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  <Zap className="w-6 h-6 fill-[#F2F0EB] text-[#F2F0EB]" /> Cotizar ahora
                </Button>
              </a>
          </div>
        </div>

        {/* Máscara de mezcla de gradiente para transición suave hacia el footer */}
        <div className="section-blend-bottom bg-gradient-to-t from-[#07080D] to-transparent" />
      </section>
    </div>
  )
}
