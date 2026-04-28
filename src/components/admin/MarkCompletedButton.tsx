"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { markBookingAsCompleted } from "@/actions/ventas"
import { useState } from "react"

export function MarkCompletedButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    if (!confirm("¿Estás seguro de marcar este contrato como completado?")) return
    setLoading(true)
    await markBookingAsCompleted(bookingId)
    setLoading(false)
  }

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="h-8 gap-2 border-primary/30 text-primary hover:bg-primary hover:text-foreground" 
      onClick={handleComplete}
      disabled={loading}
    >
      <CheckCircle className="w-3 h-3" />
      {loading ? "Actualizando..." : "Completar"}
    </Button>
  )
}
