"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Trash2, 
  Loader2, 
  CheckSquare, 
  Square,
  AlertTriangle,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDateMX, formatCurrency } from "@/lib/utils"
import { FollowUpButton } from "@/components/admin/FollowUpButton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

interface Booking {
  id: string
  shortId: string | null
  clientName: string
  requestedDate: Date | string
  packageName: string
  baseAmount: number
  viaticosAmount: number
  depositAmount: number
  status: string
  clientPhone: string
  followUpCount: number
}

export function VentasTableClient({ items, followUpTemplate }: { items: Booking[], followUpTemplate?: string }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (items.length === 0) return (
    <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl">
      <p className="text-muted-foreground">No hay solicitudes en esta categoría.</p>
    </div>
  )

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(i => i.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkDelete = async () => {
    setLoading(true)
    const ids = Array.from(selectedIds).join(",")
    try {
      const res = await fetch(`/api/booking?id=${ids}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        toast.success(`${json.count} registros eliminados correctamente`)
        setSelectedIds(new Set())
        router.refresh()
      } else {
        toast.error("Error al eliminar: " + (json.error || "Desconocido"))
      }
    } catch (err) {
      toast.error("Error de conexión al servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Acciones Masivas */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {selectedIds.size}
            </div>
            <p className="text-sm font-medium text-primary">Elementos seleccionados</p>
          </div>
          
          <Dialog>
            <DialogTrigger render={
              <Button variant="destructive" size="sm" className="gap-2 font-bold h-9 px-4 rounded-lg shadow-lg shadow-red-500/10 text-white">
                <Trash2 className="w-4 h-4" /> Eliminar Selección
              </Button>
            } />
            <DialogContent showCloseButton={false} className="bg-card border-border/40 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" /> ¿Confirmar eliminación masiva?
                </DialogTitle>
                <DialogDescription className="text-muted-foreground pt-2">
                  Estás por eliminar <strong>{selectedIds.size}</strong> registros permanentemente. 
                  Esto incluye eventos vinculados, pagos y sincronización con Google Calendar para cada uno de ellos.
                  <span className="block mt-2 font-bold text-red-700">Esta acción no se puede deshacer.</span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <DialogClose render={<Button variant="ghost" className="rounded-xl border-border/40" />}>
                  Cancelar
                </DialogClose>
                <Button 
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sí, eliminar todo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border/40">
              <th className="px-6 py-4 w-12 text-center">
                <button 
                  onClick={toggleSelectAll}
                  className="w-5 h-5 mx-auto rounded border border-border/40 flex items-center justify-center hover:border-primary/50 transition-colors"
                >
                  {selectedIds.size === items.length ? (
                    <CheckSquare className="w-4 h-4 text-primary fill-primary/10" />
                  ) : selectedIds.size > 0 ? (
                    <div className="w-2.5 h-0.5 bg-primary" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase">Cliente / ID</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase">Evento / Paquete</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase">Monto Total</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase text-center">Estado</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map(reserva => (
              <tr 
                key={reserva.id} 
                className={`hover:bg-primary/10 transition-colors group ${selectedIds.has(reserva.id) ? 'bg-primary/5' : ''}`}
              >
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleSelect(reserva.id)}
                    className="w-5 h-5 rounded border border-border/40 flex items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    {selectedIds.has(reserva.id) ? (
                      <CheckSquare className="w-4 h-4 text-primary fill-primary/10" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4" onClick={() => toggleSelect(reserva.id)}>
                  <div className="font-bold text-foreground flex items-center gap-2">
                    {reserva.clientName}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{reserva.shortId || "S/F"}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-foreground flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-primary" />
                    {formatDateMX(reserva.requestedDate, "dd/MM/yyyy")}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{reserva.packageName}</div>
                </td>
                <td className="px-6 py-4 font-mono">
                  <div className="text-sm font-black text-foreground">{formatCurrency(Number(reserva.baseAmount) + Number(reserva.viaticosAmount || 0))}</div>
                  <div className="text-[9px] text-muted-foreground">Anticipo: {formatCurrency(Number(reserva.depositAmount))}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={reserva.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {(reserva.status === "pendiente" || reserva.status === "pending") && (
                      <FollowUpButton 
                        id={reserva.id}
                        type="booking"
                        phone={reserva.clientPhone}
                        clientName={reserva.clientName}
                        currentCount={reserva.followUpCount}
                        template={followUpTemplate}
                      />
                    )}
                    <Link href={`/admin/ventas/${reserva.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-[10px] uppercase font-bold gap-1 rounded-lg hover:bg-primary hover:text-black border-primary/20 transition-all">
                        Ver <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    pendiente: { color: "text-yellow-700 border-yellow-700/40 bg-yellow-900/20", label: "Pendiente" },
    agendado:  { color: "text-green-700 border-green-700/40 bg-green-900/20", label: "Agendado" },
    cancelado: { color: "text-red-700 border-red-700/40 bg-red-900/20", label: "Cancelado" },
    EXPIRED:   { color: "text-muted-foreground border-gray-700 bg-gray-800/50", label: "Expirado" },
  }
  const cfg = configs[status] || configs.pendiente
  return (
    <Badge className={`${cfg.color} border px-2 py-0.5 text-[10px]`}>
      {cfg.label}
    </Badge>
  )
}
