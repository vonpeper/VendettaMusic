import { db } from "@/lib/db"
import { RepertoireManager } from "@/components/admin/RepertoireManager"
import { Music, ListMusic, Layers, Radio } from "lucide-react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminRepertorioPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin")
  }
  const [songs, setlists] = await Promise.all([
    db.song.findMany({ 
      orderBy: { title: "asc" },
      where: { status: "active" }
    }),
    db.setlist.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        songs: {
          include: { song: true },
          orderBy: { order: "asc" }
        }
      }
    })
  ])

  // Categorization metrics
  const totalSongs = songs.length
  const genres = Array.from(new Set(songs.map(s => s.genre).filter(Boolean))).length
  const eras = Array.from(new Set(songs.map(s => s.era).filter(Boolean))).length

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Repertorio Maestro</h1>
        <p className="text-muted-foreground mt-1 text-sm">Gestiona la biblioteca de canciones, importa material y crea setlists dinámicos.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border/40 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Music className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">Total Canciones</span>
          </div>
          <div className="text-2xl font-black text-foreground">{totalSongs}</div>
        </div>
        
        <div className="bg-card border border-border/40 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Géneros</span>
          </div>
          <div className="text-2xl font-black text-foreground">{genres}</div>
        </div>

        <div className="bg-card border border-border/40 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Radio className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Épocas</span>
          </div>
          <div className="text-2xl font-black text-foreground">{eras}</div>
        </div>

        <div className="bg-card border border-border/40 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ListMusic className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Setlists</span>
          </div>
          <div className="text-2xl font-black text-foreground">{setlists.length}</div>
        </div>
      </div>

      <RepertoireManager initialSongs={songs} initialSetlists={setlists} />
    </div>
  )
}
