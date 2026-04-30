"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Music2, Ticket } from "lucide-react"

export function StatusSearch() {
  const [shortId, setShortId] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!shortId.trim()) return
    setLoading(true)
    router.push(`/status/${shortId.toUpperCase().trim()}`)
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-rose-500/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
      <form 
        onSubmit={handleSearch}
        className="relative flex flex-col md:flex-row gap-3 bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl"
      >
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <Ticket className="w-4 h-4" />
          </div>
          <Input 
            value={shortId}
            onChange={e => setShortId(e.target.value)}
            placeholder="Ej: ABC123X"
            className="h-12 pl-10 bg-white/5 border-white/10 text-white font-black tracking-widest uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading || !shortId}
          className="h-12 px-8 font-black gap-2 shadow-lg shadow-primary/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Consultar Estatus
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-center gap-6 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
         <div className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary" /> Ver Contrato</div>
         <div className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary" /> Estado de Pago</div>
         <div className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary" /> Detalles Logísticos</div>
      </div>
    </div>
  )
}
