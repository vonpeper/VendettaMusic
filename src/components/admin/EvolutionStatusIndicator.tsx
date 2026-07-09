"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { testEvolutionConnectionAction } from "@/actions/config"

export function EvolutionStatusIndicator() {
  const [status, setStatus] = useState<"loading" | "connected" | "disconnected" | "error">("loading")
  const [message, setMessage] = useState("Verificando conectividad...")

  useEffect(() => {
    async function checkConnection() {
      try {
        const res = await testEvolutionConnectionAction()
        if (res.success && res.state === "open") {
          setStatus("connected")
          setMessage("Conectado")
        } else if (res.state === "connecting") {
          setStatus("loading")
          setMessage("Conectando a WhatsApp...")
        } else {
          setStatus("disconnected")
          setMessage(res.message || "Sesión desvinculada (requiere reconectar)")
        }
      } catch (e) {
        setStatus("error")
        setMessage("Error de red al conectar con Evolution API")
      }
    }
    checkConnection()
  }, [])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {status === "loading" && (
          <>
            <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              {message}
            </span>
          </>
        )}
        {status === "connected" && (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-400 uppercase tracking-widest font-bold">
              Conectado
            </span>
          </>
        )}
        {status === "disconnected" && (
          <>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">
              Desconectado (Dispositivo removido)
            </span>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-red-500 uppercase tracking-widest font-bold">
              Error de Conexión
            </span>
          </>
        )}
      </div>
      {status === "disconnected" && (
        <p className="text-[9px] text-red-400 font-bold max-w-xs mt-1 leading-normal">
          ⚠️ {message}
        </p>
      )}
      {status === "error" && (
        <p className="text-[9px] text-red-400/80 font-bold max-w-xs mt-1 leading-normal">
          ❌ {message}
        </p>
      )}
    </div>
  )
}
