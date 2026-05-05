import { db } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { NuevoEventoButton } from "@/components/admin/EventActions"
import { MasterEventsTable } from "@/components/admin/MasterEventsTable"
import { Info, Bell } from "lucide-react"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

const DRESS_LABELS: Record<string, string> = {
  formal:        "🎩 Formal",
  formal_casual: "👔 Formal Casual",
  rock:          "🎸 Rock",
  nocturno:      "🌙 Nocturno",
}

const STATUS_COLORS: Record<string, string> = {
  pendiente:  "border-yellow-500/40 text-yellow-300 bg-yellow-900/30",
  agendado:   "border-green-500/40 text-green-300 bg-green-900/30",
  completado: "border-blue-500/40 text-blue-300 bg-blue-900/30",
  cancelado:  "border-red-500/40 text-red-300 bg-red-900/30",
}

export default async function AdminEventosPage() {
  const [events, clients, locations, packages, musicianProfiles] = await Promise.all([
    db.event.findMany({
      orderBy: { date: "desc" },
      include: {
        client:   { include: { user: true } },
        location: true,
        package:  true,
        bookingRequest: true,
        musicians: true,
      }
    }),
    db.clientProfile.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } }
    }),
    db.$queryRawUnsafe<any[]>(`SELECT * FROM Location ORDER BY name ASC`),
    db.package.findMany({ orderBy: { name: "asc" } }),
    db.musicianProfile.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } }
    }),
  ])

  const clientsMapped = clients.map(c => ({ id: c.id, name: c.user.name ?? c.user.email ?? "Sin nombre" }))
  
  // Filtrar solo Ingenieros y Staff para el campo de Audio Engineer
  const staffMapped = musicianProfiles
    .filter(p => 
      p.instrument?.toLowerCase().includes("ingeniero") || 
      p.instrument?.toLowerCase().includes("staff")
    )
    .map(p => ({ id: p.id, name: p.user.name ?? "Sin nombre" }))

  const now = new Date()

  return (
    <div className="p-8 bg-background min-h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
            Registro Maestro de Eventos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Shows confirmados — sincronizados automáticamente con Eventualidades e Ingresos.
          </p>
        </div>
        <NuevoEventoButton
          clients={clientsMapped}
          locations={locations}
          packages={packages}
          staff={staffMapped}
        />
      </div>

      <MasterEventsTable 
        events={events}
        clients={clientsMapped}
        locations={locations}
        packages={packages}
        staff={staffMapped}
      />
    </div>
  )
}
