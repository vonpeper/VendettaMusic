"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CancelBookingButtonProps {
  bookingId: string;
  shortId: string;
  hasEvent?: boolean;
}

export function CancelBookingButton({ bookingId, shortId, hasEvent = false }: CancelBookingButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    setLoading(true)
    try {
      const res = await fetch(`/api/booking?id=${bookingId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Solicitud/Evento cancelado con éxito")
        router.push("/admin/ventas")
        router.refresh()
      } else {
        toast.error("Error al cancelar: " + (json.error || "Desconocido"))
      }
    } catch (err) {
      toast.error("Error de conexión al servidor")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog>
      <DialogTrigger 
        render={(triggerProps) => (
          <Button 
            {...triggerProps}
            variant="outline" 
            className="w-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-foreground transition-all rounded-xl h-11 gap-2 font-bold"
          >
            <Trash2 className="w-4 h-4" /> 
            {hasEvent ? "Cancelar Evento y Borrar" : "Eliminar Cotización"}
          </Button>
        )}
      />
      <DialogContent showCloseButton={false} className="bg-card border-border/40 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" /> ¿Estás completamente seguro?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Esta acción es irreversible. Se eliminará el registro <strong>{shortId}</strong> permanentemente. 
            {hasEvent && (
              <span className="block mt-2 font-bold text-red-700">
                ADVERTENCIA: Esto también eliminará el evento de la agenda vinculada, pagos registrados y la sincronización con Google Calendar.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <DialogClose render={<Button variant="ghost" className="rounded-xl border-border/40" />}>
            No, conservar
          </DialogClose>
          <Button 
            onClick={e => {
              e.preventDefault()
              handleCancel()
            }}
            className="bg-red-600 hover:bg-red-500 text-foreground rounded-xl font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sí, cancelar y borrar todo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
