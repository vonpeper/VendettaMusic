"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Edit2, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu"
import { updateVenueTypeAction } from "@/actions/ventas"

const VENUE_TYPES = [
  { value: "salon", label: "Salón" },
  { value: "terraza", label: "Terraza" },
  { value: "jardin", label: "Jardín" },
  { value: "residencia", label: "Residencia" },
  { value: "bar", label: "Restaurant / Bar" },
  { value: "festival", label: "Festival / Público" },
  { value: "happening", label: "Happening" },
]

export function VenueTypeSwitcher({ 
  bookingId, 
  currentType 
}: { 
  bookingId: string, 
  currentType: string 
}) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleUpdate = async (newType: string) => {
    setLoading(true)
    try {
      const res = await updateVenueTypeAction(bookingId, newType)
      if (res.success) {
        toast.success("Tipo de evento actualizado. El sistema ahora usará las reglas para este tipo.")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || "Error al actualizar tipo de evento")
      }
    } catch (error) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const currentLabel = VENUE_TYPES.find(t => t.value === currentType)?.label || currentType || "Salón"

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className="inline-flex items-center rounded-full border px-2.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-blue-600/20 border-blue-600/40 text-blue-600 bg-blue-600/10 uppercase text-[9px] font-black tracking-tighter shadow-sm gap-1 transition-colors"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : currentLabel}
          <Edit2 className="w-2.5 h-2.5 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Cambiar Tipo
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {VENUE_TYPES.map((type) => (
            <DropdownMenuItem
              key={type.value}
              onClick={() => handleUpdate(type.value)}
              className="text-xs cursor-pointer flex items-center"
            >
              {type.value === currentType ? <Check className="w-3 h-3 mr-2 text-blue-600" /> : <div className="w-5" />}
              <span>{type.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
