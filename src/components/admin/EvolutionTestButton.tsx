"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { testEvolutionConnectionAction } from "@/actions/config"

export function EvolutionTestButton() {
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    try {
      const res = await testEvolutionConnectionAction()
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (err: any) {
      toast.error("Error al probar conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      type="button"
      onClick={handleTest}
      disabled={loading}
      variant="outline" 
      className="w-full border-blue-500/30 hover:bg-blue-500/10 text-blue-400 group h-10 font-bold text-xs"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <ShieldCheck className="w-4 h-4 mr-2" />
      )}
      Probar Conexión con la API
    </Button>
  )
}
