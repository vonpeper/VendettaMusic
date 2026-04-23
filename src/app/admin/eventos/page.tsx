import { db } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { NuevoEventoButton, NotifyEventButton, EditEventoButton, DeleteEventoButton } from "@/components/admin/EventActions"
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
  const staffMapped = musicianProfiles.map(p => ({ id: p.id, name: p.user.name ?? "Sin nombre" }))

  return (
    <div className="p-8 bg-background min-h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
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

      <div className="border border-border/40 rounded-xl bg-card/20 overflow-x-auto">
        <Table className="min-w-[1300px]">
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-primary font-bold w-24">Fecha</TableHead>
              <TableHead>Identidad y Ubicación</TableHead>
              <TableHead>Tipo y Vestimenta</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Finanzas</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  No hay eventos registrados. Usa el botón <strong className="text-primary">+ Nuevo Evento</strong>.
                </TableCell>
              </TableRow>
            ) : events.map(evt => (
              <TableRow key={evt.id} className="border-border/40 align-top hover:bg-white/[0.02] transition-colors">

                {/* Fecha */}
                <TableCell className="py-4">
                  <div className="bg-primary/20 text-primary w-14 h-14 rounded-lg flex flex-col justify-center items-center">
                    <span className="text-xs font-bold uppercase leading-none">
                      {evt.date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" })}
                    </span>
                    <span className="text-xl font-black leading-none mt-1">{evt.date.getUTCDate()}</span>
                    <span className="text-[9px] text-primary/60">{evt.date.getUTCFullYear()}</span>
                  </div>
                </TableCell>

                {/* Identidad */}
                <TableCell className="py-4">
                  <div className="font-bold text-white text-base">
                    {evt.customName || evt.client?.user?.name || "Sin nombre"}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">👥 {evt.guestCount || 0} invitados</div>
                  {evt.location && (
                    <div className="text-xs text-muted-foreground mt-1">📍 {evt.location.name}</div>
                  )}
                  {evt.package && (
                    <div className="text-[10px] text-primary/80 mt-1 font-bold">📦 {evt.package.name}</div>
                  )}
                </TableCell>

                {/* Tipo y Vestimenta */}
                <TableCell className="py-4">
                  {evt.ceremonyType && (
                    <Badge variant="outline" className="border-white/20 text-gray-300 text-[10px] mb-1.5 block w-fit">
                      {evt.ceremonyType.replace("_", " ")}
                    </Badge>
                  )}
                  {evt.dressCode && (
                    <div className="text-xs text-muted-foreground">
                      {DRESS_LABELS[evt.dressCode] ?? evt.dressCode}
                    </div>
                  )}
                </TableCell>

                {/* Horario */}
                <TableCell className="py-4">
                  <div className="text-sm space-y-0.5">
                    {evt.arrivalTime && (
                      <div className="text-xs text-muted-foreground">Llegada: {evt.arrivalTime}</div>
                    )}
                    {evt.performanceStart && (
                      <div className="text-white font-medium">
                        ⏰ {evt.performanceStart}{evt.performanceEnd ? ` — ${evt.performanceEnd}` : ""}
                      </div>
                    )}
                    {!evt.performanceStart && !evt.arrivalTime && (
                      <span className="text-xs text-muted-foreground italic">Por confirmar</span>
                    )}
                  </div>
                </TableCell>

                {/* Finanzas */}
                <TableCell className="py-4">
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 w-56 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold text-white">{MXN(evt.amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Anticipo:</span>
                      <span className="text-green-400 font-bold">{MXN(evt.deposit)}</span>
                    </div>
                    {evt.depositMethod && (
                      <div className="text-[9px] text-green-500/70 text-right uppercase tracking-wider">{evt.depositMethod}</div>
                    )}
                    <div className="flex justify-between text-xs pt-1 border-t border-white/10">
                      <span className="text-muted-foreground">Resta:</span>
                      <span className="text-destructive font-bold">{MXN(evt.balance)}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Factura */}
                <TableCell className="py-4">
                  {evt.invoice ? (
                    <div>
                      <Badge className="bg-blue-900/50 text-blue-300 border-blue-500/50 text-[10px]">
                        Factura
                      </Badge>
                      {evt.totalWithTax && (
                        <div className="text-xs text-white font-bold mt-1">{MXN(evt.totalWithTax)}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No aplica</span>
                  )}
                </TableCell>

                {/* Estatus */}
                <TableCell className="py-4">
                  <Badge className={`text-[10px] border ${STATUS_COLORS[evt.status] ?? "border-white/10 text-gray-400"}`}>
                    {evt.status}
                  </Badge>
                  {evt.googleCalendarId && (
                    <div className="text-[9px] text-blue-400/70 mt-1 flex items-center gap-1">
                      📅 Google Cal
                    </div>
                  )}
                </TableCell>

                {/* Acciones */}
                <TableCell className="py-4 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <NotifyEventButton
                      eventId={evt.id}
                      alreadySent={evt.notificationSent}
                    />
                    <EditEventoButton
                      event={evt}
                      clients={clientsMapped}
                      locations={locations}
                      packages={packages}
                      staff={staffMapped}
                      showText={true}
                    />
                    <DeleteEventoButton
                      eventId={evt.id}
                      showText={true}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
