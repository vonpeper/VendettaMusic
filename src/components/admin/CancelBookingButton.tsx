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
  className?: string;
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost";
  label?: string;
  redirectOnSuccess?: boolean;
}

export function CancelBookingButton({ 
  bookingId, 
  shortId, 
  hasEvent = false,
  className,
  variant = "outline",
  label = "Eliminar",
  redirectOnSuccess = false
}: CancelBookingButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    console.log(`[DELETE BOOKING] ${bookingId}`);
  setLoading(true);
  try {
    const res = await fetch(`/api/booking?id=${bookingId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    console.log(`[DELETE BOOKING RESULT]`, json);
    if (json.success) {
      toast.success("Solicitud/Evento cancelado con éxito");
      if (redirectOnSuccess || hasEvent) {
        router.push("/admin/ventas");
      } else {
        // En caso de borrar desde modal, refresh
        router.refresh()
      }
    } else {
      toast.error("Error al cancelar: " + (json.error || "Desconocido"));
    }
  } catch (err) {
    toast.error("Error de conexión al servidor");
  } finally {
    setLoading(false);
  }
  }

  return (
    <Dialog>
      <DialogTrigger 
        render={(triggerProps) => (
          <Button 
            {...triggerProps}
            variant={variant} 
            className={className || "w-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-foreground transition-all rounded-xl h-11 px-2 gap-1.5 font-black text-xs uppercase tracking-widest overflow-hidden"}
          >
            <Trash2 className="w-4 h-4 shrink-0" /> {label}
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
