"use client"

import { useState, useMemo } from "react"
import { BandEventForm } from "@/components/admin/BandEventForm"
import { deleteBandEventAction, updateBandEventStatusAction } from "@/actions/band-events"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Eye, Loader2 } from "lucide-react"
import { formatDateMX } from "@/lib/utils"
import { updateEventStatusAction } from "@/actions/events"
import { toast } from "sonner"

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const MXN = (v: number) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(v)

const STATUS_COLORS: Record<string, string> = {
  agendado:   "bg-blue-900/50 text-blue-300 border-blue-600/40",
  completado: "bg-green-900/50 text-green-300 border-green-600/40",
  pendiente:  "bg-yellow-900/50 text-yellow-300 border-yellow-600/40",
  cancelado:  "bg-red-900/50 text-red-300 border-red-600/40",
}

const STATUS_OPTIONS = [
  { value: "pendiente",  label: "Pendiente" },
  { value: "agendado",   label: "Agendado" },
  { value: "completado", label: "Completado" },
  { value: "cancelado",  label: "Cancelado" },
]

type BandEvent = {
  id: string
  eventDate: Date
  eventMonth: string
  eventYear: number
  clientName: string
  baseIncome: number
  ivaAmount: number
  totalIncome: number
  eventType: string
  status: string
  location: string | null
  paymentMethod: string | null
  paymentRef: string | null
  invoice: boolean
  notes: string | null
  source: string
  isNewModel?: boolean
}

