"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { confirmAttendanceAction, rejectAttendanceAction } from "@/actions/confirmations"
import { toast } from "sonner"

interface AttendanceConfirmButtonsProps {
  musicianId: string
  eventId: string
  token?: string
}

export function AttendanceConfirmButtons({ musicianId, eventId, token }: AttendanceConfirmButtonsProps) {
  const router = useRouter()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const handleConfirm = async () => {
    if (isConfirming || isRejecting) return
    setIsConfirming(true)
    try {
      const res = await confirmAttendanceAction(musicianId, eventId, token)
      if (res.success) {
        toast.success("¡Asistencia confirmada exitosamente!")
        router.push(`/confirmar/${musicianId}/${eventId}?success=true`)
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo confirmar la asistencia")
        setIsConfirming(false)
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al conectar con el servidor")
      setIsConfirming(false)
    }
  }

  const handleReject = async () => {
    if (isConfirming || isRejecting) return
    if (!confirm("¿Seguro que no estás disponible para esta fecha? Se notificará al administrador.")) {
      return
    }
    setIsRejecting(true)
    try {
      const res = await rejectAttendanceAction(musicianId, eventId, token)
      if (res.success) {
        toast.info("Fecha rechazada correctamente.")
        router.push(`/confirmar/${musicianId}/${eventId}?rejected=true`)
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo registrar la respuesta")
        setIsRejecting(false)
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al conectar con el servidor")
      setIsRejecting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <Button
        type="button"
        disabled={isConfirming || isRejecting}
        onClick={handleConfirm}
        className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isConfirming ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Confirmando...
          </>
        ) : (
          "✅ SÍ, CONFIRMO"
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={isConfirming || isRejecting}
        onClick={handleReject}
        className="w-full h-12 text-sm font-bold rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
      >
        {isRejecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Rechazando...
          </>
        ) : (
          "❌ NO PUEDO IR"
        )}
      </Button>
    </div>
  )
}
