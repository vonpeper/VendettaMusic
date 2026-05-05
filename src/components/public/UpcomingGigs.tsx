import { Calendar, MapPin, Music, ChevronRight, Phone } from "lucide-react"
import { formatDateMX } from "@/lib/utils"
import { db } from "@/lib/db"

export async function UpcomingGigs() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const futureEvents = await db.event.findMany({
    where: {
      date: { gte: now },
      status: { in: ["agendado"] }
    },
    orderBy: { date: "asc" },
    take: 10,
    include: {
      location: true,
      client: true
    }
  })

  return (
    <section id="fechas" className="py-20 md:py-24 bg-black relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-4">
             ⚡ Tour 2026
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-heading font-black text-white uppercase tracking-tighter leading-tight md:leading-none">
            Gira <span className="animated-title italic">Artística</span>
          </h2>
        </div>

        {futureEvents.length === 0 ? (
          <div className="text-center py-12 border-t border-b border-white/10 max-w-4xl mx-auto">
            <p className="text-gray-500 font-medium italic">
              Estamos preparando las siguientes paradas. ¡Vuelve pronto para más fechas!
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto divide-y divide-white/10 border-t border-b border-white/10">
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
                  className="group flex flex-col md:flex-row items-center justify-between py-10 md:py-8 gap-8 md:gap-6 hover:bg-white/[0.02] transition-all px-6 -mx-6 md:mx-0 md:px-8"
                >
                  {/* Bloque Izquierdo: Fecha y Hora */}
                  <div className="flex flex-row md:flex-row items-center md:items-start gap-6 md:gap-5 min-w-[180px] md:min-w-[200px]">
                    <div className="text-6xl md:text-6xl font-black text-white font-mono leading-none tracking-tighter shrink-0">
                       {formatDateMX(evt.date, "dd")}
                    </div>
                    <div className="flex flex-col justify-center h-full pt-1">
                       <div className="text-primary font-black uppercase text-[11px] md:text-[10px] tracking-[0.2em] leading-none mb-1">
                          {formatDateMX(evt.date, "MMMM").toUpperCase()}
                       </div>
                       <div className="text-gray-500 font-bold text-[10px] md:text-[9px] tracking-[0.1em] mb-2">{formatDateMX(evt.date, "yyyy")}</div>
                       
                       {/* Horario movido aquí abajo de la fecha */}
                       <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px] md:text-[9px] font-black text-primary uppercase tracking-wider">
                          <Calendar className="w-2.5 h-2.5" /> {evt.performanceStart || "21:00"} {evt.performanceEnd ? `— ${evt.performanceEnd}` : ""}
                       </div>
                    </div>
                  </div>

                  {/* Bloque Central: Info Show */}
                  <div className="flex-1 text-center md:text-left space-y-3 md:space-y-2 w-full">
                     <h3 className="text-white font-black text-2xl md:text-2xl uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">
                        {displayLocationName}
                     </h3>
                     <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-y-2 gap-x-4 text-gray-400 text-[11px] font-bold uppercase tracking-wide">
                        <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md md:bg-transparent md:px-0 md:py-0">
                           <MapPin className="w-3 h-3 text-primary/60" /> {displayAddress}
                        </span>
                        <span className="hidden sm:inline text-white/10">|</span>
                        <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md md:bg-transparent md:px-0 md:py-0">
                           <Music className="w-3 h-3 text-primary/60" /> {evt.ceremonyType?.replace("_", " ").replace("cumpleanos", "cumpleaños") || "A confirmar"}
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
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 md:px-4 md:py-2 rounded-xl border border-white/10 bg-white/5 text-[11px] md:text-[10px] font-black text-gray-300 hover:bg-primary/20 hover:border-primary/30 hover:text-primary transition-all uppercase tracking-widest"
                          >
                            <MapPin className="w-3.5 h-3.5 md:w-3 md:h-3" /> Mapa
                          </a>
                        )}
                        {(evt.location?.phone) && (
                          <a 
                            href={`tel:${evt.location.phone}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 md:px-4 md:py-2 rounded-xl border border-primary bg-primary text-[11px] md:text-[10px] font-black text-white hover:bg-red-700 transition-all uppercase tracking-widest shadow-lg shadow-primary/20"
                          >
                            <Phone className="w-3.5 h-3.5 md:w-3 md:h-3" /> Reservar
                          </a>
                        )}
                      </>
                    ) : (
                      <div className="w-full md:w-auto text-center md:text-right py-3 md:py-1.5 px-6 rounded-full border border-white/10 bg-white/[0.02] text-[10px] md:text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                          Evento Privado
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        <div className="mt-16 text-center max-w-2xl mx-auto">
           <p className="text-gray-500 text-[11px] md:text-sm italic px-6">
              * Debido a la naturaleza de los eventos privados (bodas, corporativos), algunas ubicaciones exactas están reservadas por privacidad de nuestros clientes.
           </p>
        </div>
      </div>
    </section>
  )
}
