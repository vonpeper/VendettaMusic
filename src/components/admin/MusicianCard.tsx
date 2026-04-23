import { Phone, Users as UsersIcon, AlertTriangle, MessageCircle } from "lucide-react"

export function MusicianCard({ musician, onViewDetails }: { musician: any, onViewDetails: () => void }) {
  const isAvailable = musician.availability === "Disponible"
  const isAtRisk = musician.status === "active" && musician.substitutes.length === 0

  const availabilityColors: Record<string, string> = {
    "Disponible": "bg-green-500/20 text-green-400 border-green-500/30",
    "Ocupado": "bg-red-500/20 text-red-400 border-red-500/30",
    "Vacaciones": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Ausencia": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  }

  const badgeColor = availabilityColors[musician.availability] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
  
  // Format phone for whatsapp link
  const waLink = musician.phone ? `https://wa.me/${musician.phone.replace(/\D/g, "")}` : null

  return (
    <div className={`bg-card border ${isAtRisk ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/10'} rounded-xl p-5 relative overflow-hidden transition-all hover:border-primary/50`}>
      {/* Risk Alert */}
      {isAtRisk && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg flex items-center gap-1 shadow-sm">
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
          <h3 className="font-bold text-lg text-white leading-tight">{musician.user.name}</h3>
          <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mt-0.5">{musician.instrument || "Músico"}</p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {musician.availability}
            </span>
            {musician.status !== "active" && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-gray-500/20 text-gray-400 border-gray-500/30">
                Inactivo
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 py-3 border-y border-white/5">
        <div className="flex items-center gap-2 text-sm">
          <UsersIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-gray-300"><span className="font-bold text-white">{musician.substitutes.length}</span> Suplentes</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-gray-300 truncate">{musician.phone || "Sin teléfono"}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onViewDetails}
          className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          Ver Detalles
        </button>
        
        {waLink ? (
          <a 
            href={waLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        ) : (
          <button 
            disabled
            className="flex-1 bg-gray-800 text-gray-500 cursor-not-allowed py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Sin WhatsApp
          </button>
        )}
      </div>
    </div>
  )
}
