export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { BandEventsClient } from "@/components/admin/BandEventsClient"
import { Button } from "@/components/ui/button"
import { autoCompleteConcludedEvents } from "@/lib/events-automation"
import { Download } from "lucide-react"

export default async function EventualidadesPage() {
  // Reconciliar eventos pasados de forma transparente
  await autoCompleteConcludedEvents()

  // Fetch from the NEW consolidated table
  const newEvents = await db.event.findMany({
    orderBy: { date: "desc" },
    include: { 
      location: true, 
      client: { include: { user: true } },
      bookingRequest: {
        select: {
          viaticosAmount: true,
          baseAmount: true
        }
      }
    }
  })

  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  // Map to the common UI structure
  const mappedNew = newEvents.map(e => {
    const viaticos = Number(e.bookingRequest?.viaticosAmount || 0)
    const rawAmount = Number(e.amount || 0)
    // El ingreso base neto de la presentación excluyendo viáticos
    const baseIncome = Math.max(0, rawAmount - viaticos)
    const ivaAmount = Number(e.ivaAmount || 0)
    // El total real cobrado incluyendo IVA
    const totalIncome = (e.totalWithTax && Number(e.totalWithTax) > 0)
      ? Number(e.totalWithTax)
      : (e.totalIncome && Number(e.totalIncome) > 0)
      ? Number(e.totalIncome)
      : (rawAmount + ivaAmount)

    return {
      id: e.id,
      eventDate: e.date,
      eventMonth: months[e.date.getUTCMonth()].trim(), 
      eventYear: e.date.getUTCFullYear(),
      clientName: (e.customName || e.client?.user?.name || "Sin Nombre").trim(),
      baseIncome,
      viaticos,
      ivaAmount,
      totalIncome,
      deposit: Number(e.deposit || 0),
      balance: Number(e.balance || 0),
      eventType: e.ceremonyType || "show",
      status: e.status,
      location: e.location?.name || e.mapsLink || null,
      paymentMethod: e.paymentMethod || e.depositMethod,
      paymentRef: e.paymentRef,
      invoice: e.invoice,
      notes: e.musicianNotes,
      source: e.source || "manual",
      isNewModel: true
    }
  })

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
    viaticos: 0,
    ivaAmount: e.ivaAmount,
    totalIncome: e.totalIncome,
    deposit: 0,
    balance: 0,
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

  // Calcular anticipos bancarios reales (agendados/confirmados de eventos próximos que aún no suceden, hasta que pasen a completado)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const upcomingRealEvents = newEvents.filter(e => {
    if (e.status !== "agendado" && e.status !== "confirmed") return false
    return new Date(e.date) >= startOfToday
  })
  const currentAnticipos = upcomingRealEvents.reduce((acc, e) => acc + (e.deposit || 0), 0)

  const anticiposList = upcomingRealEvents
    .filter(e => (e.deposit || 0) > 0)
    .map(e => ({
      id: e.id,
      clientName: e.customName || e.client?.user?.name || "Sin nombre",
      date: e.date,
      amount: e.deposit || 0
    }))

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-10">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
            Eventualidades e Ingresos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Control unificado de shows, eventualidades e ingresos de Vendetta.
          </p>
        </div>
        <Button 
          variant="outline" 
          asChild
          className="border-border/40 hover:bg-muted gap-2 h-11 px-6 rounded-xl font-bold transition-all shadow-sm"
        >
          <a href="/api/admin/export?type=events" download>
            <Download className="w-5 h-5" /> Exportar a Excel
          </a>
        </Button>
      </div>

      <BandEventsClient 
        events={allEvents as any} 
        currentAnticipos={currentAnticipos} 
        anticiposList={anticiposList} 
      />
    </div>
  )
}
