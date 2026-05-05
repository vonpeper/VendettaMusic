export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, MessageCircle, AlertTriangle, CheckCircle2, Clock, Inbox, type LucideIcon } from "lucide-react"
import { formatDateMX } from "@/lib/utils"
import { NotificationActions } from "@/components/admin/NotificationActions"
import { ClearNotificationsButton } from "@/components/admin/ClearNotificationsButton"
import { TestNotificationButtons } from "@/components/admin/TestNotificationButtons"

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  admin_booking:     { label: "Nuevo pedido (Admin)",     color: "bg-blue-500/10 text-blue-300 border-blue-500/30" },
  client_closed:     { label: "Cierre de venta (Cliente)", color: "bg-green-500/10 text-green-300 border-green-500/30" },
  client_followup:   { label: "Follow-up (Cliente)",       color: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30" },
  gig_created:       { label: "Convocatoria (Músico)",     color: "bg-purple-500/10 text-purple-300 border-purple-500/30" },
  rehearsal_created: { label: "Ensayo (Músico)",           color: "bg-pink-500/10 text-pink-300 border-pink-500/30" },
  inbound:           { label: "Mensaje entrante",           color: "bg-orange-500/10 text-orange-300 border-orange-500/30" },
  outbound:          { label: "Mensaje saliente",           color: "bg-blue-500/10 text-blue-300 border-blue-500/30" },
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  automatic_notification: { label: "Auto-Notif",    color: "bg-blue-500/20 text-blue-400" },
  customer_reply:         { label: "Respuesta",     color: "bg-green-500/20 text-green-400" },
  actionable:             { label: "Acción Req",    color: "bg-orange-500/20 text-orange-400" },
}

const STATUS_ICONS: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  pending:   { icon: Clock,          color: "text-yellow-400", label: "Pendiente" },
  sent:      { icon: CheckCircle2,   color: "text-blue-400",   label: "Enviado" },
  delivered: { icon: CheckCircle2,   color: "text-green-400",  label: "Entregado" },
  read:      { icon: CheckCircle2,   color: "text-green-500",  label: "Leído" },
  failed:    { icon: AlertTriangle,  color: "text-red-400",    label: "Falló" },
  received:  { icon: Inbox,          color: "text-orange-400", label: "Recibido" },
}

export default async function NotificacionesPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "AGENTE"].includes(session.user.role as string)) {
    redirect("/admin")
  }

  const notifications = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const counts = {
    pending:  notifications.filter(n => n.status === "pending" || n.status === "failed").length,
    inbound:  notifications.filter(n => n.status === "received").length,
    today:    notifications.filter(n => {
      const d = new Date(n.createdAt)
      const today = new Date()
      return d.toDateString() === today.toDateString()
    }).length,
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 text-primary mb-2">
            <Bell className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-widest">Centro de Notificaciones</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight">Mensajes de WhatsApp</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Historial completo de mensajes enviados a clientes, músicos y administradores. Reenvía los que fallaron.
          </p>
        </div>
        <ClearNotificationsButton />
      </div>

      <TestNotificationButtons />

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Por Reintentar</div>
            <div className="text-3xl font-black text-yellow-300 mt-1">{counts.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-orange-500/20">
          <CardContent className="pt-6">
            <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Entrantes Sin Leer</div>
            <div className="text-3xl font-black text-orange-300 mt-1">{counts.inbound}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-primary/20">
          <CardContent className="pt-6">
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest">Hoy</div>
            <div className="text-3xl font-black text-foreground mt-1">{counts.today}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/40">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-5 h-5 text-primary" /> Últimos 200 mensajes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Sin mensajes registrados todavía.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map(n => {
                const typeMeta = TYPE_LABELS[n.type] || { label: n.type, color: "bg-muted text-muted-foreground" }
                const statusMeta = STATUS_ICONS[n.status] || STATUS_ICONS.pending
                const StatusIcon = statusMeta.icon
                const canResend = ["failed", "pending"].includes(n.status) && n.type !== "inbound"

                return (
                  <div key={n.id} className="p-5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className={typeMeta.color}>{typeMeta.label}</Badge>
                        {n.category && CATEGORY_LABELS[n.category] && (
                          <Badge variant="outline" className={CATEGORY_LABELS[n.category].color}>
                            {CATEGORY_LABELS[n.category].label}
                          </Badge>
                        )}
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${statusMeta.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusMeta.label}
                        </div>
                        {n.template && (
                           <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                             {n.template}
                           </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateMX(n.createdAt, "d MMM, HH:mm")}
                        </span>
                      </div>
                      {canResend && <NotificationActions notificationId={n.id} />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="font-bold text-foreground">→</span>
                      <span className="font-mono">{n.recipient || "—"}</span>
                      {n.eventId && (
                        <a href={`/admin/eventos/${n.eventId}`} className="ml-auto text-primary hover:underline text-[10px] uppercase tracking-widest font-bold">
                          Ver evento
                        </a>
                      )}
                    </div>
                    <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans bg-background/40 p-3 rounded-lg border border-border/30 max-h-32 overflow-y-auto">
                      {n.message}
                    </pre>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
