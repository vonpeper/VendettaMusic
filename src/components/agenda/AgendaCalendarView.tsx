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
  Users, 
  X, 
  CalendarCheck,
  SlidersHorizontal,
  Filter,
  RotateCcw,
  Calculator,
  ArrowLeft
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { PushNotificationButton } from "@/components/agenda/PushNotificationBanner"
import { DirectQuoteForm } from "@/components/public/DirectQuoteForm"

interface Props {
  events: AgendaEvent[]
  adminWhatsapp?: string | null
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
    bg: "bg-emerald-900/40 hover:bg-emerald-900/60 border-emerald-500/60 text-emerald-200",
    dot: "bg-emerald-400"
  },
  confirmed: {
    label: "Confirmado",
    color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    bg: "bg-emerald-900/40 hover:bg-emerald-900/60 border-emerald-500/60 text-emerald-200",
    dot: "bg-emerald-400"
  },
  pendiente: {
    label: "Pendiente",
    color: "text-amber-400 border-amber-500/40 bg-amber-950/40",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    bg: "bg-amber-900/40 hover:bg-amber-900/60 border-amber-500/60 text-amber-200",
    dot: "bg-amber-400"
  },
  completado: {
    label: "Completado",
    color: "text-blue-400 border-blue-500/40 bg-blue-950/40",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    bg: "bg-blue-900/30 hover:bg-blue-900/50 border-blue-500/50 text-blue-200",
    dot: "bg-blue-400"
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-400 border-red-500/40 bg-red-950/40",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    bg: "bg-red-900/25 hover:bg-red-900/40 border-red-500/40 text-red-300",
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

export function AgendaCalendarView({ events, adminWhatsapp }: Props) {
  const [currentView, setCurrentView] = useState<"agenda" | "cotizar">("agenda")
  const [quoteInitialDate, setQuoteInitialDate] = useState<string | null>(null)

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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false)

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== "todos"

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

  // When clicking a day on the calendar: select it AND open the instant pop-up!
  const handleDayClick = (dateKey: string) => {
    setSelectedDate(dateKey)
    setIsModalOpen(true)
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

  // Render Cotizador view when selected by user/musician
  if (currentView === "cotizar") {
    return (
      <div className="min-h-screen bg-[#070709] text-foreground pb-24">
        {/* Header Cotizador */}
        <header className="relative border-b border-white/10 bg-gradient-to-b from-black via-zinc-950 to-[#070709] pt-24 sm:pt-28 pb-8 overflow-hidden">
          {/* Glow de fondo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 md:w-[600px] h-32 bg-amber-500/15 blur-[100px] pointer-events-none rounded-full" />

          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            {/* Top Navigation Bar: Back button & switcher */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  setCurrentView("agenda")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-primary" />
                <span>Volver al Calendario</span>
              </button>

              {/* View Selector Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView("agenda")
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 text-gray-400 hover:text-white cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Agenda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView("cotizar")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-500 text-black font-black shadow-md shadow-amber-500/20"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Cotizador</span>
                </button>
              </div>
            </div>

            {/* Title Section */}
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-[11px] font-black uppercase tracking-[0.25em] mb-3 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Cotizador Oficial Vendetta
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-white uppercase tracking-tight">
                Cotizar Evento para <span className="text-amber-400 italic">Cliente</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                Personaliza la propuesta, selecciona paquetes y producción adicional, calcula viáticos en tiempo real y genera la propuesta lista para enviar al cliente por WhatsApp.
              </p>
            </div>
          </div>
        </header>

        {/* Form Container */}
        <main className="container mx-auto px-4 max-w-4xl mt-6 sm:mt-8 space-y-8">
          <div className="bg-zinc-900/40 border border-white/10 rounded-3xl p-4 sm:p-7 md:p-9 shadow-2xl backdrop-blur-xl">
            <DirectQuoteForm
              adminWhatsapp={adminWhatsapp}
              initialDate={quoteInitialDate}
            />
          </div>

          {/* Footer Back Button */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => {
                setCurrentView("agenda")
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>Regresar al Calendario de Shows</span>
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070709] text-foreground pb-20">
      {/* Top Banner / Header - Sleek & Compact */}
      <header className="relative border-b border-white/10 bg-gradient-to-b from-black via-zinc-950 to-[#070709] pt-24 sm:pt-28 pb-4 sm:pb-6 overflow-hidden">
        {/* Glow FX */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 md:w-[600px] h-32 bg-primary/20 blur-[100px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.25em] mb-2 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Agenda Oficial Vendetta
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-white uppercase tracking-tight">
                Calendario de <span className="text-primary italic">Fechas</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-xl">
                Toca cualquier fecha para abrir los detalles completos del show al instante.
              </p>
            </div>

            {/* Quick Stats Badges & Cotizar Action (Compact) */}
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 shrink-0">
              {/* Prominent Header Cotizar Button */}
              <button
                type="button"
                onClick={() => {
                  setQuoteInitialDate(null)
                  setCurrentView("cotizar")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Calculator className="w-4 h-4" />
                <span>Cotizar Evento</span>
              </button>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-inner">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Próximos</div>
                  <div className="text-sm sm:text-base font-black text-white">{totalUpcoming} <span className="text-[10px] text-emerald-400 font-normal">shows</span></div>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-inner">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Este Mes</div>
                  <div className="text-sm sm:text-base font-black text-white">{totalMonthEvents} <span className="text-[10px] text-primary font-normal">fechas</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container - CALENDAR IS NOW THE FIRST ELEMENT! */}
      <main className="container mx-auto px-4 max-w-6xl mt-4 sm:mt-6 space-y-6">
        {/* Main Monthly Calendar Card */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          {/* Calendar Controls & Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            {/* Left: Month and Year */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-black text-white uppercase tracking-tight">
                  {MONTHS[viewMonth]} <span className="text-primary">{viewYear}</span>
                </h2>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
                  {monthEvents.length} {monthEvents.length === 1 ? "fecha registrada" : "fechas registradas"}
                </p>
              </div>
            </div>

            {/* Right: Actions (Filtros, Alertas, Navegación de Mes) */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Filtros Pop-up Button */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                title="Filtrar por estatus o buscar por texto"
                className={`relative inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                  hasActiveFilters
                    ? "bg-primary/20 border-primary text-primary hover:bg-primary/30 shadow-md shadow-primary/20"
                    : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Filtros</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                )}
              </button>

              {/* Web Push Notification Pop-up Button */}
              <PushNotificationButton />

              {/* Cotizar Show Button in Toolbar */}
              <button
                type="button"
                onClick={() => {
                  setQuoteInitialDate(null)
                  setCurrentView("cotizar")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                title="Abrir cotizador de shows para clientes"
                className="relative inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400 text-xs font-bold transition-all cursor-pointer select-none shadow-sm shadow-amber-500/10"
              >
                <Calculator className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Cotizar</span>
              </button>

              {/* Subtle Divider */}
              <div className="w-px h-6 bg-white/10 mx-0.5 hidden sm:block" />

              {/* Month Navigation */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 h-9 sm:h-10 rounded-xl px-3 cursor-pointer"
              >
                Hoy
              </Button>
              <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-0.5 sm:p-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white transition-all cursor-pointer"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white transition-all cursor-pointer"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Summary Strip (Shown only when a filter is applied) */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-2 p-2.5 sm:px-4 bg-primary/10 border border-primary/20 rounded-2xl text-xs mb-5 animate-in fade-in">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                <span className="font-bold text-primary flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Filtros activos:
                </span>
                {statusFilter !== "todos" && (
                  <span className="bg-white/10 px-2 py-0.5 rounded-lg text-white font-bold text-[11px] shrink-0">
                    {STATUS_CONFIG[statusFilter]?.label || statusFilter}
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="bg-white/10 px-2 py-0.5 rounded-lg text-white font-bold text-[11px] shrink-0">
                    &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
                <span className="text-muted-foreground text-[11px] shrink-0">
                  ({monthEvents.length} {monthEvents.length === 1 ? "show coincide" : "shows coinciden"})
                </span>
              </div>

              <button
                type="button"
                onClick={() => { setSearchQuery(""); setStatusFilter("todos") }}
                className="text-primary hover:text-white hover:underline text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer ml-2"
              >
                <X className="w-3.5 h-3.5" /> Limpiar
              </button>
            </div>
          )}

          {/* Days Header */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {DAYS_HEADER.map(d => (
              <div key={d} className="text-[11px] md:text-xs font-black text-muted-foreground/80 uppercase py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 md:gap-3">
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

              let cellClass = "relative aspect-square rounded-2xl p-1 sm:p-2 flex flex-col justify-between items-center transition-all cursor-pointer select-none group "

              if (hasEvents) {
                cellClass += `${statusCfg.bg} border shadow-md hover:scale-105 active:scale-95 `
              } else if (isSelected) {
                cellClass += "ring-2 ring-primary bg-primary/15 "
              } else {
                cellClass += "bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] text-muted-foreground active:scale-95 "
              }

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDayClick(dateKey)}
                  className={cellClass}
                >
                  {/* Day Number */}
                  <div className="w-full flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-black ${
                      hasEvents ? "text-white" : isToday ? "text-primary font-black" : "text-gray-400"
                    }`}>
                      {dayNumber}
                    </span>

                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" title="Hoy" />
                    )}
                  </div>

                  {/* Event Indicator */}
                  {hasEvents && (
                    <div className="w-full flex flex-col items-center gap-0.5 mt-auto">
                      <div className={`px-1 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-tighter truncate max-w-full text-center ${statusCfg.badge}`}>
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

        {/* BOTTOM: Full Month Events Cards List */}
        <section className="bg-zinc-900/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-1">
                Resumen de Shows
              </span>
              <h3 className="text-xl md:text-2xl font-heading font-black text-white uppercase tracking-tight">
                Todos los eventos de {MONTHS[viewMonth]} {viewYear}
              </h3>
            </div>
            <div className="text-xs text-muted-foreground font-bold">
              {monthEvents.length} {monthEvents.length === 1 ? "evento programado" : "eventos programados"}
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
                return (
                  <div
                    key={evt.id}
                    onClick={() => handleDayClick(evt.date)}
                    className="p-5 rounded-2xl border bg-black/40 border-white/10 hover:border-primary/50 hover:bg-black/60 transition-all cursor-pointer text-left space-y-3 shadow-lg group relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${stCfg.dot}`} />

                    <div className="flex items-center justify-between gap-2 pl-2">
                      <div className="text-xs font-black text-white font-mono bg-white/10 px-2.5 py-1 rounded-lg">
                        {evt.date}
                      </div>
                      <Badge className={`${stCfg.badge} border text-[9px] font-black uppercase`}>
                        {stCfg.label}
                      </Badge>
                    </div>

                    <div className="pl-2">
                      <h4 className="font-bold text-white text-base leading-tight group-hover:text-primary transition-colors truncate">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        {evt.locationName || evt.city || "Lugar por confirmar"}
                      </p>
                    </div>

                    <div className="pt-2 pl-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
                      <span className="flex items-center gap-1 font-mono font-bold text-primary">
                        <Clock className="w-3.5 h-3.5" /> {evt.startTime} - {evt.endTime}
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

      {/* POP-UP MODAL (Instant details on date click) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl z-10 max-h-[88vh] overflow-y-auto custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10 mb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-wider mb-1">
                    <CalendarCheck className="w-3 h-3" /> Agenda de Fecha
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white capitalize leading-tight">
                    {formatDateString(selectedDate)}
                  </h3>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event Cards inside Modal */}
              {selectedDayEvents.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Fecha Disponible</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    No hay ningún show ni presentación registrada para este día.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="border-white/10 text-xs font-bold w-full sm:w-auto cursor-pointer"
                    >
                      Cerrar
                    </Button>
                    <Button
                      onClick={() => {
                        setQuoteInitialDate(selectedDate)
                        setIsModalOpen(false)
                        setCurrentView("cotizar")
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 w-full sm:w-auto"
                    >
                      <Calculator className="w-3.5 h-3.5" /> Cotizar esta fecha
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDayEvents.map(evt => {
                    const stCfg = STATUS_CONFIG[evt.status] || STATUS_CONFIG.agendado
                    return (
                      <div
                        key={evt.id}
                        className="bg-black/60 border border-white/10 rounded-2xl p-5 space-y-4 relative overflow-hidden shadow-xl"
                      >
                        {/* Status bar */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${stCfg.dot}`} />

                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-3 pl-2">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mb-0.5">
                              {evt.ceremonyType || "Show Musical"}
                            </span>
                            <h4 className="text-xl font-black text-white leading-tight">
                              {evt.title}
                            </h4>
                          </div>

                          <Badge className={`${stCfg.badge} border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shrink-0`}>
                            {stCfg.label}
                          </Badge>
                        </div>

                        {/* Times */}
                        <div className="grid grid-cols-2 gap-2 pl-2 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                          <div>
                            <div className="text-[9px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1 mb-1">
                              <Clock className="w-3.5 h-3.5 text-primary" /> Inicio Show
                            </div>
                            <div className="text-sm sm:text-base font-black text-white font-mono">
                              {evt.startTime} — {evt.endTime}
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1 mb-1">
                              <Clock3 className="w-3.5 h-3.5 text-amber-400" /> Montaje / Llegada
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-gray-300 font-mono">
                              {evt.arrivalTime || evt.setupTime || "Por definir"}
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="pl-2 space-y-2.5">
                          <div className="flex items-start gap-2.5 text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-white leading-tight">
                                {evt.locationName || "Lugar por confirmar"}
                              </div>
                              {evt.city && (
                                <div className="text-xs text-muted-foreground mt-0.5">
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
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-md shadow-primary/20"
                            >
                              <MapPin className="w-3.5 h-3.5" /> Abrir en Google Maps / Waze
                              <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                            </a>
                          )}
                        </div>

                        {/* Show Details */}
                        <div className="pl-2 pt-2 border-t border-white/10 space-y-2.5 text-xs">
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
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-amber-200/90 text-xs">
                              <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                                <Info className="w-3.5 h-3.5" /> Notas de Logística
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
            </motion.div>
          </div>
        )}

        {/* POP-UP MODAL (Filters and Search) */}
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl z-10 space-y-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-black text-white uppercase tracking-tight">
                      Filtros y Búsqueda
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Filtra la agenda por estatus o texto
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Buscar por texto
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Evento, locación, ciudad o notas..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-9 bg-black/50 border-white/10 text-white placeholder:text-muted-foreground/60 h-11 rounded-xl text-sm focus:border-primary"
                  />
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Estatus del evento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "todos", label: "Todos los estatus", icon: "✨" },
                    { id: "agendado", label: "Confirmados", icon: "🟢" },
                    { id: "pendiente", label: "Pendientes", icon: "🟡" },
                    { id: "completado", label: "Completados", icon: "🔵" },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex items-center gap-2 border ${
                        statusFilter === f.id
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                          : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border-white/5"
                      }`}
                    >
                      <span>{f.icon}</span>
                      <span className="truncate">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Count */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-muted-foreground flex items-center justify-between">
                <span>Resultados en {MONTHS[viewMonth]}:</span>
                <span className="font-bold text-white">
                  {monthEvents.length} {monthEvents.length === 1 ? "show coincide" : "shows coinciden"}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-2.5">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => { setSearchQuery(""); setStatusFilter("todos") }}
                    className="border-white/10 text-xs font-bold h-11 rounded-xl px-4 text-gray-300 hover:bg-white/10 cursor-pointer gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Limpiar
                  </Button>
                )}

                <Button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider h-11 rounded-xl shadow-lg shadow-primary/20 cursor-pointer"
                >
                  Ver {monthEvents.length} Resultados
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
