"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { 
  Loader2, 
  Trash2, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Calendar, 
  ChevronRight 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateMX, formatCurrency } from "@/lib/utils"
import { updateBookingStatusAction } from "@/actions/ventas"
import { FollowUpButton } from "./FollowUpButton"

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
  paymentStatus?: string
  clientPhone: string
  followUpCount: number
  clientEmail?: string | null
}

export function VentasTableClient({ items, followUpTemplate }: { items: Booking[], followUpTemplate?: string | null }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const result = await updateBookingStatusAction(id, newStatus)
      if (result.success) {
        toast.success("Estado actualizado")
        router.refresh()
      } else {
        toast.error("Error: " + result.error)
      }
    } catch (error) {
      toast.error("Error de red")
    } finally {
      setUpdatingId(null)
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

      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
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
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cliente / ID</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Evento / Paquete</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Monto Total</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Estado</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map(reserva => (
              <tr 
                key={reserva.id} 
                className={`hover:bg-primary/5 transition-colors group ${selectedIds.has(reserva.id) ? 'bg-primary/5' : ''}`}
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
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-black text-foreground">{formatCurrency(Number(reserva.baseAmount) + Number(reserva.viaticosAmount || 0))}</div>
                    {reserva.paymentStatus === "paid" ? (
                      <span className="text-[8px] font-black bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded border border-green-500/20 uppercase tracking-tighter">PAGADO</span>
                    ) : (
                      <span className="text-[8px] font-black bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded border border-yellow-500/20 uppercase tracking-tighter">PENDIENTE</span>
                    )}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Anticipo: {formatCurrency(Number(reserva.depositAmount))}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <StatusSwitcher 
                    status={reserva.status} 
                    id={reserva.id} 
                    onStatusChange={handleStatusChange}
                    isUpdating={updatingId === reserva.id}
                  />
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
                        template={followUpTemplate ?? undefined}
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

function StatusSwitcher({ status, id, onStatusChange, isUpdating }: { 
  status: string, 
  id: string, 
  onStatusChange: (id: string, s: string) => void,
  isUpdating: boolean
}) {
  const configs: any = {
    pendiente:  { color: "text-yellow-600 border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20", label: "Pendiente" },
    agendado:   { color: "text-green-600 border-green-500/40 bg-green-500/10 hover:bg-green-500/20", label: "Confirmado" },
    completado: { color: "text-blue-600 border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20", label: "Completado" },
    cancelado:  { color: "text-red-600 border-red-500/40 bg-red-500/10 hover:bg-red-500/20", label: "Cancelado" },
    EXPIRED:    { color: "text-muted-foreground border-gray-700 bg-gray-800/50 hover:bg-gray-800/70", label: "Expirado" },
  }
  
  const cfg = configs[status] || configs.pendiente

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          disabled={isUpdating}
          className={`${cfg.color} border px-2 py-1 text-[10px] rounded-md font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 mx-auto disabled:opacity-50`}
        >
          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {cfg.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="bg-card border-border/40 backdrop-blur-xl min-w-[140px]">
        {Object.entries(configs).map(([key, value]: [string, any]) => (
          <DropdownMenuItem 
            key={key}
            onClick={() => onStatusChange(id, key)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-primary/10"
          >
            <div className={`w-2 h-2 rounded-full ${value.color.split(' ')[0].replace('text-', 'bg-')}`} />
            {value.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
