"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Music2, ShieldCheck } from "lucide-react"
import { RockBackground } from "@/components/funnel/RockBackground"

export default function StatusLookupPage() {
  const [shortId, setShortId] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (shortId.trim()) {
      router.push(`/status/${shortId.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-20">
      <RockBackground />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-6">
            <ShieldCheck className="w-3 h-3" /> Seguimiento de Eventos
          </div>
          
          <h1 className="text-4xl md:text-6xl font-heading font-black text-white uppercase tracking-tighter mb-4">
            Consulta tu <span className="animated-title italic pr-4">Estatus</span>
          </h1>
          
          <p className="text-gray-400 mb-10 text-sm font-medium leading-relaxed">
            Ingresa el ID de seguimiento (ej. VND-A1B2) que recibiste al finalizar tu solicitud para conocer el estado actual de tu reserva.
          </p>

          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex flex-col md:flex-row gap-2 bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  value={shortId}
                  onChange={(e) => setShortId(e.target.value)}
                  placeholder="VND-XXXX"
                  className="bg-transparent border-none h-14 pl-12 text-lg font-black tracking-widest uppercase text-white focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 font-black uppercase text-xs tracking-widest gap-2">
                Consultar <Music2 className="w-4 h-4" />
              </Button>
            </div>
          </form>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: "Pendiente", color: "bg-yellow-500" },
              { label: "Confirmado", color: "bg-green-500" },
              { label: "En Camino", color: "bg-blue-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${s.color} animate-pulse`} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Decorative Blurs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/5 rounded-full blur-[150px] pointer-events-none" />
    </div>
  )
}
