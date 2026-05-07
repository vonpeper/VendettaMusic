"use client"

import { useState, useTransition } from "react"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ShieldCheck, Loader2 } from "lucide-react"
import { updateSandboxModeAction } from "@/actions/config"

interface SandboxToggleProps {
  initialValue: boolean
}

export function SandboxToggle({ initialValue }: SandboxToggleProps) {
  const [isActive, setIsActive] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  const handleToggle = async () => {
    const newValue = !isActive
    setIsActive(newValue)

    startTransition(async () => {
      try {
        const result = await updateSandboxModeAction(newValue)
        if (result.success) {
          toast.success(result.message)
        } else {
          setIsActive(!newValue) // Rollback
          toast.error(result.message)
        }
      } catch (error: any) {
        setIsActive(!newValue) // Rollback
        console.error("Sandbox toggle failed:", error)
        toast.error(`Error técnico: ${error.message || "No se pudo conectar con el servidor"}`)
      }
    })
  }

  return (
    <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-md relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl transition-opacity duration-500 ${isActive ? 'bg-indigo-500/20 opacity-100' : 'bg-indigo-500/5 opacity-0'}`} />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
            <Label htmlFor="isSandbox" className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em]">
              Entorno de Pruebas (Sandbox)
            </Label>
            {isPending && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight max-w-[280px] font-medium">
            Redirige todas las notificaciones al administrador para validación sin afectar a clientes reales.
          </p>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`relative inline-flex items-center h-7 w-12 rounded-full transition-all duration-300 shadow-inner ${
            isActive 
              ? 'bg-gradient-to-r from-indigo-600 to-blue-500 shadow-indigo-500/20' 
              : 'bg-slate-800'
          } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
