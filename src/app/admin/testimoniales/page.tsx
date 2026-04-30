import { Shield, MessageSquare, Check, X, Trash2, Clock, Star, TrendingUp } from "lucide-react"
import { db } from "@/lib/db"
import { ReviewList } from "./ReviewList"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function TestimonialesPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin")
  }
  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" }
  })

  const pendingCount = reviews.filter(r => r.status === "pending").length
  const approvedCount = reviews.filter(r => r.status === "approved").length

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
            <MessageSquare className="w-3 h-3" /> Moderación de Contenido
          </div>
          <h1 className="text-4xl font-heading font-black text-foreground uppercase tracking-tighter leading-none">
            Gestión de <span className="text-primary italic underline decoration-white/10">Testimoniales</span>
          </h1>
        </div>

        <div className="flex gap-4">
          <div className="bg-card border border-border/40 rounded-2xl px-6 py-3 flex flex-col items-center min-w-[120px]">
            <span className="text-2xl font-black text-primary">{pendingCount}</span>
            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Pendientes</span>
          </div>
          <div className="bg-card border border-border/40 rounded-2xl px-6 py-3 flex flex-col items-center min-w-[120px]">
            <span className="text-2xl font-black text-green-400">{approvedCount}</span>
            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Aprobados</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <ReviewList initialReviews={reviews} />
      </div>

      {reviews.length === 0 && (
        <div className="bg-card border border-border/40 rounded-[2rem] p-20 text-center">
          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-xl font-bold text-muted-foreground uppercase tracking-widest">No hay testimoniales aún</h3>
          <p className="text-muted-foreground text-sm mt-2 font-medium">Los nuevos comentarios aparecerán aquí para tu aprobación.</p>
        </div>
      )}
    </div>
  )
}
