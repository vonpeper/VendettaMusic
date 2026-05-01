"use client"

import { useState, useEffect, useCallback } from "react"
import { FunnelData }  from "./FunnelWizard"
import { Button }      from "@/components/ui/button"
import { Calendar, Clock, AlertCircle, MessageCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateMX } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  data: Partial<FunnelData>
  onNext: (d: Partial<FunnelData>) => void
  onBack: () => void
}

interface DayStatus {
  available:  boolean
  isPending:  boolean
  loading:    boolean
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAYS   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

const TIME_SLOTS = [
  "08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00","00:00","01:00","02:00","03:00"
]

function dateToISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

export default function Step3_Fecha({ data, onNext, onBack }: Props) {
  const today          = new Date()
  today.setHours(0,0,0,0)
  const minDate = new Date(today.getTime() + 2 * 24 * 3600 * 1000) // Mínimo 2 días adelante

  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected,  setSelected]  = useState<Date | null>(
    data.requestedDate ? new Date(data.requestedDate) : null
  )
  const [startTime, setStartTime] = useState(data.startTime ?? "21:00")
  const [endTime,   setEndTime]   = useState(data.endTime   ?? "23:00")
  const [dayStatus, setDayStatus] = useState<Record<string,DayStatus>>({})
  const [error,     setError]     = useState("")
  const [showWAFallback, setShowWAFallback] = useState(false)
  const [logisticalConflict, setLogisticalConflict] = useState(false)
  const [checkingLogistics, setCheckingLogistics] = useState(false)

  // Días del mes en vista
  const firstDay   = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Chequear disponibilidad de un día específico
  const checkDay = useCallback(async (d: Date) => {
    const iso = dateToISO(d)
    if (dayStatus[iso] !== undefined) return
    setDayStatus(prev => ({ ...prev, [iso]: { available: true, isPending: false, loading: true } }))
    try {
      const res  = await fetch(`/api/disponibilidad?date=${iso}`)
      const json = await res.json()
      setDayStatus(prev => ({ ...prev, [iso]: { ...json, loading: false } }))
    } catch {
      setDayStatus(prev => ({ ...prev, [iso]: { available: true, isPending: false, loading: false } }))
    }
  }, [dayStatus])

  // Verificar conflicto logístico (Gap de 1.5h)
  useEffect(() => {
    if (!selected) return
    const iso = dateToISO(selected)
    
    async function verifyLogistics() {
      setCheckingLogistics(true)
      setLogisticalConflict(false)
      try {
        const res = await fetch(`/api/disponibilidad?date=${iso}&startTime=${startTime}&endTime=${endTime}`)
        const json = await res.json()
        if (json.logisticalConflict) {
          setLogisticalConflict(true)
        }
      } catch (err) {
        console.error("Error checking logistics:", err)
      } finally {
        setCheckingLogistics(false)
      }
    }

    verifyLogistics()
  }, [selected, startTime, endTime])

