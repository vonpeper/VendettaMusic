"use client"

import { useState, useMemo } from "react"
import { AgendaEvent } from "@/actions/agenda"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Music, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ExternalLink, 
  Sparkles,
  CheckCircle2,
  Clock3,
  CalendarDays,
  Shirt,
  Info,
  Users
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  events: AgendaEvent[]
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const DAYS_HEADER = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const DRESS_LABELS: Record<string, string> = {
  formal: "🎩 Formal",
  formal_casual: "👔 Formal Casual",
  rock: "🎸 Rock",
  nocturno: "🌙 Nocturno",
  casual: "👕 Casual",
  playa: "🌴 Playa / Guayabera",
}

const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string; bg: string; dot: string }> = {
  agendado: {
    label: "Confirmado",
    color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-900/30 hover:bg-emerald-900/50 border-emerald-500/50 text-emerald-200",
    dot: "bg-emerald-400"
  },
  confirmed: {
    label: "Confirmado",
    color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-900/30 hover:bg-emerald-900/50 border-emerald-500/50 text-emerald-200",
    dot: "bg-emerald-400"
  },
  pendiente: {
    label: "Pendiente",
    color: "text-amber-400 border-amber-500/40 bg-amber-950/40",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    bg: "bg-amber-900/30 hover:bg-amber-900/50 border-amber-500/50 text-amber-200",
    dot: "bg-amber-400"
  },
  completado: {
    label: "Completado",
    color: "text-blue-400 border-blue-500/40 bg-blue-950/40",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    bg: "bg-blue-900/25 hover:bg-blue-900/40 border-blue-500/40 text-blue-200",
    dot: "bg-blue-400"
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-400 border-red-500/40 bg-red-950/40",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    bg: "bg-red-900/20 hover:bg-red-900/30 border-red-500/30 text-red-300",
    dot: "bg-red-400"
  }
}

function formatDateString(isoString: string): string {
  const [year, month, day] = isoString.split("-").map(Number)
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  })
}

