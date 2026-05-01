"use client"

import { useState } from "react"
import { Check, X, Trash2, Clock, Star, User, MessageSquare } from "lucide-react"
import { updateReviewStatusAction, deleteReviewAction } from "@/actions/admin-reviews"
import { Button } from "@/components/ui/button"
import { formatDateMX } from "@/lib/utils"

interface Review {
  id: string
  name: string
  event?: string
  stars: number
  text: string
  status: string
  createdAt: Date
}

export function ReviewList({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleStatus(id: string, status: string) {
    setLoadingId(id)
    const res = await updateReviewStatusAction(id, status)
    if (res.success) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    }
    setLoadingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este testimonio definitivamente?")) return
    
    setLoadingId(id)
    const res = await deleteReviewAction(id)
    if (res.success) {
      setReviews(prev => prev.filter(r => r.id !== id))
    }
    setLoadingId(null)
  }

  // Separar pendientes de aprobados
  const pending = reviews.filter(r => r.status === "pending")
  const rest = reviews.filter(r => r.status !== "pending")

  return (
    <div className="space-y-12">
      {/* Pendientes */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
             <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Pendientes de Revisión</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pending.map(r => (
              <ReviewCard 
                key={r.id} 
                review={r} 
                loading={loadingId === r.id}
                onApprove={() => handleStatus(r.id, "approved")}
                onReject={() => handleStatus(r.id, "rejected")}
                onDelete={() => handleDelete(r.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* El Resto */}
      <section>
        <h2 className="text-xl font-black text-muted-foreground uppercase tracking-tight mb-6">Historial y Aprobados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map(r => (
            <ReviewCard 
              key={r.id} 
              review={r} 
              loading={loadingId === r.id}
              onApprove={r.status !== "approved" ? () => handleStatus(r.id, "approved") : undefined}
              onReject={r.status !== "rejected" ? () => handleStatus(r.id, "rejected") : undefined}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function ReviewCard({ review, loading, onApprove, onReject, onDelete }: any) {
  return (
    <div className={`group relative bg-card border border-border/40 rounded-[2rem] p-6 transition-all duration-300 ${
      review.status === "pending" ? "border-primary/20 bg-primary/5 shadow-xl shadow-primary/5" : ""
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < review.stars ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
          ))}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onApprove && (
            <button 
              disabled={loading}
              onClick={onApprove}
              className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-foreground transition-all"
              title="Aprobar"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {onReject && (
            <button 
              disabled={loading}
              onClick={onReject}
              className="p-2 rounded-full bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-foreground transition-all"
              title="Rechazar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            disabled={loading}
            onClick={onDelete}
            className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-foreground transition-all"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm font-medium text-foreground mb-4 leading-relaxed italic">"{review.text}"</p>
      
      <div className="flex items-center gap-3 pt-4 border-t border-border/40">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
          {review.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-xs font-black text-foreground uppercase tracking-tight">{review.name}</div>
          {review.event && (
            <div className="text-[9px] text-primary font-black uppercase tracking-widest leading-none mt-0.5">
              {review.event}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5">
             <Clock className="w-2.5 h-2.5 text-muted-foreground" />
             <span className="text-[10px] text-muted-foreground font-medium">{formatDateMX(review.createdAt, "d MMM, HH:mm")}</span>
             <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest ${
               review.status === "approved" ? "bg-green-400/10 text-green-400" :
               review.status === "pending" ? "bg-primary/10 text-primary" :
               "bg-gray-500/10 text-muted-foreground"
             }`}>
               {review.status}
             </span>
          </div>
        </div>
      </div>
    </div>
  )
}
