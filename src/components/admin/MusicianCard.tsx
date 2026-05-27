import { Phone, Users as UsersIcon, AlertTriangle, MessageCircle, Star } from "lucide-react"
import { useState } from "react"
import { toWaLink } from "@/lib/phone"

export function MusicianCard({ musician, onViewDetails }: { musician: any, onViewDetails: () => void }) {
  const [imgError, setImgError] = useState(false);
  const isInactive = musician.status !== "active"
  const actualAvailability = isInactive ? "No Aplica" : musician.availability
  const isAvailable = actualAvailability === "Disponible"
  const isAtRisk = !isInactive && musician.substitutes?.length === 0

  const availabilityColors: Record<string, string> = {
    "Disponible": "bg-green-600 text-white border-none shadow-sm",
    "Ocupado": "bg-red-600 text-white border-none shadow-sm",
    "Vacaciones": "bg-blue-600 text-white border-none shadow-sm",
    "Ausencia": "bg-orange-600 text-white border-none shadow-sm",
    "No Aplica": "bg-gray-500/20 text-muted-foreground border-gray-500/30",
  }

  const badgeColor = availabilityColors[actualAvailability] || "bg-gray-500/20 text-muted-foreground border-gray-500/30"
  
  // Format phone for WhatsApp link — uses centralized normalization (521XXXXXXXXXX)
  const rawPhone = musician.whatsapp
  const waLink = rawPhone ? toWaLink(rawPhone) : null

  return (
    <div className={`bg-card border ${isAtRisk ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-border/40'} rounded-xl p-5 relative overflow-hidden transition-all hover:border-primary/50`}>
      {/* Risk Alert */}
      {isAtRisk && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 uppercase tracking-wider rounded-bl-lg flex items-center gap-1 shadow-md z-10">
          <AlertTriangle className="w-3 h-3" /> Sin Suplente
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center border border-primary/30 shrink-0 overflow-hidden shadow-inner">
          {musician.user.image && !imgError ? (
            <img src={musician.user.image} alt={musician.user.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <span className="text-xl font-black text-white">
              {musician.user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="flex-1 pr-12">
          <h3 className="font-bold text-lg text-foreground leading-tight">{musician.user.name}</h3>
          <p className="text-sm font-black text-primary uppercase tracking-wider mt-0.5">{musician.instrument || "Músico"}</p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {isInactive ? (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-red-500/10 text-red-500 border-red-500/20">
                Inactivo
              </span>
            ) : (
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                {actualAvailability}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 py-3 border-y border-border/40">
        <div className="flex items-center gap-2 text-sm">
          {["Ingeniero de Audio", "Técnico", "Staff"].includes(musician.instrument) ? (
            <>
              <UsersIcon className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground font-bold text-[10px] uppercase">Apoyo</span>
            </>
          ) : (
            <>
              <UsersIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground"><span className="font-bold text-foreground">{musician.substitutes.length}</span> Suplentes</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground truncate">{rawPhone || "Sin teléfono"}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <Star 
              key={star} 
              className={`w-3.5 h-3.5 ${star <= (musician.rating || 3) ? "fill-yellow-500 text-yellow-600" : "fill-white/10 text-muted-foreground/30"}`} 
            />
          ))}
        </div>
        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Calificación General</div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onViewDetails}
          className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 shadow-md"
        >
          Ver Perfil
        </button>
        
        {waLink ? (
          <a 
            href={waLink} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ backgroundColor: '#25D366' }}
            className="flex-1 text-white py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        ) : (
          <button 
            disabled
            className="flex-1 bg-muted border border-border/40 text-muted-foreground cursor-not-allowed py-2 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Sin WhatsApp
          </button>
        )}
      </div>
    </div>
  )
}