export function AgendaCalendarView({ events }: Props) {
  const today = new Date()
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  // Default month: if there are upcoming events, select month of next upcoming event, otherwise today
  const defaultDate = useMemo(() => {
    const upcoming = events.find(e => e.date >= todayISO && e.status !== "cancelado")
    if (upcoming) {
      const [y, m] = upcoming.date.split("-").map(Number)
      return { year: y, month: m - 1, selectedDate: upcoming.date }
    }
    return { year: today.getFullYear(), month: today.getMonth(), selectedDate: todayISO }
  }, [events, todayISO])

  const [viewYear, setViewYear] = useState<number>(defaultDate.year)
  const [viewMonth, setViewMonth] = useState<number>(defaultDate.month)
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate.selectedDate)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")

  // Group all events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, AgendaEvent[]> = {}
    events.forEach(evt => {
      if (!map[evt.date]) map[evt.date] = []
      map[evt.date].push(evt)
    })
    return map
  }, [events])

  // Navigation handlers
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const goToToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setSelectedDate(todayISO)
  }

  // Days calculations for the visible month
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Filtered events of the month for quick summary
  const monthEvents = useMemo(() => {
    const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-`
    return events.filter(e => {
      if (!e.date.startsWith(monthPrefix)) return false
      if (statusFilter !== "todos" && e.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = e.title.toLowerCase().includes(q)
        const matchLoc = (e.locationName || "").toLowerCase().includes(q)
        const matchCity = (e.city || "").toLowerCase().includes(q)
        const matchNotes = (e.musicianNotes || "").toLowerCase().includes(q)
        if (!matchTitle && !matchLoc && !matchCity && !matchNotes) return false
      }
      return true
    })
  }, [events, viewYear, viewMonth, statusFilter, searchQuery])

  // Events of currently selected day
  const selectedDayEvents = useMemo(() => {
    const dayEvts = eventsByDate[selectedDate] || []
    if (statusFilter === "todos") return dayEvts
    return dayEvts.filter(e => e.status === statusFilter)
  }, [eventsByDate, selectedDate, statusFilter])

  // Count stats
  const totalUpcoming = events.filter(e => e.date >= todayISO && (e.status === "agendado" || e.status === "confirmed")).length
  const totalMonthEvents = monthEvents.length

  return (
    <div className="min-h-screen bg-[#070709] text-foreground pb-20">
      {/* Top Banner / Header */}
      <header className="relative border-b border-white/10 bg-gradient-to-b from-black via-zinc-950 to-[#070709] py-8 md:py-12 overflow-hidden">
        {/* Glow FX */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 md:w-[600px] h-32 bg-primary/20 blur-[100px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-3 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Agenda Oficial Vendetta
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-tight">
                Calendario de <span className="text-primary italic">Fechas</span>
              </h1>
              <p className="text-muted-foreground text-xs md:text-sm mt-1.5 max-w-xl">
                Consulta en tiempo real los shows, horarios de presentación y locaciones programadas.
              </p>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex items-center gap-3">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Próximos Shows</div>
                  <div className="text-xl font-black text-white">{totalUpcoming} <span className="text-xs text-emerald-400 font-normal">confirmados</span></div>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Este Mes</div>
                  <div className="text-xl font-black text-white">{totalMonthEvents} <span className="text-xs text-primary font-normal">fechas</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto px-4 max-w-6xl mt-8 space-y-8">
        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-zinc-900/40 border border-white/10 p-3 md:p-4 rounded-2xl backdrop-blur-md">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por evento, locación, ciudad o notas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-muted-foreground/60 h-11 rounded-xl text-sm focus:border-primary"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: "todos", label: "Todos los estatus" },
              { id: "agendado", label: "🟢 Confirmados" },
              { id: "pendiente", label: "🟡 Pendientes" },
              { id: "completado", label: "🔵 Completados" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === f.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid + Selected Day Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Monthly Calendar Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-5 md:p-7 shadow-2xl backdrop-blur-xl">
              {/* Calendar Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-heading font-black text-white uppercase tracking-tight">
                      {MONTHS[viewMonth]} <span className="text-primary">{viewYear}</span>
                    </h2>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
                      {monthEvents.length} {monthEvents.length === 1 ? "fecha registrada" : "fechas registradas"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 h-9 rounded-xl px-3"
                  >
                    Hoy
                  </Button>
                  <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1">
                    <button
                      onClick={prevMonth}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white transition-all"
                      title="Mes anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white transition-all"
                      title="Mes siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 mb-2 text-center">
                {DAYS_HEADER.map(d => (
                  <div key={d} className="text-[11px] font-black text-muted-foreground/80 uppercase py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Days Matrix */}
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {/* Empty cells before month start */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-transparent" />
                ))}

                {/* Month Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNumber = i + 1
                  const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`
                  const dayEvents = eventsByDate[dateKey] || []
                  const hasEvents = dayEvents.length > 0
                  const isSelected = selectedDate === dateKey
                  const isToday = todayISO === dateKey

                  // Determine dominant status color
                  let statusCfg = STATUS_CONFIG.agendado
                  if (hasEvents) {
                    const primaryEvt = dayEvents[0]
                    statusCfg = STATUS_CONFIG[primaryEvt.status] || STATUS_CONFIG.agendado
                  }

                  let cellClass = "relative aspect-square rounded-2xl p-1.5 md:p-2 flex flex-col justify-between items-center transition-all cursor-pointer select-none group "

                  if (isSelected) {
                    cellClass += "ring-2 ring-primary ring-offset-2 ring-offset-black bg-primary/20 shadow-lg shadow-primary/20 scale-[1.03] z-10 "
                  } else if (hasEvents) {
                    cellClass += `${statusCfg.bg} border shadow-sm hover:scale-105 hover:z-10 `
                  } else {
                    cellClass += "bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] text-muted-foreground "
                  }

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(dateKey)}
                      className={cellClass}
                    >
                      {/* Day Number */}
                      <div className="w-full flex items-center justify-between">
                        <span className={`text-xs md:text-sm font-black ${
                          isSelected ? "text-white" : hasEvents ? "text-white" : isToday ? "text-primary font-black" : "text-gray-400"
                        }`}>
                          {dayNumber}
                        </span>

                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" title="Hoy" />
                        )}
                      </div>

                      {/* Event Dot or Count Badge */}
                      {hasEvents && (
                        <div className="w-full flex flex-col items-center gap-0.5">
                          <div className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter truncate max-w-full text-center ${
                            isSelected ? "bg-primary text-white" : statusCfg.badge
                          }`}>
                            {dayEvents.length > 1 ? `${dayEvents.length} Shows` : dayEvents[0].startTime}
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400/50" />
                  <span className="text-gray-300">Confirmado / Agendado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-400/50" />
                  <span className="text-gray-300">Solicitud Pendiente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-400/50" />
                  <span className="text-gray-300">Completado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/10 border border-white/20" />
                  <span className="text-gray-400">Fecha Libre</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Details of the Selected Day (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-5 md:p-6 shadow-2xl backdrop-blur-xl">
              {/* Day Header */}
              <div className="pb-4 border-b border-white/10 mb-5">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-1">
                  Detalles del Día
                </span>
                <h3 className="text-xl md:text-2xl font-heading font-black text-white capitalize leading-tight">
                  {formatDateString(selectedDate)}
                </h3>
              </div>

              {/* Day Event List or Empty State */}
              {selectedDayEvents.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-muted-foreground/60">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-300 mb-1">Sin eventos para esta fecha</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    No hay ningún show ni presentación registrada para el {selectedDate}. Selecciona otro día en el calendario.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDayEvents.map(evt => {
                    const stCfg = STATUS_CONFIG[evt.status] || STATUS_CONFIG.agendado
                    return (
                      <div
                        key={evt.id}
                        className="bg-black/50 border border-white/10 rounded-2xl p-5 hover:border-primary/40 transition-all space-y-4 relative overflow-hidden group shadow-lg"
                      >
                        {/* Status color side bar */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${stCfg.dot}`} />

                        {/* Card Header: Title & Status Badge */}
                        <div className="flex items-start justify-between gap-3 pl-2">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mb-0.5">
                              {evt.ceremonyType || "Show Musical"}
                            </span>
                            <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors leading-tight">
                              {evt.title}
                            </h4>
                          </div>

                          <Badge className={`${stCfg.badge} border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shrink-0`}>
                            {stCfg.label}
                          </Badge>
                        </div>

                        {/* Times Block */}
                        <div className="grid grid-cols-2 gap-2 pl-2 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                          <div>
                            <div className="text-[9px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1 mb-1">
                              <Clock className="w-3 h-3 text-primary" /> Show
                            </div>
                            <div className="text-xs md:text-sm font-black text-white">
                              {evt.startTime} — {evt.endTime} hrs
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1 mb-1">
                              <Clock3 className="w-3 h-3 text-amber-400" /> Montaje / Llegada
                            </div>
                            <div className="text-xs md:text-sm font-bold text-gray-300">
                              {evt.arrivalTime || evt.setupTime || "Por definir"}
                            </div>
                          </div>
                        </div>

                        {/* Location Block */}
                        <div className="pl-2 space-y-2">
                          <div className="flex items-start gap-2 text-xs">
                            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-white leading-tight">
                                {evt.locationName || "Lugar por confirmar"}
                              </div>
                              {evt.city && (
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {evt.city}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Map Action Button */}
                          {evt.mapsLink && (
                            <a
                              href={evt.mapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors"
                            >
                              <MapPin className="w-3 h-3" /> Ver en Google Maps
                              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                            </a>
                          )}
                        </div>

                        {/* Show Details (Format, Dress code, Musician notes) */}
                        <div className="pl-2 pt-2 border-t border-white/10 space-y-2 text-xs">
                          {evt.packageName && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Music className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                              <span><strong className="text-white">Formato:</strong> {evt.packageName}</span>
                            </div>
                          )}

                          {evt.dressCode && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Shirt className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span><strong className="text-white">Vestimenta:</strong> {DRESS_LABELS[evt.dressCode] || evt.dressCode}</span>
                            </div>
                          )}

                          {evt.musicianNotes && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-200/90 text-xs">
                              <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                                <Info className="w-3 h-3" /> Notas de Logística
                              </div>
                              {evt.musicianNotes}
                            </div>
                          )}

                          {evt.musiciansCount !== undefined && evt.musiciansCount > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span><strong className="text-gray-200">{evt.confirmedMusiciansCount}/{evt.musiciansCount}</strong> músicos confirmados</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM: Full Month Events List / Schedule Table */}
        <section className="bg-zinc-900/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-1">
                Resumen Completo
              </span>
              <h3 className="text-xl md:text-2xl font-heading font-black text-white uppercase tracking-tight">
                Shows de {MONTHS[viewMonth]} {viewYear}
              </h3>
            </div>
            <div className="text-xs text-muted-foreground font-bold">
              Mostrando {monthEvents.length} {monthEvents.length === 1 ? "evento" : "eventos"}
            </div>
          </div>

          {monthEvents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-2xl">
              No hay shows registrados en este mes con los filtros actuales.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthEvents.map(evt => {
                const stCfg = STATUS_CONFIG[evt.status] || STATUS_CONFIG.agendado
                const isSelected = selectedDate === evt.date
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedDate(evt.date)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-3 ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                        : "bg-black/40 border-white/10 hover:border-white/25 hover:bg-black/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-black text-white font-mono bg-white/10 px-2.5 py-1 rounded-lg">
                        {evt.date}
                      </div>
                      <Badge className={`${stCfg.badge} border text-[9px] font-black uppercase`}>
                        {stCfg.label}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-base leading-tight truncate">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
                        {evt.locationName || evt.city || "Lugar por confirmar"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
                      <span className="flex items-center gap-1 font-mono font-bold text-primary">
                        <Clock className="w-3 h-3" /> {evt.startTime} - {evt.endTime}
                      </span>
                      {evt.ceremonyType && (
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                          {evt.ceremonyType}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
