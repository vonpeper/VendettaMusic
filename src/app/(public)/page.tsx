import { Button } from "@/components/ui/button"
import { PaquetesSection } from "@/components/public/PaquetesSection"
import {
  Volume2, Cpu, Music2, Star, Clock, ChevronRight, ExternalLink, Quote, Zap, Loader2
} from "lucide-react"
import { BuildShowHero } from "@/components/public/BuildShowHero"
import { MusiciansSection } from "@/components/public/MusiciansSection"
import { UpcomingGigs } from "@/components/public/UpcomingGigs"
import { VideoSection } from "@/components/public/VideoSection"
import { PhotoGallery } from "@/components/public/PhotoGallery"
import { PartyBubbles } from "@/components/public/PartyBubbles"
import { NeonBorder } from "@/components/public/NeonBorder"
import { WhatsAppButton } from "@/components/public/WhatsAppButton"
import { Suspense } from "react"
import Image from "next/image"
import { db } from "@/lib/db"
import { ReviewModal } from "@/components/public/ReviewModal"
import { StatusSearch } from "@/components/public/StatusSearch"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Música en Vivo para Bodas y Eventos | Vendetta Live Music",
  description: "Grupo musical versátil para eventos sociales, bodas y eventos corporativos en Toluca, CDMX y Valle de Bravo. Show en vivo de alto nivel.",
  keywords: ["música en vivo bodas", "grupo musical eventos", "banda versátil toluca", "show musical cdmx", "música para eventos valle de bravo"],
}

// La home lee paquetes/medios/reseñas de la DB en cada request — no debe pre-renderizarse
// estáticamente o queda con el snapshot del build (vacío si la DB se llenó después del deploy).
export const dynamic = "force-dynamic"

// --- Animación arcoiris pasteles ---------------------------------------------
const BADGES = [
  { icon: Volume2,        label: "Audio de Alta Fidelidad",   desc: "Equipos Electro-Voice y consola digital en cada show." },
  { icon: Cpu,            label: "Tecnología Digital",         desc: "Monitoreo inalámbrico, consola digital y efectos en vivo." },
  { icon: Music2,         label: "Instrumentos de Gama Alta",  desc: "Backline profesional y guitarras boutique." },
  { icon: Star,           label: "Excelente Presentación",     desc: "Look profesional adaptado al tipo de evento." },
  { icon: Clock,          label: "Puntualidad",                desc: "Llegamos antes para que todo esté listo a tiempo." },
  { icon: Zap,            label: "Producción de Festival",     desc: "Iluminación robótica y pantallas LED disponibles." },
  { icon: Quote,          label: "Servicio al Cliente",        desc: "Atención personalizada desde el primer contacto." },
  { icon: Star,           label: "Diversión Garantizada",      desc: "Más de 500 fiestas prendidas con nuestra energía." },
]



// Reviews are now managed in the database via /admin/testimoniales

const CLIENTS = [
  "WTC México", "COMEXANE A.C", "Secretaría de Salud Edomex",
  "Ayuntamiento de Toluca", "Ayuntamiento de Ocoyoacac",
  "Ayuntamiento de Santiago Tianguistenco", "UNTICKET",
  "Harley Davidson", "Bistró Mecha", "Alquimia 73",
  "Bruma", "McCarthy's Irish Pub",
  "Ayuntamiento de Ixtapan de la Sal", "Teatro Quimera"
]

