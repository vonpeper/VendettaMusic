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
  Sparkles,
  Info,
  ShieldCheck,
  Layers,
  Users,
  Mic2,
  Speaker,
  Briefcase
} from "lucide-react"
import { calculateEventCostBreakdown } from "@/lib/pricing"
import { updateEventOperationalCostsAction } from "@/actions/ventas"
import { toast } from "sonner"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { 
  style: "currency", 
  currency: "MXN", 
  maximumFractionDigits: 0 
}).format(v)

export interface ProductionAddonItem {
  id: string
  name: string
  providerCost: number
  officeMargin: number
  clientPrice: number
  description?: string
}

interface EventCostBreakdownCardProps {
  bookingId: string
  hours: number
  isBar: boolean
  baseShowPrice: number
  initialMusicianPay?: number | null
  initialStaffPay?: number | null
  listPrice?: number
  discountAmount?: number
  musiciansCount?: number
  productionAddons?: ProductionAddonItem[]
  productionOfficeMargin?: number
  isForaneo?: boolean
}

export function EventCostBreakdownCard({
  bookingId,
  hours,
  isBar,
  baseShowPrice,
  initialMusicianPay = null,
  initialStaffPay = null,
  listPrice,
  discountAmount = 0,
  musiciansCount = 4,
  productionAddons = [],
  productionOfficeMargin,
  isForaneo = false,
}: EventCostBreakdownCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const activeMusiciansCount = Math.max(1, musiciansCount || 4)

  // Extra office margin from active production add-ons
  const computedProductionMargin = useMemo(() => {
    if (productionOfficeMargin !== undefined && productionOfficeMargin !== null) {
      return Math.max(0, Number(productionOfficeMargin) || 0)
    }
    if (productionAddons && productionAddons.length > 0) {
      return productionAddons.reduce((sum, p) => sum + (Number(p.officeMargin) || 0), 0)
    }
    return 0
  }, [productionOfficeMargin, productionAddons])

  // Desglose persistido actual
  const breakdown = useMemo(() => {
    return calculateEventCostBreakdown(
      hours, 
      isBar ? "bar" : "privado", 
      baseShowPrice > 0 ? baseShowPrice : undefined,
      initialMusicianPay,
      initialStaffPay,
      computedProductionMargin,
      activeMusiciansCount
    )
  }, [hours, isBar, baseShowPrice, initialMusicianPay, initialStaffPay, computedProductionMargin, activeMusiciansCount])

  // Valores de los inputs durante la edición en vivo
  const [musicianEachInput, setMusicianEachInput] = useState<string>(
    initialMusicianPay !== null && initialMusicianPay !== undefined
      ? initialMusicianPay.toString()
      : breakdown.musicianPayEach.toString()
  )
  const [musiciansTotalInput, setMusiciansTotalInput] = useState<string>(
    ((initialMusicianPay !== null && initialMusicianPay !== undefined
      ? initialMusicianPay
      : breakdown.musicianPayEach) * activeMusiciansCount).toString()
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
    setMusiciansTotalInput((curEach * activeMusiciansCount).toString())
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
    setMusiciansTotalInput((curEach * activeMusiciansCount).toString())
    setStaffPayInput(curStaff.toString())
    setIsEditing(false)
  }

  // Manejar cambio en sueldo por músico (actualiza el total)
  function handleMusicianEachChange(val: string) {
    setMusicianEachInput(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0) {
      setMusiciansTotalInput(Math.round(num * activeMusiciansCount).toString())
    } else {
      setMusiciansTotalInput("")
    }
  }

  // Manejar cambio en total de músicos (actualiza el pago individual)
  function handleMusiciansTotalChange(val: string) {
    setMusiciansTotalInput(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0) {
      setMusicianEachInput(Math.round(num / activeMusiciansCount).toString())
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
      cleanStaff,
      computedProductionMargin,
      activeMusiciansCount
    )
  }, [isEditing, hours, isBar, baseShowPrice, musicianEachInput, staffPayInput, computedProductionMargin, activeMusiciansCount, breakdown])

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
            <span>Calculadora de Nómina y Margen de Oficina</span>
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

      <CardContent className="p-4 md:p-6 space-y-5">

        {/* ═══════════════════════════════════════════════════════════════
            NIVEL 1: BASE DISPONIBLE PARA BANDA (TARIFA LIMPIA SHOW)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40 border border-border/60 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5 text-primary" /> Nivel 1 • Base Disponible para Banda
              </span>
              <Badge variant="outline" className="text-[9px] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                100% Libre de Passthroughs
              </Badge>
              {isForaneo && (
                <Badge variant="outline" className="text-[9px] font-mono border-amber-500/30 bg-amber-500/10 text-amber-600">
                  Show Foráneo
                </Badge>
              )}
            </div>
            <div className="text-right">
              <span className="text-lg sm:text-xl font-mono font-black text-foreground">
                {MXN(liveBreakdown.totalPrice)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Tarifa pura del espectáculo musical pactada para la banda. Excluye en su totalidad viáticos (gasolina y casetas), IVA fiscal y costos de proveedores externos directos de producción.
            {discountAmount > 0 && listPrice && (
              <span className="font-semibold text-foreground ml-1">
                [Precio Lista: {MXN(listPrice)} - Descuento: {MXN(discountAmount)}]
              </span>
            )}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            NIVELES 2 Y 3: NÓMINA MÚSICOS & STAFF TÉCNICO DE AUDIO
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* NIVEL 2: NÓMINA MÚSICOS */}
          <div className={`p-4 rounded-xl border transition-all ${
            isEditing 
              ? "bg-emerald-500/5 border-emerald-500/40 ring-1 ring-emerald-500/30" 
              : "bg-muted/40 border-border/40 hover:border-emerald-500/30 cursor-pointer group"
          }`}
          onClick={() => { if (!isEditing) startEditing() }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" /> Nivel 2 • Nómina Músicos ({activeMusiciansCount} activos)
              </span>
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startEditing() }}
                  className="text-muted-foreground hover:text-emerald-600 p-0.5"
                  title="Clic para modificar sueldo de músicos"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3 mt-1">
                <div>
                  <Label htmlFor="inputEach" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
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
                  <Label htmlFor="inputTotal" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                    Total Nómina ({activeMusiciansCount} Músicos)
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

                <div className="text-[10px] text-muted-foreground">
                  Sugerido estándar: {MXN(breakdown.defaultMusicianPayEach || 1500)} c/u ({hours} hrs @ {isBar ? "proporcional bar" : "$750/hr"})
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-mono font-black text-foreground">
                    {MXN(liveBreakdown.musiciansTotal)}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 font-mono">
                    {MXN(liveBreakdown.musicianPayEach)} c/u
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>
                    ({MXN(liveBreakdown.musicianPayEach)} × {activeMusiciansCount} músicos • {hours} {hours === 1 ? "hora" : "horas"} de show)
                  </span>
                  {liveBreakdown.isCustomMusicianPay && (
                    <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      Manual
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* NIVEL 3: STAFF TÉCNICO DE AUDIO */}
          <div className={`p-4 rounded-xl border transition-all ${
            isEditing 
              ? "bg-emerald-500/5 border-emerald-500/40 ring-1 ring-emerald-500/30" 
              : "bg-muted/40 border-border/40 hover:border-emerald-500/30 cursor-pointer group"
          }`}
          onClick={() => { if (!isEditing) startEditing() }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Speaker className="w-3.5 h-3.5 text-emerald-600" /> Nivel 3 • Staff Técnico de Audio
              </span>
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startEditing() }}
                  className="text-muted-foreground hover:text-emerald-600 p-0.5"
                  title="Clic para modificar sueldo de staff"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3 mt-1">
                <div>
                  <Label htmlFor="inputStaff" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
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
                  Sugerido: {MXN(breakdown.defaultStaffPay || (isBar ? hours * 200 : hours * 300))} ({hours} hrs @ {isBar ? "$200/hr" : "$300/hr"})
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-mono font-black text-foreground">
                    {MXN(liveBreakdown.staffPay)}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {isBar ? "$200/hr en bar" : "$300/hr en privado"}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>Operación y monitoreo de audio en vivo ({hours}h)</span>
                  {liveBreakdown.isCustomStaffPay && (
                    <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      Manual
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════════
            NIVEL 4: REMANENTE SHOW + EXTRA OFICINA POR ADICIONALES
        ═══════════════════════════════════════════════════════════════ */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-border/70 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Nivel 4 • Remanente Show + Margen Oficina por Adicionales
            </span>
            <div className="text-right">
              <span className={`text-base sm:text-lg font-mono font-black ${
                liveBreakdown.audioAndOfficeProfit < 0 ? "text-red-500" : "text-emerald-600"
              }`}>
                {MXN(liveBreakdown.audioAndOfficeProfit)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-border/50">
            {/* Fórmula de Remanente Show */}
            <div className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">
                Remanente Show Base (Audio & Operación)
              </div>
              <div className="font-mono font-black text-sm text-foreground">
                {MXN(liveBreakdown.showRemainder)}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Base ({MXN(liveBreakdown.totalPrice)}) - Músicos ({MXN(liveBreakdown.musiciansTotal)}) - Staff ({MXN(liveBreakdown.staffPay)})
              </p>
            </div>

            {/* Margen Extra por Producción */}
            <div className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Margen Extra Oficina por Adicionales
                </span>
                <span className="font-mono font-black text-sm text-emerald-600">
                  +{MXN(computedProductionMargin)}
                </span>
              </div>
              
              {productionAddons && productionAddons.length > 0 ? (
                <div className="space-y-1 pt-1 border-t border-border/40">
                  {productionAddons.map((addon) => (
                    <div key={addon.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground font-medium truncate">
                        • {addon.name}
                      </span>
                      <span className="font-mono font-bold text-emerald-600 shrink-0 ml-2">
                        +{MXN(addon.officeMargin)}{" "}
                        <span className="text-[9px] text-muted-foreground font-normal">
                          (Prov. {MXN(addon.providerCost)})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Sin adicionales de producción seleccionados ($0 margen extra).
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            NIVEL 5: RESUMEN FINANCIERO CONSOLIDADO (DUEÑO & OFICINA)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-primary/10 border-2 border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
                  Nivel 5 • Resumen Neto Consolidado (Oficina & Dueño)
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Separación transparente entre nómina de talentos, honorarios técnicos y ganancia total del dueño.
                </p>
              </div>
            </div>
            {isEditing && (
              <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 uppercase font-bold">
                Cálculo en vivo
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* 1. Nómina Músicos */}
            <div className="p-3 rounded-xl bg-background/80 border border-border/50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                1. Nómina Músicos
              </span>
              <span className="font-mono text-base font-black text-foreground block mt-0.5">
                {MXN(liveBreakdown.musiciansTotal)}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {activeMusiciansCount} músicos activos
              </span>
            </div>

            {/* 2. Staff Técnico */}
            <div className="p-3 rounded-xl bg-background/80 border border-border/50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                2. Staff de Audio
              </span>
              <span className="font-mono text-base font-black text-foreground block mt-0.5">
                {MXN(liveBreakdown.staffPay)}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                Ingeniero / Montaje
              </span>
            </div>

            {/* 3. Utilidad Oficina */}
            <div className="p-3 rounded-xl bg-background/80 border border-border/50">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                3. Utilidad Neta Oficina
              </span>
              <span className={`font-mono text-base font-black block mt-0.5 ${
                liveBreakdown.audioAndOfficeProfit < 0 ? "text-red-500" : "text-emerald-600"
              }`}>
                {MXN(liveBreakdown.audioAndOfficeProfit)}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                Audio propio + margen prod.
              </span>
            </div>

            {/* 4. Ganancia Total Dueño */}
            <div className="p-3 rounded-xl bg-primary/15 border border-primary/40 text-right">
              <span className="text-[10px] uppercase font-black text-primary block">
                👑 Ganancia Dueño
              </span>
              <span className="font-mono text-lg font-black text-primary block mt-0.5">
                {MXN(liveBreakdown.ownerTotalTakeHome)}
              </span>
              <span className="text-[10px] font-bold text-foreground block truncate">
                Músico + Oficina
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-background/60 border border-border/40 text-[11px] text-muted-foreground leading-relaxed flex items-center justify-between gap-2">
            <div>
              <span className="font-bold text-foreground">Desglose de Ganancia del Dueño: </span>
              <span>
                {MXN(liveBreakdown.musicianPayEach)} (como Músico Titular en tarima) + {MXN(liveBreakdown.audioAndOfficeProfit)} (utilidad de oficina y equipo de audio) = <strong className="text-primary font-mono">{MXN(liveBreakdown.ownerTotalTakeHome)}</strong>
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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
          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{liveBreakdown.notes}</span>
        </div>
      </CardContent>
    </Card>
  )
}

