export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Inbox, MessageSquare, AlertCircle, Clock, User, Phone, CheckCircle2, Filter } from "lucide-react"
import { formatDateMX } from "@/lib/utils"
import { InboxItemActions } from "@/components/admin/InboxItemActions"
import Link from "next/link"

const PRIORITY_COLORS: Record<string, string> = {
  high:   "bg-red-500/10 text-red-500 border-red-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  low:    "bg-blue-500/10 text-blue-500 border-blue-500/30",
}

const TYPE_LABELS: Record<string, string> = {
  new_lead: "Nuevo Lead",
  customer_action_required: "Acción Requerida",
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  payment_related:  { label: "Pagos",       color: "bg-green-500/10 text-green-500" },
  event_change:     { label: "Cambios",     color: "bg-purple-500/10 text-purple-500" },
  contract_related: { label: "Contratos",   color: "bg-blue-500/10 text-blue-500" },
  general_inquiry:  { label: "Dudas/Info",  color: "bg-orange-500/10 text-orange-500" },
  cancellation:     { label: "Cancelación", color: "bg-red-500/10 text-red-500" },
}

export default async function InboxPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "AGENTE"].includes(session.user.role as string)) {
    redirect("/admin")
  }

  const items = await db.inboxItem.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      bookingRequest: true,
    }
  })

  const pendingCount = items.filter(i => i.status === "pending").length

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-primary mb-2">
            <Inbox className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-widest">Atención al Cliente</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight">Bandeja de Atención</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Solo mensajes que requieren acción humana. Se eliminó el ruido de las notificaciones automáticas.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-4 py-2 border-primary/20 bg-primary/5 text-primary text-sm font-bold">
                {pendingCount} Pendientes
            </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.length === 0 ? (
          <Card className="bg-card border-dashed border-border/60">
            <CardContent className="p-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary/40" />
              <h3 className="text-lg font-bold text-foreground">¡Todo al día!</h3>
              <p>No hay mensajes pendientes en la bandeja de atención.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map(item => {
              const priorityClass = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium
              const catMeta = item.category ? CATEGORY_LABELS[item.category] : null
              const isResolved = item.status === "resolved"

              return (
                <Card key={item.id} className={`bg-card border-border/40 transition-all ${isResolved ? 'opacity-60 grayscale-[0.5]' : 'hover:border-primary/30'}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-stretch">
                      {/* Priority Strip */}
                      <div className={`w-1.5 shrink-0 ${
                        item.priority === "high" ? "bg-red-500" : 
                        item.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"
                      }`} />

                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={priorityClass}>
                                {item.priority.toUpperCase()}
                              </Badge>
                              <Badge variant="secondary" className="font-bold">
                                {TYPE_LABELS[item.type] || item.type}
                              </Badge>
                              {catMeta && (
                                <Badge variant="outline" className={`${catMeta.color} border-none font-bold`}>
                                  {catMeta.label}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDateMX(item.createdAt, "d MMM, HH:mm")}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <h3 className={`text-xl font-bold ${isResolved ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.senderName || "Contacto Desconocido"}
                                </h3>
                                {item.clientId && (
                                    <Link href={`/admin/clientes/${item.clientId}`} className="text-[10px] text-primary hover:underline font-black uppercase tracking-tighter">
                                        Ver Perfil
                                    </Link>
                                )}
                            </div>
                          </div>
                          
                          <InboxItemActions 
                            itemId={item.id} 
                            currentStatus={item.status} 
                            currentPriority={item.priority} 
                          />
                        </div>

                        <div className="bg-muted/30 rounded-xl p-4 border border-border/20 mb-4">
                            <p className={`text-sm leading-relaxed ${isResolved ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {item.message}
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-full border border-border/40">
                              <Phone className="w-3 h-3" />
                              <span className="font-mono">{item.phoneNumber}</span>
                            </div>
                            {item.bookingRequestId && (
                              <Link href={`/admin/ventas?id=${item.bookingRequestId}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                                <MessageSquare className="w-3 h-3" />
                                <span>Ver Reserva</span>
                              </Link>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {isResolved ? (
                               <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                                 <CheckCircle2 className="w-3 h-3" /> Resuelto
                               </Badge>
                             ) : (
                               <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1">
                                 <AlertCircle className="w-3 h-3" /> Pendiente
                               </Badge>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
