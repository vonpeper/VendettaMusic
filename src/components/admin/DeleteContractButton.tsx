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
import { FileX2, Loader2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { deleteContractAction } from "@/actions/ventas"

interface DeleteContractButtonProps {
  bookingId: string
  shortId: string
}

export function DeleteContractButton({ bookingId, shortId }: DeleteContractButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await deleteContractAction(bookingId)
      if (res.success) {
        toast.success("Contrato eliminado correctamente")
        setOpen(false)
        router.refresh()
      } else {
        toast.error("Error: " + (res.error || "Desconocido"))
      }
    } catch {
      toast.error("Error de conexión al servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-white transition-all rounded-xl h-11 px-2 gap-1.5 font-black text-xs uppercase tracking-widest"
        >
          <FileX2 className="w-4 h-4 shrink-0" /> Eliminar Contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/40 backdrop-blur-xl admin-theme text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-500">
            <AlertTriangle className="w-5 h-5" /> ¿Eliminar contrato?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 space-y-2">
            <span className="block">
              Se borrarán las <strong>firmas digitales</strong> y el registro de contrato del folio{" "}
              <strong>{shortId}</strong>.
            </span>
            <span className="block text-orange-400 font-semibold text-xs">
              El evento y los pagos no se verán afectados. Podrás generar un nuevo contrato en cualquier momento.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl border border-border/40">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleDelete}
            className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Sí, eliminar contrato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
