import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Star, MessageCircle, AlertTriangle } from "lucide-react"

export function CoverageMatrix({ musicians, onViewDetails }: { musicians: any[], onViewDetails: (m: any) => void }) {
  
  // Group by instrument for better matrix view
  const grouped = musicians.reduce((acc, musician) => {
    const inst = musician.instrument || "General"
    if (!acc[inst]) acc[inst] = []
    acc[inst].push(musician)
    return acc
  }, {} as Record<string, any[]>)

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`w-3 h-3 ${star <= rating ? "fill-yellow-400 text-yellow-700" : "fill-white/10 text-muted-foreground"}`} 
          />
        ))}
      </div>
    )
  }

  const availabilityColors: Record<string, string> = {
    "Disponible": "bg-green-500/20 text-green-700 border-green-500/30",
    "Ocupado": "bg-red-500/20 text-red-700 border-red-500/30",
    "Vacaciones": "bg-blue-500/20 text-blue-800 border-blue-500/30",
    "Ausencia": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-card">
          <TableRow className="border-border/40 hover:bg-transparent">
            <TableHead className="text-foreground font-bold w-[200px]">Instrumento</TableHead>
            <TableHead className="text-foreground font-bold w-[300px]">Titular</TableHead>
            <TableHead className="text-foreground font-bold min-w-[400px]">Suplentes (Cobertura)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(grouped).map(([instrument, list]) => (
            list.map((musician: any, idx: number) => {
              const isAtRisk = musician.status === "active" && musician.substitutes.length === 0
              const badgeColor = availabilityColors[musician.availability] || "bg-gray-500/20 text-muted-foreground border-gray-500/30"

              return (
                <TableRow key={musician.id} className="border-border/40 hover:bg-primary/10 cursor-pointer" onClick={() => onViewDetails(musician)}>
                  {/* Instrument is only shown on the first row of the group, or we just show it every time for simplicity */}
                  <TableCell className="font-medium text-primary">
                    {idx === 0 ? instrument.toUpperCase() : ""}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-base">{musician.user.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                          {musician.availability}
                        </span>
                        {isAtRisk && <AlertTriangle className="w-3 h-3 text-red-700" />}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {musician.substitutes.length === 0 ? (
                       <span className="text-red-700/80 text-sm italic font-medium flex items-center gap-1">
                         <AlertTriangle className="w-4 h-4" /> Sin cobertura
                       </span>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {musician.substitutes.map((sub: any) => {
                          const subWa = sub.whatsapp || sub.phone
                          const waLink = subWa ? `https://wa.me/${subWa.replace(/\D/g, "")}` : null
                          
                          return (
                            <div key={sub.id} className="bg-card border border-border/40 rounded-lg p-2 flex flex-col gap-1 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-sm text-gray-200">{sub.name}</span>
                                {waLink && (
                                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700 transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-muted-foreground">{sub.whatsapp}</span>
                                {renderStars(sub.rating || 3)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
