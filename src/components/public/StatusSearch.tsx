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
      <div className="absolute -inset-1 bg-gradient-to-r from-[#6F0D2B]/50 via-[#FF5A5F]/40 to-[#7777FF]/40 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-300" />
      <form 
        onSubmit={handleSearch}
        className="relative flex flex-col md:flex-row gap-3 glass-card p-6 md:p-8 rounded-3xl border border-white/20 shadow-2xl"
      >
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-white/40">
            <Ticket className="w-4 h-4 text-[#FF5A5F]" />
          </div>
          <Input 
            value={shortId}
            onChange={e => setShortId(e.target.value)}
            placeholder="Ej: ABC123X"
            className="h-12 pl-11 bg-white/5 border-white/15 text-[#F2F0EB] font-sans font-semibold tracking-widest uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal rounded-xl focus:border-[#FF5A5F] focus:ring-1 focus:ring-[#FF5A5F]"
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading || !shortId}
          className="h-12 px-8 font-sans font-semibold text-xs uppercase tracking-wider rounded-xl gap-2 shadow-lg shadow-[#FF5A5F]/25 bg-gradient-to-r from-[#6F0D2B] via-[#A91D4D] to-[#FF5A5F] text-[#F2F0EB] border border-white/20 hover:scale-[1.02] transition-all cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Consultar Estatus
        </Button>
      </form>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-[10px] md:text-[11px] text-[#F2F0EB]/60 font-semibold uppercase tracking-widest">
         <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#FF5A5F]" /> Ver Contrato</div>
         <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#20D5E5]" /> Estado de Pago</div>
         <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7777FF]" /> Detalles Logísticos</div>
      </div>
    </div>
  )
}