export function BandEventsClient({ events = [], currentAnticipos = 0 }: { events: BandEvent[], currentAnticipos?: number }) {
  // 🛡️ GUARD: Evitar crashes si events no es un array
  const safeEvents = Array.isArray(events) ? events : []

  const [search, setSearch]     = useState("")
  const [monthFilter, setMonth] = useState("")
  const [yearFilter, setYear]   = useState("")
  const [statusFilter, setStatus] = useState("")
  const [typeFilter, setType]   = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<BandEvent | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const years  = useMemo(() => [...new Set(safeEvents.map(e => e.eventYear))].sort((a,b) => b-a), [safeEvents])
  const availableMonths = useMemo(() => {
    const unique = [...new Set(safeEvents.map(e => e.eventMonth))]
    return unique.sort((a,b) => {
        const idxA = MONTHS.indexOf(a)
        const idxB = MONTHS.indexOf(b)
        return idxA - idxB
    })
  }, [safeEvents])

  const filtered = useMemo(() => safeEvents.filter(e => {
    const searchLow = search.toLowerCase()
    const clientLow = e.clientName.toLowerCase()
    const locLow    = (e.location || "").toLowerCase()
    const notesLow  = (e.notes || "").toLowerCase()

    if (search && !clientLow.includes(searchLow) && !locLow.includes(searchLow) && !notesLow.includes(searchLow)) return false
    if (monthFilter && e.eventMonth.toLowerCase() !== monthFilter.toLowerCase()) return false
    if (yearFilter && e.eventYear !== parseInt(yearFilter)) return false
    if (statusFilter && e.status !== statusFilter) return false
    if (typeFilter && e.eventType !== typeFilter) return false
    return true
  }), [events, search, monthFilter, yearFilter, statusFilter, typeFilter])

  // KPIs sobre datos filtrados (Solo eventos que ya sucedieron para ingresos reales)
  const kpis = useMemo(() => {
    const now = new Date()
    const happened = filtered.filter(e => {
        const d = new Date(e.eventDate)
        const isPast = d <= now
        // Solo sumamos ingresos si ya pasó Y no está cancelado (o si es completado)
        return isPast && e.status !== "cancelado" && e.status !== "pendiente"
    })

    const total    = happened.reduce((s,e) => s+e.totalIncome, 0)
    const base     = happened.reduce((s,e) => s+e.baseIncome, 0)
    const iva      = happened.reduce((s,e) => s+e.ivaAmount, 0)
    const count    = happened.length
    const avg      = count ? total/count : 0
    
    // De los que ya sucedieron, buscar los de este mes
    const thisMonth = happened.filter(e => e.eventYear===now.getFullYear() && e.eventMonth===MONTHS[now.getMonth()])
    const monthTotal = thisMonth.reduce((s,e) => s+e.totalIncome, 0)
    
    return { total, base, iva, count, avg, monthTotal }
  }, [filtered])

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este evento? Esta acción no se puede deshacer.")) return
    setDeleting(id)
    await deleteBandEventAction(id)
    setDeleting(null)
  }

  function toEditForm(e: BandEvent) {
    return {
      id: e.id,
      clientName: e.clientName,
      eventDate: new Date(e.eventDate).toISOString().split("T")[0],
      baseIncome: e.baseIncome,
      ivaAmount: e.ivaAmount,
      totalIncome: e.totalIncome,
      eventType: e.eventType,
      status: e.status,
      location: e.location,
      paymentMethod: e.paymentMethod,
      paymentRef: e.paymentRef,
      invoice: e.invoice,
      isNewModel: e.isNewModel,
    }
  }

  return (
    <>
      {(showForm || editing) && (
        <BandEventForm
          onClose={() => { setShowForm(false); setEditing(null) }}
          editing={editing ? toEditForm(editing) : undefined}
        />
      )}

      {/* Anticipos (Standalone) */}
      <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 flex items-center justify-between">
         <div>
            <span className="text-xs uppercase tracking-[0.2em] text-blue-400 font-bold">Reserva en Banco (Eventos Próximos)</span>
            <p className="text-sm text-blue-200/70 mt-1">Suma exclusiva de anticipos cobrados para shows que aún no suceden.</p>
         </div>
         <div className="text-3xl font-black text-blue-400">
            {MXN(currentAnticipos)}
         </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Total Acumulado",       value: MXN(kpis.total),     highlight: true },
          { label: "Mes Actual",            value: MXN(kpis.monthTotal), highlight: false },
          { label: "Nº de Eventos",         value: kpis.count.toString(), highlight: false },
          { label: "Promedio / Evento",     value: MXN(kpis.avg),        highlight: false },
          { label: "Total IVA",             value: MXN(kpis.iva),        highlight: false },
          { label: "Total Base (sin IVA)",  value: MXN(kpis.base),       highlight: false },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 flex flex-col gap-1 ${k.highlight ? "border-primary/40 bg-primary/10" : "border-white/10 bg-card/30"}`}>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</span>
            <span className={`text-lg font-black leading-tight ${k.highlight ? "text-primary" : "text-white"}`}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-card/30 border border-white/10 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <Input placeholder="🔍 Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-background border-white/10 text-white placeholder:text-muted-foreground" />
        <select value={monthFilter} onChange={e => setMonth(e.target.value)}
          className="flex h-10 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Todos los meses</option>
          {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={yearFilter} onChange={e => setYear(e.target.value)}
          className="flex h-10 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Todos los años</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="flex h-10 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Todos los estatus</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setType(e.target.value)}
          className="flex h-10 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Todos los tipos</option>
          {["show","eventualidad","corporativo","social","festival","privado"].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="border border-border/40 rounded-xl bg-card/20 overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-4 py-3 text-primary font-bold text-xs uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Mes</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Cliente</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground text-right">Ingreso</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground text-right">IVA</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground text-right">Total</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Estatus</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Origen</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-16 text-center text-muted-foreground">
                No hay eventos que coincidan con los filtros aplicados.
              </td></tr>
            ) : filtered.map(ev => (
              <tr key={ev.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-white font-medium">
                  {formatDateMX(new Date(ev.eventDate), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{ev.eventMonth} {ev.eventYear}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{ev.clientName}</div>
                  {ev.location && <div className="text-xs text-muted-foreground">📍 {ev.location}</div>}
                </td>
                <td className="px-4 py-3 text-right text-gray-300">{MXN(ev.baseIncome)}</td>
                <td className="px-4 py-3 text-right text-gray-300">{ev.ivaAmount > 0 ? MXN(ev.ivaAmount) : <span className="text-muted-foreground/50">—</span>}</td>
                <td className="px-4 py-3 text-right font-bold text-white">{MXN(ev.totalIncome)}</td>
                <td className="px-4 py-3">
                  <StatusSelector 
                    eventId={ev.id} 
                    currentStatus={ev.status} 
                    isNewModel={ev.isNewModel}
                  />
                </td>
                <td className="px-4 py-3 capitalize text-gray-300 text-xs">{ev.eventType}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-[10px] ${ev.source==="excel_import" ? "border-blue-500/40 text-blue-400" : "border-white/10 text-muted-foreground"}`}>
                    {ev.source === "excel_import" ? "Excel" : "Manual"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary hover:bg-primary/10"
                      onClick={() => setEditing(ev)} title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(ev.id)} disabled={deleting === ev.id} title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t border-white/20 bg-white/[0.03]">
                <td colSpan={3} className="px-4 py-3 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Subtotales ({filtered.length} eventos)
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-300">{MXN(kpis.base)}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-300">{MXN(kpis.iva)}</td>
                <td className="px-4 py-3 text-right font-black text-primary text-base">{MXN(kpis.total)}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* FAB / Botón flotante */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-8 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-full shadow-2xl shadow-primary/30 transition-all hover:scale-105 flex items-center gap-2 z-40"
      >
        <span className="text-lg leading-none">+</span> Agregar Evento
      </button>
    </>
  )
}

function StatusSelector({ eventId, currentStatus, isNewModel }: { eventId: string, currentStatus: string, isNewModel?: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return
    
    setLoading(true)
    const res = isNewModel 
      ? await updateEventStatusAction(eventId, newStatus)
      : await updateBandEventStatusAction(eventId, newStatus)
      
    if (res.success) {
      toast.success("Estatus actualizado")
    } else {
      toast.error(res.error || "Error al actualizar")
    }
    setLoading(false)
  }

  return (
    <div className="relative flex items-center">
      {loading && <Loader2 className="absolute -left-5 w-3 h-3 animate-spin text-primary" />}
      <select
        value={currentStatus}
        disabled={loading}
        onChange={(e) => handleStatusChange(e.target.value)}
        className={`text-[10px] font-bold py-1 px-2 rounded-full border border-white/10 bg-transparent cursor-pointer hover:border-white/30 transition-all outline-none appearance-none text-center ${STATUS_COLORS[currentStatus] || "text-gray-400"}`}
        style={{ minWidth: '94px' }}
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white capitalize">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
