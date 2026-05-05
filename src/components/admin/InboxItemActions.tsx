"use client"

import { useState } from "react"
import { CheckCircle, Clock, Trash2, UserPlus, AlertCircle, MoreVertical } from "lucide-react"
import { updateInboxItemStatus, updateInboxItemPriority, deleteInboxItem } from "@/actions/inbox"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface InboxItemActionsProps {
  itemId: string
  currentStatus: string
  currentPriority: string
}

export function InboxItemActions({ itemId, currentStatus, currentPriority }: InboxItemActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleStatus = async (status: string) => {
    setLoading(true)
    const res = await updateInboxItemStatus(itemId, status)
    if (res.success) {
      toast.success("Estado actualizado")
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  const handlePriority = async (priority: string) => {
    setLoading(true)
    const res = await updateInboxItemPriority(itemId, priority)
    if (res.success) {
      toast.success("Prioridad actualizada")
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este mensaje?")) return
    setLoading(true)
    const res = await deleteInboxItem(itemId)
    if (res.success) {
      toast.success("Mensaje eliminado")
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        
        {currentStatus !== "resolved" ? (
          <DropdownMenuItem onClick={() => handleStatus("resolved")}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Marcar como Resuelto
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleStatus("pending")}>
            <Clock className="mr-2 h-4 w-4 text-yellow-500" /> Reabrir Ticket
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Prioridad</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handlePriority("low")} className={currentPriority === "low" ? "bg-muted" : ""}>
          <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" /> Baja
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePriority("medium")} className={currentPriority === "medium" ? "bg-muted" : ""}>
          <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" /> Media
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePriority("high")} className={currentPriority === "high" ? "bg-muted" : ""}>
          <div className="h-2 w-2 rounded-full bg-red-500 mr-2" /> Alta
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
