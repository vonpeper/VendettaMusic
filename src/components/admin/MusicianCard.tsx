import { Phone, Users as UsersIcon, AlertTriangle, MessageCircle, Star } from "lucide-react"

export function MusicianCard({ musician, onViewDetails }: { musician: any, onViewDetails: () => void }) {
  const isAvailable = musician.availability === "Disponible"
  const isAtRisk = musician.status === "active" && musician.substitutes.length === 0

  const availabilityColors: Record<string, string> = {
    "Disponible": "bg-green-500/20 text-green-700 border-green-500/30",
    "Ocupado": "bg-red-500/20 text-red-700 border-red-500/30",
    "Vacaciones": "bg-blue-500/20 text-blue-800 border-blue-500/30",
    "Ausencia": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  }

  const badgeColor = availabilityColors[musician.availability] || "bg-gray-500/20 text-muted-foreground border-gray-500/30"
  
  // Format phone for whatsapp link
  const rawPhone = musician.whatsapp || musician.phone
  const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, "") : ""
  
  // Basic validation for Mexico (52) if 10 digits
  const formattedPhone = (cleanPhone.length === 10) ? `52${cleanPhone}` : cleanPhone
  const waLink = cleanPhone ? `https://wa.me/${formattedPhone}` : null

  return (
    <div className={`bg-card border ${isAtRisk ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-border/40'} rounded-xl p-5 relative overflow-hidden transition-all hover:border-primary/50`}>
      {/* Risk Alert */}
      {isAtRisk && (
        <div className="absolute top-0 right-0 bg-red-500 text-foreground text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg flex items-center gap-1 shadow-sm">
          <AlertTriangle className="w-3 h-3" /> Sin Suplente
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0 overflow-hidden">
          {musician.user.image ? (
            <img src={musician.user.image} alt={musician.user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-black text-primary">
              {musician.user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="flex-1 pr-12">
          <h3 className="font-bold text-lg text-foreground leading-tight">{musician.user.name}</h3>
          <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mt-0.5">{musician.instrument || "Músico"}</p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {musician.availability}
            </span>
            {musician.status !== "active" && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-gray-500/20 text-muted-foreground border-gray-500/30">
                Inactivo
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
          className="flex-1 bg-primary/10 hover:bg-primary/10 text-foreground border border-border/40 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          Ver Detalles
        </button>
        
        {waLink ? (
          <a 
            href={waLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 bg-green-600 hover:bg-green-500 text-foreground py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        ) : (
          <button 
            disabled
            className="flex-1 bg-zinc-800/50 border border-border/20 text-zinc-500 cursor-not-allowed py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Sin WhatsApp
          </button>
        )}
      </div>
    </div>
  )
}
