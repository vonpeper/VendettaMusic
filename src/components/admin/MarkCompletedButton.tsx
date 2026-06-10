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
      variant="default" 
      className="h-9 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md transition-all rounded-lg font-bold border-none cursor-pointer" 
      onClick={handleComplete}
      disabled={loading}
    >
      <CheckCircle className="w-3 h-3" />
      {loading ? "..." : "Completar"}
    </Button>
  )
}
