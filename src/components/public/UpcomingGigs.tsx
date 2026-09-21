import { Calendar, MapPin, Music, ChevronRight, Phone } from "lucide-react"
import Link from "next/link"
import { formatDateMX } from "@/lib/utils"
import { db } from "@/lib/db"

export async function UpcomingGigs() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const futureEvents = await db.event.findMany({
    where: {
      date: { gte: now },
      status: { in: ["agendado", "scheduled", "confirmed"] }
    },
    orderBy: { date: "asc" },
    take: 10,
    include: {
      location: true,
      client: true
    }
  })

  return (
    <section id="fechas" className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-[#07080D] via-[#15152B]/70 to-[#07080D] border-t border-white/10">
      {/* Concert lighting atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-[#7777FF]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-[#FF5A5F]/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 stage-grid-overlay opacity-25" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FF5A5F]/30 bg-[#FF5A5F]/10 text-[#FF5A5F] font-semibold text-xs uppercase tracking-widest mb-4">
             ⚡ Agenda en Vivo 2026
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-sans font-black text-[#F2F0EB] uppercase tracking-tight leading-tight md:leading-none">
            Gira & <span className="text-gradient-encore">Presentaciones</span>
          </h2>
        </div>

        {futureEvents.length === 0 ? (
          <div className="glass-card text-center py-16 px-6 rounded-3xl max-w-4xl mx-auto">
            <p className="text-[#F2F0EB]/60 font-normal text-base">
              Preparando las próximas fechas de la temporada. ¡Contrata con anticipación para asegurar tu día!
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto glass-card rounded-3xl overflow-hidden divide-y divide-white/10 border border-white/15 shadow-2xl">
            {futureEvents.map((evt) => {
              const displayLocationName = evt.isPublic 
                ? (evt.customName || evt.location?.name || "Lugar por confirmar") 
                : "Evento Privado"
              
              const city =  evt.location?.city || evt.client?.city
              const state = evt.location?.state || evt.client?.state
              const cityState = [city, state].filter(Boolean).join(", ")

              const displayAddress = cityState || "Por asignar";

              return (
                <div 
                  key={evt.id}
                  className="group flex flex-col md:flex-row items-center justify-between py-8 md:py-7 gap-6 hover:bg-white/[0.04] transition-all px-6 md:px-8"
                >
                  {/* Bloque Izquierdo: Fecha y Hora */}
                  <div className="flex flex-col items-center md:items-start gap-1 md:gap-5 min-w-full md:min-w-[200px] text-center md:text-left">
                    <div className="flex items-center md:items-start gap-4 md:gap-5">
                      <div className="text-6xl md:text-5xl font-sans font-black text-[#F2F0EB] leading-none tracking-tight shrink-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                         {formatDateMX(evt.date, "dd")}
                      </div>
                      <div className="flex flex-col justify-center pt-1">
                         <div className="text-[#FF5A5F] font-sans font-semibold uppercase text-xs md:text-[11px] tracking-[0.18em] leading-none mb-1">
                            {formatDateMX(evt.date, "MMMM").toUpperCase()}
                         </div>
                         <div className="text-[#F2F0EB]/50 font-sans font-light text-xs md:text-[10px] tracking-[0.1em]">{formatDateMX(evt.date, "yyyy")}</div>
                      </div>
                    </div>
                    
                    {/* Horario en salto abajo, centrado en móvil */}
                    <div className="mt-3 md:mt-2">
                       <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FF5A5F]/10 border border-[#FF5A5F]/20 text-[10px] md:text-[9px] font-semibold text-[#FF5A5F] uppercase tracking-wider">
                          <Calendar className="w-3 h-3 md:w-2.5 md:h-2.5" /> {evt.performanceStart || "21:00"} {evt.performanceEnd ? `— ${evt.performanceEnd}` : ""}
                       </div>
                    </div>
                  </div>

                  {/* Bloque Central: Info Show */}
                  <div className="flex-1 text-center md:text-left space-y-2 w-full">
                     <h3 className="text-[#F2F0EB] font-sans font-black text-xl md:text-2xl uppercase tracking-tight group-hover:text-[#FF5A5F] transition-colors leading-tight">
                        {displayLocationName}
                     </h3>
                     <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-y-2 gap-x-4 text-[#F2F0EB]/60 text-[11px] font-normal uppercase tracking-wide">
                        <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md md:bg-transparent md:px-0 md:py-0">
                           <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" /> {displayAddress}
                        </span>
                        <span className="hidden sm:inline text-white/20">•</span>
                        <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md md:bg-transparent md:px-0 md:py-0">
                           <Music className="w-3.5 h-3.5 text-[#FF5A5F]" /> {evt.ceremonyType?.replace("_", " ").replace("cumpleanos", "cumpleaños") || "A confirmar"}
                        </span>
                     </div>
                  </div>

                  {/* Bloque Derecho: Acciones */}
                  <div className="flex flex-row items-center gap-3 w-full sm:w-auto md:min-w-[150px] justify-center md:justify-end">
                    {evt.isPublic ? (
                      <>
                        {(evt.mapsLink || evt.location?.mapsLink) && (
                          <a 
                            href={evt.mapsLink || evt.location?.mapsLink || "#"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-[11px] md:text-[10px] font-semibold text-[#F2F0EB] hover:bg-white/10 hover:border-[#FF5A5F]/40 hover:text-[#FF5A5F] transition-all uppercase tracking-widest"
                          >
                            <MapPin className="w-3.5 h-3.5" /> Mapa
                          </a>
                        )}
                        {(evt.location?.phone) && (
                          <a 
                            href={`tel:${evt.location.phone}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-[11px] md:text-[10px] font-semibold text-[#F2F0EB] hover:bg-white/15 transition-all uppercase tracking-widest"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#FF5A5F]" /> Info
                          </a>
                        )}
                      </>
                    ) : (
                      <Link 
                        href="/cotizar"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] text-[11px] md:text-[10px] font-semibold hover:opacity-95 transition-all uppercase tracking-widest border border-white/20 shadow-md shadow-[#FF5A5F]/20"
                      >
                        Cotizar mi Fecha
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        <div className="mt-12 text-center max-w-2xl mx-auto">
           <p className="text-gray-500 text-[11px] md:text-sm italic px-6">
              * Debido a la naturaleza de los eventos privados (bodas, corporativos), algunas ubicaciones exactas están reservadas por privacidad de nuestros clientes.
           </p>
        </div>
      </div>
    </section>
  )
}
