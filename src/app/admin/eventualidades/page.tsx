import { db } from "@/lib/db"
import { BandEventsClient } from "@/components/admin/BandEventsClient"

export default async function EventualidadesPage() {
  // Fetch from the NEW consolidated table
  const newEvents = await db.event.findMany({
    orderBy: { date: "desc" },
    include: { 
      location: true, 
      client: { include: { user: true } } 
    }
  })

  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  // Map to the common UI structure
  const mappedNew = newEvents.map(e => ({
    id: e.id,
    eventDate: e.date,
    eventMonth: months[e.date.getUTCMonth()].trim(), 
    eventYear: e.date.getUTCFullYear(),
    clientName: (e.customName || e.client?.user?.name || "Sin Nombre").trim(),
    baseIncome: e.amount || 0,
    ivaAmount: e.ivaAmount || 0,
    totalIncome: e.totalIncome || e.amount || 0,
    eventType: e.ceremonyType || "show",
    status: e.status,
    location: e.location?.name || e.mapsLink || null,
    paymentMethod: e.paymentMethod || e.depositMethod,
    paymentRef: e.paymentRef,
    invoice: e.invoice,
    notes: e.musicianNotes,
    source: e.source || "manual",
    isNewModel: true
  }))

  const legacyEvents = await db.bandEvent.findMany({
    orderBy: [{ eventYear: "desc" }, { eventDate: "desc" }]
  })

  const mappedLegacy = legacyEvents.map(e => ({
    id: e.id,
    eventDate: e.eventDate,
    eventMonth: e.eventMonth.trim(),
    eventYear: e.eventYear,
    clientName: e.clientName.trim(),
    baseIncome: e.baseIncome,
    ivaAmount: e.ivaAmount,
    totalIncome: e.totalIncome,
    eventType: e.eventType,
    status: e.status,
    location: e.location,
    paymentMethod: e.paymentMethod,
    paymentRef: e.paymentRef,
    invoice: e.invoice,
    notes: e.notes,
    source: e.source || "excel_import",
    isNewModel: false
  }))

  const allEventsRaw = [...mappedNew, ...mappedLegacy].sort((a,b) => {
    return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  })

  // 🛡️ SERIALIZACIÓN SEGURA: Convertir a POJOs puros para evitar errores de hidratación/Turbopack con objetos Date
  const allEvents = JSON.parse(JSON.stringify(allEventsRaw))

  // Calcular anticipos bancarios reales (Solo futuros y confirmados)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  const upcomingRealEvents = newEvents.filter(e => e.date >= now && (e.status === "agendado" || e.status === "confirmed"))
  const currentAnticipos = upcomingRealEvents.reduce((acc, e) => acc + (e.deposit || 0), 0)

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
            Eventualidades e Ingresos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Control unificado de shows, eventualidades e ingresos de Vendetta.
          </p>
        </div>
      </div>

      <BandEventsClient events={allEvents as any} currentAnticipos={currentAnticipos} />
    </div>
  )
}
