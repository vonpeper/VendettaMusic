import { db } from "@/lib/db"
import { Users, AlertTriangle, CheckCircle, Calendar, Mic } from "lucide-react"
import { BandaClientView } from "@/components/admin/BandaClientView"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminBandaPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin")
  }
  const [musicians, upcomingEvents, upcomingRehearsals] = await Promise.all([
    db.musicianProfile.findMany({
      include: { 
        user: true, 
        substitutes: true 
      },
      orderBy: { user: { name: "asc" } }
    }),
    db.event.count({ where: { date: { gte: new Date() } } }),
    db.rehearsal.count({ where: { datetime: { gte: new Date() } } })
  ])

  // Metrics calculation
  const activeMusicians = musicians.filter(m => m.status === 'active')
  const totalActive = activeMusicians.length
  
  const allSubs = musicians.flatMap(m => m.substitutes)
  const availableSubs = allSubs.filter(s => s.status === 'active' && s.availability === 'Disponible').length
  
  const atRisk = activeMusicians.filter(m => m.substitutes.length === 0).length

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Banda y Suplentes</h1>
        <p className="text-muted-foreground mt-1 text-sm">Dashboard operativo de disponibilidad y cobertura.</p>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-card border border-border/40 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">Activos</span>
          </div>
          <div className="text-2xl font-black text-foreground">{totalActive}</div>
        </div>

        <div className="bg-card border border-border/40 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Suplentes Disp.</span>
          </div>
          <div className="text-2xl font-black text-foreground">{availableSubs}</div>
        </div>

        <div className="bg-card border border-border/40 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <AlertTriangle className={`w-4 h-4 ${atRisk > 0 ? "text-red-400" : "text-primary"}`} />
            <span className="text-xs font-bold uppercase tracking-wider">En Riesgo</span>
          </div>
          <div className="text-2xl font-black text-foreground">{atRisk}</div>
        </div>

        <div className="bg-card border border-border/40 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Shows Próx.</span>
          </div>
          <div className="text-2xl font-black text-foreground">{upcomingEvents}</div>
        </div>

        <div className="bg-card border border-border/40 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Mic className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Ensayos Próx.</span>
          </div>
          <div className="text-2xl font-black text-foreground">{upcomingRehearsals}</div>
        </div>
      </div>

      {/* Main Client View (Tabs: Tarjetas / Matriz) */}
      <BandaClientView initialMusicians={musicians} />
    </div>
  )
}