export default async function HomePage() {
  const allMedia = await db.siteMedia.findMany()
  const mediaMap = {
    hero: allMedia.find((m: any) => m.section === "hero")?.url || "https://images.unsplash.com/photo-1468359601543-843bfaef291a?q=80&w=2074&auto=format&fit=crop",
    mentiras: allMedia.find((m: any) => m.section === "mentiras")?.url || "/images/shows/mentiras.jpg",
    arma_tu_show: allMedia.find((m: any) => m.section === "arma_tu_show")?.url || "/images/shows/arma-tu-show.jpg",
    video_home: allMedia.find((m: any) => m.section === "video_home")?.url || "",
    galeria: allMedia.filter((m: any) => m.section === "galeria").map(m => m.url),
  }
  
  const liveDbReviews = await db.review.findMany({ 
    where: { status: "approved" }, 
    orderBy: { createdAt: "desc" } 
  })
  
  const liveMusicians = await db.publicBandMember.findMany({
    orderBy: { order: "asc" }
  })

  const dbPackages = await db.package.findMany({
    where: { active: true, NOT: { isCustom: true } },
    include: { serviceItems: { orderBy: { order: "asc" } } },
    orderBy: { baseCostPerHour: "asc" }
  })

  return (
    <div className="flex flex-col min-h-screen">
      <NeonBorder />
      <WhatsAppButton />

      {/* -- HERO ---------------------------------------------------------- */}
      <section id="inicio" className="relative h-[92vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-background z-10" />
          <Image
            src={mediaMap.hero}
            alt="Grupo musical Vendetta en vivo para eventos sociales y bodas"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-90 blur-[2px]"
          />
        </div>

        <div className="container relative z-20 px-4 text-center mt-16 flex flex-col items-center">
          <div className="inline-block relative mb-4 z-30 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.3em] backdrop-blur-md -translate-y-2">
            ✦ Agendando fechas 2026
          </div>
          <h1 className="animated-title font-heading font-black text-5xl md:text-8xl lg:text-9xl tracking-tighter mb-6 uppercase drop-shadow-2xl leading-[0.85] relative">
            MÚSICA en Vivo<br />Inolvidable
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Show de épocas de pop y rock en inglés desde los 80's de alto nivel para bodas, eventos corporativos y festivales.
            Energía real en Toluca, CDMX y Valle de Bravo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <a href="#paquetes">
                <Button size="lg" className="font-black text-lg px-10 h-16 rounded-2xl shadow-xl shadow-primary/25 gap-2">
                   Ver Paquetes <ChevronRight className="w-5 h-5" />
                </Button>
              </a>
              <a href="#nosotros" className="text-sm font-black text-white hover:text-primary transition-colors tracking-widest uppercase">
                Acerca de la banda
              </a>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[9px] font-black uppercase tracking-[0.5em]">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </section>

      {/* -- STATS --------------------------------------------------------- */}
      <section className="py-24 bg-background relative overflow-hidden text-center">
        <PartyBubbles />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center max-w-5xl mx-auto">
            {[
              { value: "+500", label: "Eventos Exitosos", color: "from-primary to-rose-400" },
              { value: "3",    label: "Años de Vendetta", color: "from-purple-400 to-indigo-400" },
              { value: "+15", label: "Años de Experiencia", color: "from-blue-400 to-cyan-400" },
            ].map(s => (
              <div key={s.label} className="relative group flex flex-col items-center">
                <div className={`absolute -inset-4 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-10 blur-xl transition-opacity`} />
                <span className="animated-title text-4xl md:text-5xl font-black mb-2 block tracking-tighter">{s.value}</span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- PAQUETES ------------------------------------------------------- */}
      <PaquetesSection dbPackages={dbPackages as any} />

      {mediaMap.video_home && <VideoSection videoUrl={mediaMap.video_home} />}
      {!mediaMap.video_home && <VideoSection />}

      {/* -- TRIBUTO MENTIRAS HERO ------------------------------------------ */}
      <section className="relative py-32 overflow-hidden bg-black">
         <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative">
               <div className="absolute -inset-4 bg-primary/20 blur-3xl animate-pulse" />
               <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                  <Image 
                    src={mediaMap.mentiras}
                    alt="Show Tributo Mentiras por Vendetta - Música de los 80s"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                     🔥 Estreno Exclusivo
                  </div>
               </div>
            </div>
            <div className="lg:w-1/2 text-left">
               <div className="text-primary font-black uppercase tracking-[0.4em] text-xs mb-4">Especiales Vendetta</div>
               <h2 className="text-5xl md:text-6xl font-heading font-black text-white uppercase tracking-tighter leading-none mb-6">
                  Tributo <br />
                  <span className="animated-title italic pr-4">Mentiras</span>
               </h2>
               <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-xl italic">
                  Revive la época dorada del pop en español con nuestro show homenaje a "Mentiras". Un concierto en vivo que pondrá a todos a cantar.
               </p>
               <a href="https://wa.me/527222417045?text=Hola!%20Me%20interesa%20contratar%20el%20Tributo%20Mentiras" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="h-14 px-8 font-black gap-2 text-base">
                     Contratar Tributo <ChevronRight className="w-5 h-5" />
                  </Button>
               </a>
            </div>
         </div>
      </section>

      {/* -- ARMA TU SHOW HERO ---------------------------------------------- */}
      <BuildShowHero imageUrl={mediaMap.arma_tu_show} />

      {/* -- CERTIFICADOS DE CALIDAD (SERVICIOS) --------------------------- */}
      <section id="servicios" className="py-24 bg-[#050505] relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary/40 bg-primary/10 text-primary font-black text-xs uppercase tracking-[0.2em] mb-6 rotate-[-2deg] shadow-[4px_4px_0px_#dc2626]">
              ⚡ Estándar Vendetta
            </div>
            <h2 className="font-heading font-black text-5xl md:text-7xl tracking-tighter mb-4 leading-none uppercase">
              Show de Épocas <br /> <span className="animated-title italic">Pop & Rock</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto font-medium">
              No somos la típica banda aburrida. Somos una experiencia sensorial completa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {BADGES.map((b, i) => (
              <div 
                key={i} 
                className={`group p-8 rounded-[2rem] border-2 border-white/10 bg-white/[0.03] hover:bg-primary/5 hover:border-primary/40 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden ${
                  i % 2 === 0 ? "rotate-1" : "-rotate-1"
                } hover:rotate-0`}
              >
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all shadow-[6px_6px_0px_rgba(220,38,38,0.1)] group-hover:shadow-[8px_8px_0px_rgba(220,38,38,0.2)]">
                  <b.icon className="w-8 h-8 text-primary" />
                </div>
                
                <h4 className="font-black text-white text-lg mb-3 uppercase tracking-tight group-hover:text-primary transition-colors">{b.label}</h4>
                <p className="text-sm text-gray-400 leading-relaxed font-medium group-hover:text-gray-300 transition-colors">{b.desc}</p>
                
                <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Premium Show</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- MÚSICOS (NOSOTROS) ------------------------------------------- */}
      <MusiciansSection musicians={liveMusicians} />

      {/* -- PRÓXIMAS FECHAS ------------------------------------------------ */}
      <Suspense fallback={
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 text-primary/50 text-xs font-bold uppercase tracking-widest animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando próximas fechas...
            </div>
          </div>
        </section>
      }>
        <UpcomingGigs />
      </Suspense>

      {/* -- CLIENTES ------------------------------------------------------- */}
      <section className="py-32 relative overflow-hidden bg-background">
        {/* Fondo decorativo con gradiente radial */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] opacity-30" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] mb-5">
               Trusted By
             </div>
             <h2 className="text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-tight leading-none">
               Clientes que <span className="animated-title italic pr-4">Nos Recomiendan</span>
             </h2>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-6xl mx-auto">
            {CLIENTS.map(c => (
              <div 
                key={c} 
                className="px-8 py-4 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md text-xs font-black text-gray-500 hover:text-white hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-default uppercase tracking-widest shadow-lg"
              >
                {c}
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-24 border-t border-white/5 mt-20">
          <PhotoGallery images={mediaMap.galeria} />
        </div>
      </section>

      {/* -- TESTIMONIOS ---------------------------------------------------- */}
      <section id="testimonios" className="py-32 bg-[#080808] relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-6">
                ⭐ Testimoniales
              </div>
              <h2 className="font-heading font-black text-5xl md:text-7xl tracking-tighter mb-4 leading-[0.9]">
                Lo que dicen <br />
                <span className="animated-title italic">nuestros clientes</span>
              </h2>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm font-medium lg:text-right italic">
              "La mejor inversión para mi boda, todos quedaron fascinados."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {liveDbReviews.slice(0, 9).map((r, i) => (
              <div
                key={("id" in r ? r.id : null) || i}
                className={`group relative bg-card/40 border border-white/5 rounded-[3rem] p-10 hover:border-primary/40 transition-all duration-500 ${
                  i % 2 !== 0 ? "lg:-translate-y-12" : ""
                }`}
              >
                <Quote className="absolute top-10 right-10 w-12 h-12 text-primary/10 group-hover:text-primary/30 transition-colors" />
                <div className="flex gap-1 mb-8">
                   {[...Array(r.stars || 5)].map((_, sIdx) => <Star key={sIdx} className="w-4 h-4 text-amber-500 fill-amber-500" />)}
                </div>
                <p className="text-xl font-bold text-white mb-10 leading-tight italic">"{r.text}"</p>
                <div className="flex items-center gap-4 border-t border-white/5 pt-8">
                   <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center font-black text-primary text-xl">
                      {r.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <div className="font-black text-white text-sm">{r.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                         {('event' in r) ? (r as any).event : "Verificado en sitio"}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>

          <ReviewModal />
        </div>
      </section>

      {/* -- CONSULTA ESTATUS --------------------------------------------- */}
      <section id="estatus" className="py-24 relative overflow-hidden bg-black/40">
        <div className="container mx-auto px-4 max-w-4xl">
           <div className="text-center mb-12">
              <div className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4">Zona de Clientes</div>
              <h2 className="text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-tighter leading-none mb-4">
                Consulta tu <span className="animated-title italic pr-4">Estatus</span>
              </h2>
              <p className="text-muted-foreground text-sm font-medium italic">
                ¿Ya apartaste tu fecha? Ingresa el ID de tu reserva para ver detalles, pagos y contrato.
              </p>
           </div>
           <StatusSearch />
        </div>
      </section>

      {/* -- CTA FINAL ------------------------------------------------------ */}
      <section className="py-32 relative overflow-hidden bg-background">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&auto=format&fit=crop"
            alt="Concierto en vivo Vendetta - La mejor energía para tu fiesta"
            fill
            sizes="100vw"
            className="object-cover opacity-10"
          />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-heading font-black text-5xl md:text-7xl uppercase tracking-tighter mb-8 text-white leading-none">
            Haz que tu evento <br />
            sea <span className="animated-title underline decoration-primary/20">Leyenda</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-lg font-medium italic">
            Estamos listos para prender fuego a tu pista de baile. <br />
            Fecha límite de reserva 2026: No te quedes fuera.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
             <a href="#paquetes">
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