  // Pre-cargar días del mes visible
  useEffect(() => {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      if (date >= minDate) checkDay(date)
    }
  }, [viewYear, viewMonth])

  async function handleSelectDay(d: Date) {
    if (d < minDate) return
    setShowWAFallback(false)
    setLogisticalConflict(false)
    setError("")
    const iso  = dateToISO(d)
    const status = dayStatus[iso]

    if (status?.loading) return

    if (status && !status.available) {
      setSelected(d)
      setShowWAFallback(true)
      return
    }
    setSelected(d)
  }

  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WA ?? "5215500000000"
  const waUrl = selected
    ? `https://wa.me/${adminPhone.replace(/\D/g,"")}?text=${encodeURIComponent(
        `Hola, me interesa apartar la fecha ${formatDateMX(selected, "PPP")} entre las ${startTime} y las ${endTime}. El sistema indica que requiere coordinación logística. ¿Me apoyan?`
      )}`
    : "#"

  function handleNext() {
    if (!selected)   { setError("Selecciona una fecha."); return }
    const iso = dateToISO(selected)
    if (dayStatus[iso] && !dayStatus[iso].available) {
      setError("Esa fecha ya está reservada. Escríbenos por WhatsApp para opciones."); return
    }
    if (logisticalConflict) {
        setError("Hay un conflicto de logística. Por favor contáctanos por WhatsApp."); return
    }
    onNext({
      requestedDate: dateToISO(selected),
      startTime,
      endTime,
    })
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) }
    else setViewMonth(m => m-1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) }
    else setViewMonth(m => m+1)
  }

  const canGoBack = new Date(viewYear, viewMonth, 1) > new Date(today.getFullYear(), today.getMonth(), 1)

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-heading font-black text-white tracking-tight">
          Elige <span className="text-primary">fecha y horario</span>
        </h2>
        <p className="text-muted-foreground mt-2">
          Las fechas en rojo ya están reservadas. Las amarillas tienen una solicitud pendiente.
        </p>
      </div>

      {/* Calendario */}
      <div className="bg-card/40 border border-white/10 rounded-2xl p-5 mb-6">
        {/* Header mes */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} disabled={!canGoBack}
            className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="font-black text-white text-xl uppercase tracking-tighter">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth}
            className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Cabecera días semana */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas del mes */}
        <div className="grid grid-cols-7 gap-1">
          {/* Offset */}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d    = new Date(viewYear, viewMonth, i + 1)
            const iso  = dateToISO(d)
            const st   = dayStatus[iso]
            const past = d < minDate
            const isSel = selected && dateToISO(selected) === iso

            let cellClass = "rounded-lg w-full aspect-square flex items-center justify-center text-sm font-bold transition-all cursor-pointer "
            if (past) {
              cellClass += "text-white/15 cursor-not-allowed"
            } else if (st?.loading) {
              cellClass += "text-white/40 animate-pulse"
            } else if (st && !st.available) {
              cellClass += "bg-red-900/50 text-red-400 border border-red-700/50 cursor-not-allowed"
            } else if (st?.isPending) {
              cellClass += "bg-yellow-900/30 text-yellow-400 border border-yellow-700/40 hover:border-yellow-500"
            } else if (isSel) {
              cellClass += "bg-primary text-white shadow-lg shadow-primary/30 scale-110"
            } else {
              cellClass += "text-white hover:bg-white/10 border border-transparent hover:border-white/20"
            }

            return (
              <button
                key={iso}
                onClick={() => !past && handleSelectDay(d)}
                disabled={past}
                className={cellClass}
                title={
                  st?.loading ? "Verificando..." :
                  !st?.available ? "Fecha no disponible" :
                  st?.isPending ? "Solicitud pendiente" : ""
                }
              >
                {st?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : i + 1}
              </button>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
          {[
            { color: "bg-primary",          label: "Seleccionado" },
            { color: "bg-white/10",         label: "Disponible" },
            { color: "bg-yellow-900/30 border border-yellow-700/40", label: "Solicitud pendiente" },
            { color: "bg-red-900/50",       label: "No disponible" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${item.color}`} />
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp fallback — fecha bloqueada */}
      {showWAFallback && (
        <div className="rounded-2xl border border-yellow-500/40 bg-yellow-900/10 p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-yellow-300 mb-1">Esta fecha ya está reservada</div>
              <p className="text-sm text-muted-foreground mb-3">
                Escríbenos por WhatsApp y buscamos una alternativa o verificamos cambios de agenda.
              </p>
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Contactar por WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Conflicto Logístico */}
      {!showWAFallback && logisticalConflict && (
        <div className="rounded-2xl border border-yellow-500/40 bg-yellow-900/10 p-5 mb-6 animate-in fade-in zoom-in duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-yellow-300 mb-1">¡Gran fecha!</div>
              <p className="text-sm text-muted-foreground mb-3">
                Debido a la alta demanda técnica de Vendetta, requerimos coordinar la logística personalmente para asegurar el mejor show en este horario.
              </p>
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Coordinar Logística por WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Horario */}
      {selected && !showWAFallback && (
        <div className="bg-card/40 border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-bold text-white uppercase tracking-tighter">Horario del Show</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-muted-foreground mb-2 block uppercase tracking-[0.2em]">Inicio del Show</label>
              <Select value={startTime} onValueChange={v => setStartTime(v ?? "")}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 h-12 rounded-xl text-white font-bold focus:ring-primary/20 hover:bg-white/10 transition-all">
                  <SelectValue placeholder="Selecciona hora" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white max-h-[300px]">
                  {TIME_SLOTS.map(t => (
                    <SelectItem key={t} value={t} className="font-bold py-3">
                      {t} hrs
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-black text-muted-foreground mb-2 block uppercase tracking-[0.2em]">Término estimado</label>
              <Select value={endTime} onValueChange={v => setEndTime(v ?? "")}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 h-12 rounded-xl text-white font-bold focus:ring-primary/20 hover:bg-white/10 transition-all">
                  <SelectValue placeholder="Selecciona hora" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white max-h-[300px]">
                  {TIME_SLOTS.map(t => (
                    <SelectItem key={t} value={t} className="font-bold py-3">
                      {t} hrs
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mb-4 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 border-white/15 h-12">← Atrás</Button>
        <Button onClick={handleNext} className="flex-1 font-black h-12" disabled={!selected || showWAFallback}>
          Continuar → Anticipo
        </Button>
      </div>
    </div>
  )
}
