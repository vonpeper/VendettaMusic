"use client"

import { useState, useTransition, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  CreditCard, 
  Pencil, 
  RotateCcw, 
  Loader2, 
  Check, 
  X,
  Calculator,
  Sparkles,
  Info
} from "lucide-react"
import { calculateEventCostBreakdown } from "@/lib/pricing"
import { updateEventOperationalCostsAction } from "@/actions/ventas"
import { toast } from "sonner"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { 
  style: "currency", 
  currency: "MXN", 
  maximumFractionDigits: 0 
}).format(v)

interface EventCostBreakdownCardProps {
  bookingId: string
  hours: number
  isBar: boolean
  baseShowPrice: number
  initialMusicianPay?: number | null
  initialStaffPay?: number | null
}

export function EventCostBreakdownCard({
  bookingId,
  hours,
  isBar,
  baseShowPrice,
  initialMusicianPay = null,
  initialStaffPay = null,
}: EventCostBreakdownCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Desglose persistido actual
  const breakdown = useMemo(() => {
    return calculateEventCostBreakdown(
      hours, 
      isBar ? "bar" : "privado", 
      baseShowPrice > 0 ? baseShowPrice : undefined,
      initialMusicianPay,
      initialStaffPay
    )
  }, [hours, isBar, baseShowPrice, initialMusicianPay, initialStaffPay])

  // Valores de los inputs durante la edición en vivo
  const [musicianEachInput, setMusicianEachInput] = useState<string>(
    initialMusicianPay !== null && initialMusicianPay !== undefined
      ? initialMusicianPay.toString()
      : breakdown.musicianPayEach.toString()
  )
  const [musiciansTotalInput, setMusiciansTotalInput] = useState<string>(
    ((initialMusicianPay !== null && initialMusicianPay !== undefined
      ? initialMusicianPay
      : breakdown.musicianPayEach) * 4).toString()
  )
  const [staffPayInput, setStaffPayInput] = useState<string>(
    initialStaffPay !== null && initialStaffPay !== undefined
      ? initialStaffPay.toString()
      : breakdown.staffPay.toString()
  )

  // Entrar en modo edición sincronizando valores iniciales
  function startEditing() {
    const curEach = initialMusicianPay !== null && initialMusicianPay !== undefined
      ? initialMusicianPay
      : breakdown.musicianPayEach
    const curStaff = initialStaffPay !== null && initialStaffPay !== undefined
      ? initialStaffPay
      : breakdown.staffPay

    setMusicianEachInput(curEach.toString())
    setMusiciansTotalInput((curEach * 4).toString())
    setStaffPayInput(curStaff.toString())
    setIsEditing(true)
  }

  // Cancelar edición
  function cancelEditing() {
    const curEach = initialMusicianPay !== null && initialMusicianPay !== undefined
      ? initialMusicianPay
      : breakdown.musicianPayEach
    const curStaff = initialStaffPay !== null && initialStaffPay !== undefined
      ? initialStaffPay
      : breakdown.staffPay

    setMusicianEachInput(curEach.toString())
    setMusiciansTotalInput((curEach * 4).toString())
    setStaffPayInput(curStaff.toString())
    setIsEditing(false)
  }

  // Manejar cambio en sueldo por músico (actualiza el total de 4)
  function handleMusicianEachChange(val: string) {
    setMusicianEachInput(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0) {
      setMusiciansTotalInput(Math.round(num * 4).toString())
    } else {
      setMusiciansTotalInput("")
    }
  }

  // Manejar cambio en total de 4 músicos (actualiza el pago individual)
  function handleMusiciansTotalChange(val: string) {
    setMusiciansTotalInput(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0) {
      setMusicianEachInput(Math.round(num / 4).toString())
    } else {
      setMusicianEachInput("")
    }
  }

  // Recálculo automático en vivo mientras el usuario teclea
  const liveBreakdown = useMemo(() => {
    if (!isEditing) return breakdown

    const parsedEach = parseFloat(musicianEachInput)
    const parsedStaff = parseFloat(staffPayInput)

    const cleanEach = !isNaN(parsedEach) && parsedEach >= 0 ? parsedEach : breakdown.musicianPayEach
    const cleanStaff = !isNaN(parsedStaff) && parsedStaff >= 0 ? parsedStaff : breakdown.staffPay

    return calculateEventCostBreakdown(
      hours,
      isBar ? "bar" : "privado",
      baseShowPrice > 0 ? baseShowPrice : undefined,
      cleanEach,
      cleanStaff
    )
  }, [isEditing, hours, isBar, baseShowPrice, musicianEachInput, staffPayInput, breakdown])

  // Guardar ganancias modificadas
  async function handleSave() {
    const parsedMusician = parseFloat(musicianEachInput)
    const parsedStaff = parseFloat(staffPayInput)

    if (isNaN(parsedMusician) || parsedMusician < 0) {
      toast.error("Por favor ingresa un sueldo de músico válido")
      return
    }

    if (isNaN(parsedStaff) || parsedStaff < 0) {
      toast.error("Por favor ingresa un sueldo de staff válido")
      return
    }

    startTransition(async () => {
      try {
        const res = await updateEventOperationalCostsAction(
          bookingId,
          parsedMusician,
          parsedStaff
        )
        if (res.success) {
          toast.success("Ganancias y nómina operativa actualizadas con éxito")
          setIsEditing(false)
        } else {
          toast.error(res.error || "Fallo al actualizar ganancias")
        }
      } catch (err) {
        toast.error("Error de conexión al guardar montos")
      }
    })
  }

  // Restablecer a valores sugeridos
  async function handleResetToDefaults() {
    startTransition(async () => {
      try {
        const res = await updateEventOperationalCostsAction(bookingId, null, null)
        if (res.success) {
          toast.success("Montos restablecidos a los valores sugeridos por sistema")
          setIsEditing(false)
        } else {
          toast.error(res.error || "Fallo al restablecer montos")
        }
      } catch (err) {
        toast.error("Error de conexión al restablecer montos")
      }
    })
  }

  const isCustom = Boolean(breakdown.isCustomMusicianPay || breakdown.isCustomStaffPay)

  return (
    <Card className={`bg-card border-border/20 backdrop-blur-sm overflow-hidden border-l-4 transition-all ${
      isEditing ? "border-l-emerald-500 ring-2 ring-emerald-500/20 shadow-lg" : "border-l-emerald-600"
    }`}>
      {/* CABECERA */}
      <CardHeader className="bg-emerald-600/10 border-b border-border/40 p-4 md:p-6">
        <CardTitle className="text-lg flex flex-wrap items-center justify-between gap-3 font-black">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Desglose Operativo y Nómina Sugerida</span>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Badge className="text-[10px] font-black bg-emerald-600 text-white animate-pulse uppercase tracking-wider">
                ⚡ Modo Edición Directa
              </Badge>
            ) : (
              <>
                {isCustom && (
                  <Badge variant="outline" className="text-[10px] font-black border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
                    Montos Personalizados
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] font-black border-emerald-500/30 bg-emerald-500/10 text-emerald-600 uppercase">
                  {isBar ? "Tarifa Bar (Showcase)" : "Evento Privado (Audio y Staff Incluido)"}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="h-8 px-3 text-xs font-bold border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all shadow-sm cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Modificar Ganancias
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-4">
        {/* FILA DE 3 TARJETAS PRINCIPALES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* TARJETA 1: 4 MÚSICOS */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isEditing 
              ? "bg-emerald-500/5 border-emerald-500/40 ring-1 ring-emerald-500/30" 
              : "bg-muted/50 border-border/40 hover:border-emerald-500/30 cursor-pointer group"
          }`}
          onClick={() => { if (!isEditing) startEditing() }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <span>🎸</span> 4 Músicos ({hours}h)
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startEditing() }}
                  className="text-muted-foreground hover:text-emerald-600 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-0.5"
                  title="Clic para modificar sueldo de músicos"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2 mt-1">
                <div>
                  <Label htmlFor="inputEach" className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Pago por Músico (MXN)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                    <Input
                      id="inputEach"
                      type="number"
                      step="50"
                      min="0"
                      value={musicianEachInput}
                      disabled={isPending}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleMusicianEachChange(e.target.value)}
                      className="pl-6 h-9 text-sm font-black bg-background text-foreground border-emerald-500/40 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="inputTotal" className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Total 4 Músicos (MXN)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                    <Input
                      id="inputTotal"
                      type="number"
                      step="100"
                      min="0"
                      value={musiciansTotalInput}
                      disabled={isPending}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleMusiciansTotalChange(e.target.value)}
                      className="pl-6 h-9 text-sm font-black bg-background text-foreground border-emerald-500/40 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground pt-0.5">
                  Sugerido: {MXN(breakdown.defaultMusicianPayEach || 1675)} c/u
                </div>
              </div>
            ) : (
              <>
                <div className="text-base sm:text-lg font-black text-foreground">
                  {MXN(breakdown.musiciansTotal)}
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center justify-between">
                  <span>{MXN(breakdown.musicianPayEach)} por músico</span>
                  {breakdown.isCustomMusicianPay && (
                    <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      Manual
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* TARJETA 2: STAFF TÉCNICO */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isEditing 
              ? "bg-emerald-500/5 border-emerald-500/40 ring-1 ring-emerald-500/30" 
              : "bg-muted/50 border-border/40 hover:border-emerald-500/30 cursor-pointer group"
          }`}
          onClick={() => { if (!isEditing) startEditing() }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <span>🎧</span> Staff Técnico de Audio
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startEditing() }}
                  className="text-muted-foreground hover:text-emerald-600 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-0.5"
                  title="Clic para modificar sueldo de staff"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2 mt-1">
                <div>
                  <Label htmlFor="inputStaff" className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Pago a Staff Técnico (MXN)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                    <Input
                      id="inputStaff"
                      type="number"
                      step="50"
                      min="0"
                      value={staffPayInput}
                      disabled={isPending}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setStaffPayInput(e.target.value)}
                      className="pl-6 h-9 text-sm font-black bg-background text-foreground border-emerald-500/40 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground pt-4">
                  Sugerido: {MXN(breakdown.defaultStaffPay || (isBar ? hours * 200 : hours * 300))} ({isBar ? "$200/hr" : "$300/hr"})
                </div>
              </div>
            ) : (
              <>
                <div className="text-base sm:text-lg font-black text-foreground">
                  {MXN(breakdown.staffPay)}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium mt-0.5 flex items-center justify-between">
                  <span>{isBar ? "$200/hr en bar" : "$300/hr en privado"}</span>
                  {breakdown.isCustomStaffPay && (
                    <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      Manual
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* TARJETA 3: AUDIO + OFICINA VENDETTA (CÁLCULO AUTOMÁTICO) */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                  <span>🏢</span> Audio + Oficina Vendetta
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-600/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Automático
                </span>
              </div>

              <div className={`text-base sm:text-lg font-black ${
                liveBreakdown.audioAndOfficeProfit < 0 ? "text-red-500" : "text-emerald-600"
              }`}>
                {MXN(liveBreakdown.audioAndOfficeProfit)}
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground font-medium mt-1">
              {isEditing ? (
                <span className="text-[10px] leading-tight block">
                  Show ({MXN(liveBreakdown.totalPrice)}) - Músicos ({MXN(liveBreakdown.musiciansTotal)}) - Staff ({MXN(liveBreakdown.staffPay)})
                </span>
              ) : (
                "Utilidad neta y renta de equipo"
              )}
            </div>
          </div>
        </div>

        {/* FILA INGRESO TOTAL DEL DUEÑO (CÁLCULO FINAL DE GANANCIA) */}
        <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
          isEditing 
            ? "bg-primary/15 border-primary/40 ring-1 ring-primary/30" 
            : "bg-primary/10 border-primary/20"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-xl">👑</span>
            <div>
              <div className="text-xs font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                <span>Ingreso Total del Dueño (Músico + Audio/Oficina)</span>
                {isEditing && (
                  <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                    Cálculo en vivo
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {MXN(liveBreakdown.musicianPayEach)} (como músico) + {MXN(liveBreakdown.audioAndOfficeProfit)} (oficina y renta de audio)
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-primary">
              {MXN(liveBreakdown.ownerTotalTakeHome)}
            </span>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Ganancia Final del Dueño
            </div>
          </div>
        </div>

        {/* BARRA DE ACCIONES CUANDO ESTÁ EN MODO EDICIÓN */}
        {isEditing && (
          <div className="p-3 rounded-xl bg-muted/40 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Los cambios modifican los costos de este evento y actualizan los márgenes automáticamente.</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {isCustom && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToDefaults}
                  disabled={isPending}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground border border-border/40"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Restablecer Sugeridos
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                disabled={isPending}
                className="h-8 text-xs border-border/40"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancelar
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isPending}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Guardar Ganancias
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* NOTA DESCRIPTIVA AL PIE */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
          <span className="text-emerald-500 font-bold shrink-0">ℹ️</span>
          <span>{liveBreakdown.notes}</span>
        </div>
      </CardContent>
    </Card>
  )
}
