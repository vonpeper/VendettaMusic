import { db } from "@/lib/db"
import { formatDateMX } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NuevoEnsayoButton, DeleteRehearsalButton } from "@/components/admin/RehearsalActions"
import { AddSubstituteForm, DeleteSubstituteButton } from "@/components/admin/SubstituteActions"
import { AddMusicianForm } from "@/components/admin/MusicianActions"
import { Music, MapPin, Calendar as CalendarIcon, Users } from "lucide-react"

export default async function AdminEnsayosPage() {
  const [rehearsals, musicians, locations, songs] = await Promise.all([
    db.rehearsal.findMany({
      orderBy: { datetime: "asc" },
      include: {
        location: true,
        songs: { include: { song: true } },
        musicians: { include: { musician: { include: { user: true } } } }
      }
    }),
    db.musicianProfile.findMany({
      include: {
        user: true,
        substitutes: true
      },
      orderBy: { user: { name: "asc" } }
    }),
    db.$queryRawUnsafe<any[]>(`SELECT * FROM Location ORDER BY name ASC`),
    db.song.findMany({ orderBy: { title: "asc" } })
  ])

  // Split rehearsals
  const now = new Date()
  const upcomingRehearsals = rehearsals.filter(r => r.datetime >= now)
  const pastRehearsals = rehearsals.filter(r => r.datetime < now)

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Agenda de Ensayos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Organiza reuniones, reparte material y notifica a los músicos.</p>
        </div>
        <NuevoEnsayoButton locations={locations} musicians={musicians} songs={songs} />
      </div>

      <div className="max-w-4xl space-y-8">
        {/* Left Column: Rehearsals */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" /> Próximos Ensayos
            </h2>
            {upcomingRehearsals.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/20 rounded-xl bg-card/20">
                <p className="text-muted-foreground">No hay ensayos programados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingRehearsals.map(rehearsal => (
                  <div key={rehearsal.id} className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-lg font-bold text-primary">{formatDateMX(rehearsal.datetime, "EEEE, d 'de' MMMM, yyyy - HH:mm 'hrs'")}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" /> {rehearsal.location?.name || "Sin ubicación"}
                        </p>
                      </div>
                      <DeleteRehearsalButton rehearsalId={rehearsal.id} />
                    </div>

                    {rehearsal.notes && (
                      <div className="mb-4 p-3 bg-black/20 rounded-lg text-sm text-gray-300 border border-white/5">
                        <span className="font-bold text-white block mb-1">Notas / Tarea:</span>
                        {rehearsal.notes}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Repertorio</p>
                        {rehearsal.songs.length > 0 ? (
                          <ul className="text-sm space-y-1">
                            {rehearsal.songs.map(rs => (
                              <li key={rs.id} className="flex items-start gap-2 text-gray-300">
                                <Music className="w-4 h-4 mt-0.5 shrink-0 text-white/50" /> 
                                <span><span className="text-white">{rs.song.title}</span> <span className="text-white/50 text-xs">({rs.song.artist})</span></span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-white/40 italic">Ninguno especificado</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Convocados</p>
                        {rehearsal.musicians.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {rehearsal.musicians.map(rm => (
                              <span key={rm.id} className="px-2 py-1 bg-white/10 text-xs rounded-md text-white border border-white/5">
                                {rm.musician.user.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-white/40 italic">Asistencia libre / No especificada</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Past rehearsals can go here optionally */}
        </div>
      </div>
    </div>
  )
}
