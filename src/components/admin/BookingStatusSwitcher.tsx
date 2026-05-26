"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateBookingStatusAction } from "@/actions/ventas"

export function BookingStatusSwitcher({ 
  bookingId, 
  currentStatus,
  missingFields = []
}: { 
  bookingId: string, 
  currentStatus: string,
  missingFields?: string[]
}) {
  const [loading, setLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const router = useRouter()

  const configs: any = {
    pendiente:  { color: "text-yellow-600 border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20", label: "Pendiente" },
    agendado:   { color: "text-green-600 border-green-500/40 bg-green-500/10 hover:bg-green-500/20", label: "Confirmado" },
    completado: { color: "text-blue-600 border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20", label: "Completado" },
    cancelado:  { color: "text-red-600 border-red-500/40 bg-red-500/10 hover:bg-red-500/20", label: "Cancelado" },
    EXPIRED:    { color: "text-muted-foreground border-gray-700 bg-gray-800/50 hover:bg-gray-800/70", label: "Expirado" },
  }

  // Si el status es "pending" (por un bug antiguo) lo mapeamos a pendiente
  const normalizedStatus = currentStatus === "pending" ? "pendiente" : currentStatus
  const cfg = configs[normalizedStatus] || configs.pendiente

  const attemptStatusChange = (newStatus: string) => {
    if (newStatus === normalizedStatus) return
    
    if (newStatus === "agendado" && missingFields.length > 0) {
      setPendingStatus(newStatus)
      setShowWarning(true)
    } else {
      executeStatusChange(newStatus)
    }
  }

  const executeStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const res = await updateBookingStatusAction(bookingId, newStatus)
      if (res?.success) {
        toast.success(`Estatus actualizado a ${configs[newStatus]?.label}`)
        router.refresh()
      } else {
        toast.error(res?.error || "Error al actualizar estatus")
      }
    } catch (error) {
      toast.error("Error de red al actualizar estatus")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="bg-card border-border/40 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-black uppercase tracking-tight flex items-center gap-2">
              Datos Críticos Faltantes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground mt-2">
              <p className="mb-2 text-sm">Estás a punto de confirmar este evento, pero faltan los siguientes datos importantes:</p>
              <ul className="list-disc pl-5 mb-4 space-y-1 text-sm text-muted-foreground font-medium">
                {missingFields.map((field, i) => <li key={i}>{field}</li>)}
              </ul>
              <p className="text-xs font-bold text-muted-foreground italic">¿Deseas confirmar el evento de todas formas y completar los datos después?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold border-border/40">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => pendingStatus && executeStatusChange(pendingStatus)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase tracking-widest"
            >
              Forzar Confirmación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={loading}
          className={`h-8 gap-2 px-3 rounded-lg border transition-all ${cfg.color}`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {cfg.label}
          </span>
          <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40 border-border/40 shadow-xl bg-background/95 backdrop-blur-xl">
        <DropdownMenuItem onClick={() => attemptStatusChange("pendiente")} className="text-xs font-bold cursor-pointer hover:bg-yellow-500/10 hover:text-yellow-500">
          Marcar Pendiente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => attemptStatusChange("agendado")} className="text-xs font-bold cursor-pointer hover:bg-green-500/10 hover:text-green-500">
          Marcar Confirmado
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => attemptStatusChange("completado")} className="text-xs font-bold cursor-pointer hover:bg-blue-500/10 hover:text-blue-500">
          Marcar Completado
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => attemptStatusChange("cancelado")} className="text-xs font-bold cursor-pointer hover:bg-red-500/10 hover:text-red-500">
          Marcar Cancelado
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
