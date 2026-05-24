"use client"

import { useEffect, useState } from "react"
import { checkEvolutionHealth } from "@/actions/health"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export function EvolutionHealthCheck() {
  const [health, setHealth] = useState<{status: string, state?: string, reason?: string} | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      setLoading(true)
      const res = await checkEvolutionHealth()
      setHealth(res)
      setLoading(false)
    }
    check()
    // Refresh every 30 seconds
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !health) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-bold uppercase">Verificando...</span>
      </div>
    )
  }

  if (health?.status === "online") {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-0.5">Evolution API</span>
          <span className="text-xs font-bold leading-none">Conectado</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-red-500">
      <AlertCircle className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-0.5">Evolution API</span>
        <span className="text-xs font-bold leading-none">{health?.state || "Desconectado"}</span>
      </div>
    </div>
  )
}
