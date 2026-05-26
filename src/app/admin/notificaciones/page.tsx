
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatDateTimeMX } from "@/lib/utils"
import { 
  MessageSquare, CheckCircle2, Clock, AlertCircle, 
  Settings, History, FileText, Smartphone, ShieldCheck,
  ExternalLink, Zap, Info, ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfigFormWrapper } from "@/components/admin/ConfigFormWrapper"
import { Toggle } from "@/components/ui/Toggle"
import { SandboxToggle } from "@/components/admin/SandboxToggle"
import { saveMessageTemplatesAction } from "@/actions/config"
import { EvolutionHealthCheck } from "@/components/admin/EvolutionHealthCheck"
import { ResendNotificationButton } from "@/components/admin/ResendNotificationButton"
import { RetryAllFailedButton } from "@/components/admin/RetryAllFailedButton"

export const dynamic = 'force-dynamic'

export default async function NotificacionesPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin")
  }

  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  const notifications = await db.notification.findMany({
    where: { type: { not: 'inbound' } },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  const incomingMessages = await db.notification.findMany({
    where: { type: 'inbound' },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  const failedMessages = await db.notification.findMany({
    where: { status: 'failed', type: { not: 'inbound' } },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  // Estadísticas simples
  const stats = {
    total: await db.notification.count({ where: { type: { not: 'inbound' } } }),
    success: await db.notification.count({ where: { status: { in: ['sent', 'delivered', 'success'] }, type: { not: 'inbound' } } }),
    error: await db.notification.count({ where: { status: 'error', type: { not: 'inbound' } } }),
    inbound: await db.notification.count({ where: { type: 'inbound' } })
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
      case 'delivered':
      case 'success':
      case 'received':
        return <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle2 className="w-3 h-3" /> {status === 'received' ? 'Recibido' : 'Enviado'}</span>
      case 'pending':
        return <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3 h-3" /> Pendiente</span>
      default:
        return <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"><AlertCircle className="w-3 h-3" /> Error</span>
    }
  }

  return (
    <div className="p-8 bg-background min-h-screen pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Zap className="w-5 h-5 fill-blue-600" />
              <span className="text-xs font-bold uppercase tracking-widest">Communication Hub</span>
            </div>
            <h1 className="text-4xl font-heading font-black text-foreground tracking-tight">Centro de <span className="text-blue-600">Mensajería</span></h1>
            <p className="text-muted-foreground mt-1 text-sm">Gestiona la comunicación VIP con tus clientes y músicos.</p>
          </div>
          
          <div className="flex gap-4">
             <Card className="bg-card border-border/20 px-4 py-2 flex items-center gap-3">
                <EvolutionHealthCheck />
             </Card>
          </div>
        </div>

        <Tabs defaultValue="control" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 border border-border/40 rounded-xl">
            <TabsTrigger value="control" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Zap className="w-4 h-4" /> Centro de Control
            </TabsTrigger>
            <TabsTrigger value="plantillas" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4" /> Plantillas VIP
            </TabsTrigger>
            <TabsTrigger value="entrantes" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <MessageSquare className="w-4 h-4" /> Mensajes Entrantes
            </TabsTrigger>
            <TabsTrigger value="fallidos" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-500" /> Reintentos / Fallidos
            </TabsTrigger>
            <TabsTrigger value="historial" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <History className="w-4 h-4" /> Historial de Salida
            </TabsTrigger>
          </TabsList>

          {/* ================= PESTAÑA: CONTROL ================= */}
          <TabsContent value="control" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <Card className="bg-card border-border/20">
                  <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Mensajes Enviados</CardDescription>
                </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-foreground">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total histórico</p>
                  </CardContent>
               </Card>
               <Card className="bg-card border-border/20">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-green-400">Entrega Exitosa</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-foreground">{Math.round((stats.success / (stats.total || 1)) * 100)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Eficiencia de envío</p>
                  </CardContent>
               </Card>
               <Card className="bg-card border-border/20">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Recibidos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-foreground">{stats.inbound}</div>
                    <p className="text-xs text-muted-foreground mt-1">Mensajes entrantes</p>
                  </CardContent>
               </Card>
               <Card className="bg-card border-border/20">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-red-400">Errores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-foreground">{stats.error}</div>
                    <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
                  </CardContent>
               </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <section className="space-y-6">
                 <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                   <ShieldCheck className="w-5 h-5 text-blue-600" /> Pruebas y Seguridad
                 </h3>
                 <SandboxToggle initialValue={config?.isSandbox || false} />
                 
                 <Card className="bg-blue-600/5 border border-blue-600/20 p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-foreground">¿Cómo funciona el Sandbox?</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Al activar el modo Sandbox, todos los mensajes (cotizaciones, confirmaciones, convocatorias) se desviarán automáticamente al <strong>WhatsApp del Administrador</strong>. Esto te permite validar el diseño y los datos sin que el cliente final reciba nada.
                        </p>
                      </div>
                    </div>
                 </Card>
               </section>

               <section className="space-y-6">
                 <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                   <Smartphone className="w-5 h-5 text-blue-600" /> Conectividad WhatsApp
                 </h3>
                 <Card className="bg-card border border-border/40 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Instancia Activa</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{config?.evolutionInstance || "vendetta_admin"}</p>
                        </div>
                      </div>
                      <Link href="/admin/configuracion" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Configurar API</Link>
                    </div>

                    <div className="pt-4 border-t border-border/40 space-y-3">
                       <p className="text-[11px] text-muted-foreground italic">
                         Asegúrate de que tu instancia en Evolution API esté vinculada a un dispositivo físico para garantizar el envío.
                       </p>
                       {config?.evolutionUrl && (
                        <a href={`${config.evolutionUrl.replace(/\/$/, "")}/manager`} target="_blank" rel="noopener noreferrer" 
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                          <span className="text-xs font-bold text-muted-foreground">Abrir Evolution Manager</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </a>
                      )}
                    </div>
                 </Card>
               </section>
            </div>
          </TabsContent>

          {/* ================= PESTAÑA: PLANTILLAS ================= */}
          <TabsContent value="plantillas" className="outline-none">
            <Card className="bg-card border-border/40 rounded-2xl overflow-hidden backdrop-blur-sm">
              <CardHeader className="bg-muted/30 border-b border-border/40 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black tracking-tight">Personalización de Plantillas</CardTitle>
                    <CardDescription>Edita los mensajes automáticos que tus clientes y músicos reciben.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <ConfigFormWrapper action={saveMessageTemplatesAction} className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Cotización */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="msgTemplateQuote" className="text-foreground font-black uppercase tracking-widest text-xs">📄 Envío de Cotización</Label>
                        <span className="text-[10px] text-muted-foreground italic">Cliente</span>
                      </div>
                      <Textarea id="msgTemplateQuote" name="msgTemplateQuote" rows={10}
                        defaultValue={config?.msgTemplateQuote || `Hola {{clientName}}, somos *Vendetta Live Music* 🎸.

Es un gusto saludarte. Te compartimos adjunta la propuesta exclusiva para tu evento el próximo *{{date}}*.

Revisamos cada detalle para asegurar que la música sea inolvidable. Quedamos a tus órdenes para agendar una breve llamada y pulir los detalles.

¡Rock on! 🤘

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`} 
                        placeholder="Usa {{clientName}}, {{date}}, {{total}}..."
                        className="bg-muted/30 border-border/40 text-foreground font-mono text-sm leading-relaxed" />
                    </div>

                    {/* Confirmación */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="msgTemplateEventClose" className="text-foreground font-black uppercase tracking-widest text-xs">🎉 Confirmación de Cierre</Label>
                        <span className="text-[10px] text-muted-foreground italic">Cliente</span>
                      </div>
                      <Textarea id="msgTemplateEventClose" name="msgTemplateEventClose" rows={10}
                        defaultValue={config?.msgTemplateEventClose || `¡Felicidades {{clientName}}! 🎉

Hemos recibido tu anticipo y tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

Puedes consultar el estatus de tu evento y descargar tu contrato firmado aquí:
{{bookingLink}}

¡Gracias por confiar en *Vendetta* para este día tan especial! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`} 
                        placeholder="Usa {{clientName}}, {{shortId}}..."
                        className="bg-muted/30 border-border/40 text-foreground font-mono text-sm leading-relaxed" />
                    </div>

                    {/* Confirmación Bares */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="msgTemplateBarClose" className="text-foreground font-black uppercase tracking-widest text-xs">🍻 Confirmación de Bares</Label>
                        <span className="text-[10px] text-muted-foreground italic">Cliente (Bares)</span>
                      </div>
                      <Textarea id="msgTemplateBarClose" name="msgTemplateBarClose" rows={10}
                        defaultValue={config?.msgTemplateBarClose || `¡Hola {{clientName}}! 🎉

Tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

Puedes consultar el detalle de tu evento, *firmar tu contrato digital* y descargarlo aquí:
{{bookingLink}}

¡Gracias por confiar en *Vendetta*! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`} 
                        placeholder="Usa {{clientName}}, {{shortId}}..."
                        className="bg-muted/30 border-border/40 text-foreground font-mono text-sm leading-relaxed" />
                    </div>

                    {/* Seguimiento */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Label htmlFor="msgTemplateFollowUp" className="text-foreground font-black uppercase tracking-widest text-xs">🔄 Seguimiento Automático</Label>
                          <Toggle name="autoFollowUpEnabled" defaultChecked={config?.autoFollowUpEnabled} />
                        </div>
                        <span className="text-[10px] text-muted-foreground italic">Cliente</span>
                      </div>
                      <Textarea id="msgTemplateFollowUp" name="msgTemplateFollowUp" rows={6}
                        defaultValue={config?.msgTemplateFollowUp || `Hola {{clientName}}, te escribo de *Vendetta Music* 🎸 para dar seguimiento a tu cotización. ¿Pudiste revisarla? Seguimos a tus órdenes para apartar la fecha.`} 
                        className="bg-muted/30 border-border/40 text-foreground font-mono text-sm leading-relaxed" />
                    </div>

                    {/* Expiración Músicos (Staff) */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Label htmlFor="msgTemplateExpiring" className="text-foreground font-black uppercase tracking-widest text-xs">⚠️ Expiración de Convocatoria</Label>
                          <Toggle name="msgExpiringActive" defaultChecked={config?.msgExpiringActive} />
                        </div>
                        <span className="text-[10px] text-muted-foreground italic">Staff</span>
                      </div>
                      <Textarea id="msgTemplateExpiring" name="msgTemplateExpiring" rows={6}
                        defaultValue={config?.msgTemplateExpiring || `🎸 *RECORDATORIO — VENDETTA* 🎸

{{fullName}}, tu convocatoria para el gig del *{{date}}* está por expirar ⏳. Necesitamos confirmar el line-up final hoy mismo.

¿Contamos contigo? De lo contrario, tendremos que liberar el lugar para un suplente. ¡Avísanos!`} 
                        className="bg-muted/30 border-border/40 text-foreground font-mono text-sm leading-relaxed" />
                    </div>

                    {/* Recordatorio Pre-Evento */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Label htmlFor="msgTemplateReminder" className="text-foreground font-black uppercase tracking-widest text-xs">⏳ Recordatorio VIP (Pre-Evento)</Label>
                          <Toggle name="msgReminderActive" defaultChecked={config?.msgReminderActive} />
                        </div>
                        <span className="text-[10px] text-muted-foreground italic">Cliente</span>
                      </div>
                      <Textarea id="msgTemplateReminder" name="msgTemplateReminder" rows={8}
                        defaultValue={config?.msgTemplateReminder || `¡Hola {{clientName}}! Estamos a solo 7 días de tu gran evento el *{{date}}* 🎸.

En *Vendetta* ya estamos preparando todo para que la música sea perfecta. ¿Hay algún detalle de último minuto que debamos saber? ¡Nos vemos pronto!`} 
                        className="bg-muted/30 border-border/40 text-foreground font-mono text-sm leading-relaxed" />
                    </div>

                    {/* Agradecimiento Post-Evento */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Label htmlFor="msgTemplateThanks" className="text-foreground font-black uppercase tracking-widest text-xs">✨ Agradecimiento y Testimonial</Label>
                          <Toggle name="msgThanksActive" defaultChecked={config?.msgThanksActive} />
                        </div>
                        <span className="text-[10px] text-muted-foreground italic">Cliente</span>
                      </div>
                      <Textarea id="msgTemplateThanks" name="msgTemplateThanks" rows={6}
                        defaultValue={config?.msgTemplateThanks || `¡Hola {{clientName}}! 🎉 Todavía seguimos emocionados por lo de ayer.

Fue un honor ser parte de tu evento. Nos encantaría que nos regalas una reseña aquí para que más gente conozca la experiencia Vendetta:
👉 *vendetta.mx/#testimoniales*

¡Tu feedback es el motor de Vendetta! 🎸🤘`} 
                        className="bg-muted/30 border-border/40 text-foreground font-mono text-sm leading-relaxed" />
                    </div>

                    {/* Músicos */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="msgTemplateGig" className="text-foreground font-black uppercase tracking-widest text-xs">🎸 Convocatoria de Músicos</Label>
                        <span className="text-[10px] text-muted-foreground italic">Staff</span>
                      </div>
                      <Textarea id="msgTemplateGig" name="msgTemplateGig" rows={12}
                        defaultValue={config?.msgTemplateGig || `🎸 *NUEVA CONVOCATORIA: {{eventName}}*
  
👤 *Cliente / Evento:* {{clientName}}
📅 *Fecha:* {{date}}
🎤 *Hora de Show:* {{performanceStart}}
📍 *Ubicación:* {{location}}
🏠 *Dirección:* {{address}}
🗺️ *Maps:* {{mapsLink}}
🚗 *Llegada músicos:* {{arrivalTime}}
⚙️ *Hora de Montaje:* {{setupTime}}
👔 *Vestimenta:* {{dressCode}}
📝 *Notas:* {{notes}}

🔗 *Confirma tu asistencia aquí:*
{{confirmLink}}`} 
                        className="bg-muted/30 border-border/40 text-foreground font-mono text-sm leading-relaxed" />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/40 flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-black h-12 px-10 rounded-xl shadow-lg shadow-blue-600/20 text-white">
                      Actualizar Todas las Plantillas
                    </Button>
                  </div>
                </ConfigFormWrapper>

                <div className="mt-10 p-6 bg-muted/30 rounded-2xl border border-border/20">
                  <h4 className="text-xs font-black uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Guía de Variables Dinámicas
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { v: "{{clientName}}", d: "Nombre corto" },
                      { v: "{{fullName}}", d: "Nombre completo" },
                      { v: "{{date}}", d: "Fecha evento" },
                      { v: "{{total}}", d: "Monto total" },
                      { v: "{{folio}}", d: "ID Reserva" },
                      { v: "{{package}}", d: "Nombre paquete" },
                      { v: "{{bookingLink}}", d: "Link contrato" },
                      { v: "{{location}}", d: "Lugar (Staff)" }
                    ].map(item => (
                      <div key={item.v} className="flex flex-col gap-1">
                        <code className="text-[11px] font-bold text-blue-600">{item.v}</code>
                        <span className="text-[10px] text-muted-foreground">{item.d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= PESTAÑA: ENTRANTES ================= */}
          <TabsContent value="entrantes" className="outline-none">
            <Card className="bg-card/50 border-border/40 backdrop-blur-sm overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-amber-600/10">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-600">Fecha y Hora</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-600">Remitente</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-600">Categoría</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-600">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {incomingMessages.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                          No hay mensajes entrantes registrados aún.
                        </td>
                      </tr>
                    ) : (
                      incomingMessages.map((notif) => (
                        <tr key={notif.id} className="hover:bg-amber-600/5 transition-colors group">
                          <td className="px-6 py-4 text-sm font-medium text-foreground whitespace-nowrap">
                            <span className="capitalize">{formatDateTimeMX(notif.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap font-mono">
                            {notif.recipient || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {notif.category || "General"}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-md">
                            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors break-words">
                              {notif.message}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ================= PESTAÑA: FALLIDOS ================= */}
          <TabsContent value="fallidos" className="outline-none">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" /> Mensajes Fallidos
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Notificaciones que no pudieron ser enviadas a través de Evolution API.</p>
              </div>
              <RetryAllFailedButton />
            </div>

            <Card className="bg-card/50 border-border/40 backdrop-blur-sm overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-red-600/10">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500">Fecha y Hora</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500">Destinatario</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500">Reintentos</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500">Error</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {failedMessages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                          No hay mensajes fallidos para reintentar. ¡Todo está funcionando bien!
                        </td>
                      </tr>
                    ) : (
                      failedMessages.map((notif) => (
                        <tr key={notif.id} className="hover:bg-red-600/5 transition-colors group">
                          <td className="px-6 py-4 text-sm font-medium text-foreground whitespace-nowrap">
                            <span className="capitalize">{formatDateTimeMX(notif.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-foreground truncate">{getTypeLabel(notif.type)}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap font-mono">
                            {notif.recipient || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-muted-foreground font-mono">{notif.retries || 0}</span>
                          </td>
                          <td className="px-6 py-4 max-w-md">
                            <p className="text-[10px] text-red-500 font-mono mt-1 break-all bg-red-500/10 p-2 rounded">
                              {notif.errorDetails || "Error desconocido"}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <ResendNotificationButton notificationId={notif.id} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ================= PESTAÑA: HISTORIAL ================= */}
          <TabsContent value="historial" className="outline-none">
            <Card className="bg-card/50 border-border/40 backdrop-blur-sm overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-blue-600/10">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600">Fecha y Hora</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600">Destinatario</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 text-center">Estado</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600">Reintentos</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600">Mensaje</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {notifications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic">
                          No hay registros de notificaciones aún.
                        </td>
                      </tr>
                    ) : (
                      notifications.map((notif) => (
                        <tr key={notif.id} className="hover:bg-blue-600/5 transition-colors group">
                          <td className="px-6 py-4 text-sm font-medium text-foreground whitespace-nowrap">
                            <span className="capitalize">{formatDateTimeMX(notif.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-foreground truncate">{getTypeLabel(notif.type)}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap font-mono">
                            {notif.recipient || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getStatusBadge(notif.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-xs text-muted-foreground font-mono">{notif.retries || 0}</span>
                          </td>
                          <td className="px-6 py-4 max-w-md">
                            <p className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
                              {notif.message}
                            </p>
                            {notif.errorDetails && (
                              <p className="text-[10px] text-red-500 font-mono mt-1 break-all bg-red-500/10 p-1 rounded">
                                {notif.errorDetails}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {notif.status === "failed" && (
                              <ResendNotificationButton notificationId={notif.id} />
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    'ADMIN_NEW_BOOKING': '🔔 Nuevo Pedido',
    'CLIENT_QUOTE': '📄 Cotización',
    'CLIENT_FOLLOWUP': '🔄 Seguimiento',
    'CLIENT_CONFIRMED': '✅ Confirmación',
    'MUSICIAN_GIG': '🎸 Convocatoria',
    'inbound': '📩 Entrante',
  }
  return map[type] || type
}
