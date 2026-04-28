import { db } from "@/lib/db"
import { saveEvolutionConfigAction, saveGoogleCredentialsAction, saveViaticosConfigAction, saveSocialConfigAction, saveMessageTemplatesAction } from "@/actions/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Calendar, Settings, ShieldCheck, Mail, ArrowRight, ExternalLink, Share2, FileText, Plug, Map, Loader2 } from "lucide-react"
import { ConfigFormWrapper } from "@/components/admin/ConfigFormWrapper"

export default async function AdminConfiguracionPage() {
  const config = await db.globalConfig.findUnique({ where: { id: "singleton" } })

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 text-primary mb-2">
          <Settings className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest">Ajustes del Sistema</span>
        </div>
        <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight">
          Integraciones y Configuración
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Administra las conexiones con servicios externos. Estos ajustes afectan las notificaciones automáticas y la sincronización de agenda.
        </p>
      </div>

      <Tabs defaultValue="integraciones" className="w-full">
        <TabsList className="flex flex-col md:flex-row w-full bg-card border border-border/40 h-auto p-1.5 mb-8 rounded-2xl gap-2">
          <TabsTrigger value="integraciones" className="w-full rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold">
            <Plug className="w-4 h-4" />
            Integraciones
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="w-full rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 font-bold">
            <MessageCircle className="w-4 h-4" />
            Plantillas Wa
          </TabsTrigger>
          <TabsTrigger value="viaticos" className="w-full rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 font-bold">
            <Map className="w-4 h-4" />
            Viáticos
          </TabsTrigger>
          <TabsTrigger value="redes" className="w-full rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 font-bold">
            <Share2 className="w-4 h-4" />
            Redes Sociales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integraciones" className="focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* WhatsApp Section - Evolution API */}
            <section className="space-y-6">
              <div className="bg-card border border-border/40 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">WhatsApp (Evolution API)</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${config?.evolutionApiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        {config?.evolutionApiKey ? 'Configurado' : 'Sin Configurar'}
                      </span>
                    </div>
                  </div>
                </div>

                <ConfigFormWrapper action={saveEvolutionConfigAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Evolution API URL</Label>
                    <Input id="url" name="url" defaultValue={config?.evolutionUrl || ""} 
                      placeholder="http://localhost:8080" className="bg-card border-border/40" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Global API Key</Label>
                    <Input id="apiKey" name="apiKey" type="password" 
                      defaultValue={config?.evolutionApiKey ? "********" : ""}
                      placeholder="Tu API Key de Evolution..." className="bg-card border-border/40" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instance">Nombre de Instancia</Label>
                    <Input id="instance" name="instance" defaultValue={config?.evolutionInstance || "vendetta_admin"}
                      placeholder="vendetta_admin" className="bg-card border-border/40" />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-500 font-bold mt-2 text-white">
                    Guardar Configuración WhatsApp
                  </Button>
                </ConfigFormWrapper>
                
                <div className="mt-6 pt-6 border-t border-border/40 space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <div className="space-y-2">
                      <p className="text-[10px] text-amber-200/70 leading-relaxed italic">
                        <span className="font-bold text-amber-400">⚠️ NOTA IMPORTANTE:</span> Si el Manager te pide <strong>identificarte</strong> nada más abrirlo, usa <code className="bg-card px-1 rounded">admin / admin</code>.
                      </p>
                      <p className="text-[10px] text-amber-200/70 leading-relaxed">
                        <span className="font-bold text-amber-400">💡 Instrucción de Conexión:</span> En el campo <span className="italic font-bold">Server URL</span> escribe <code className="bg-card px-1 rounded text-foreground">http://localhost:8080</code> y usa el API Key de arriba. No pongas "admin" en el campo de URL.
                      </p>
                    </div>
                  </div>
                  <a href="http://localhost:8081" target="_blank" rel="noopener noreferrer" 
                    className="flex items-center justify-between p-3 rounded-xl bg-primary/10 hover:bg-primary/10 transition-colors group">
                    <span className="text-xs font-bold text-muted-foreground">Abrir Evolution Manager (Puerto 8081)</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </a>
                </div>

                <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
                  ⚠️ Las notificaciones automáticas a músicos se enviarán a través de esta instancia local de Docker.
                </p>
              </div>
              
              <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
                 <div className="flex items-center gap-3 text-blue-400 mb-3">
                   <ShieldCheck className="w-5 h-5" />
                   <h3 className="font-bold">Seguridad de Datos</h3>
                 </div>
                 <p className="text-sm text-muted-foreground">
                   Tus credenciales de Evolution API se almacenan de forma local. Nunca expongas tu puerto 8080 a internet sin un proxy inverso y autenticación.
                 </p>
              </div>
            </section>

            {/* Google Calendar Section */}
            <section className="space-y-6">
              <div className="bg-card border border-border/40 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Google Calendar</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${config?.googleRefreshToken ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`} />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        {config?.googleRefreshToken ? 'Sincronización Activa' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                </div>

                <ConfigFormWrapper action={saveGoogleCredentialsAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input id="clientId" name="clientId" defaultValue={config?.googleClientId || ""} 
                      className="bg-card border-border/40" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input id="clientSecret" name="clientSecret" type="password"
                      defaultValue={config?.googleClientSecret ? "********" : ""} 
                      className="bg-card border-border/40" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calendarId">Google Calendar ID (Email)</Label>
                    <Input id="calendarId" name="calendarId" defaultValue={config?.googleCalendarId || ""}
                      placeholder="ejemplo@gmail.com" className="bg-card border-border/40" />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold mt-2 text-white">
                    Guardar Credenciales Google
                  </Button>
                </ConfigFormWrapper>

                <div className="mt-8 pt-6 border-t border-border/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">Estado del Vínculo</h4>
                    {config?.googleRefreshToken ? (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 font-bold uppercase">Vinculado</span>
                    ) : (
                      <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 font-bold uppercase">No Vinculado</span>
                    )}
                  </div>
                  
                  <Button variant="outline" className="w-full border-blue-500/30 hover:bg-blue-500/10 text-blue-400 group h-12" disabled={!config?.googleClientId}>
                    Vincular Cuenta de Google
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  {!config?.googleClientId && (
                    <p className="text-[10px] text-center text-muted-foreground italic">
                      * Primero debes guardar tus credenciales de Client ID y Secreto para habilitar el vínculo.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                 <div className="flex items-center gap-3 text-primary mb-3">
                   <Mail className="w-5 h-5" />
                   <h3 className="font-bold font-heading">¿Necesitas ayuda?</h3>
                 </div>
                 <p className="text-sm text-muted-foreground mb-4">
                   He preparado una guía paso a paso para ayudarte a configurar tu consola de Google Cloud y obtener las llaves.
                 </p>
                 <Button variant="link" className="p-0 h-auto text-primary font-bold hover:no-underline underline-offset-4 decoration-2">
                   Ver guía de configuración pública →
                 </Button>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <section>
            <div className="bg-card border border-border/40 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Plantillas de Mensajes (WhatsApp)</h2>
                  <p className="text-sm text-muted-foreground">Configura los textos que se envían automáticamente a clientes y músicos.</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-card border border-border/40 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Variables Disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{clientName}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{date}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{ceremony}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{location}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{time}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{package}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{total}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{notes}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{confirmLink}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{followUpCount}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{folio}}`}</code>
                  <code className="text-[11px] bg-primary/20 px-2 py-1 rounded text-primary font-bold">{`{{bookingLink}}`}</code>
                </div>
              </div>

              <ConfigFormWrapper action={saveMessageTemplatesAction} className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="msgTemplateGig" className="text-foreground font-bold text-lg">Músicos: Nuevo Gig (Convocatoria)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Mensaje que reciben los músicos cuando se crea un nuevo evento.</p>
                  <Textarea id="msgTemplateGig" name="msgTemplateGig" rows={8}
                    defaultValue={(config as any)?.msgTemplateGig || `🎸 *NUEVO GIG — VENDETTA* 🎸\n\n📅 *Fecha:* {{date}}\n👤 *Cliente:* {{clientName}}\n🎉 *Tipo de evento:* {{ceremony}}\n📍 *Ubicación:* {{location}}\n⏰ *Horario:* {{time}}\n📦 *Paquete:* {{package}}\n\n📝 *Notas:* {{notes}}\n\n{{confirmLink}}\n— Administración Vendetta`} 
                    className="bg-card border-border/40 text-foreground font-mono text-sm" />
                </div>

                <div className="space-y-2 pt-4 border-t border-border/40">
                  <Label htmlFor="msgTemplateQuote" className="text-foreground font-bold text-lg">Cliente: Envío de Cotización</Label>
                  <p className="text-xs text-muted-foreground mb-2">Mensaje enviado al cliente junto con el PDF de su cotización.</p>
                  <Textarea id="msgTemplateQuote" name="msgTemplateQuote" rows={6}
                    defaultValue={(config as any)?.msgTemplateQuote || `Hola {{clientName}}, somos *Vendetta Live Music* 🎸.\n\nTe compartimos la cotización para tu evento el próximo *{{date}}*.\nEl total de tu inversión sería de *{{total}}* MXN por el paquete *{{package}}*.\n\nQuedamos a tus órdenes para cualquier duda o para agendar una llamada y platicar los detalles.`} 
                    className="bg-card border-border/40 text-foreground font-mono text-sm" />
                </div>

                <div className="space-y-2 pt-4 border-t border-border/40">
                  <Label htmlFor="msgTemplateEventClose" className="text-foreground font-bold text-lg">Cliente: Confirmación de Evento (Cierre)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Mensaje enviado cuando el cliente hace su anticipo y cerramos la fecha.</p>
                  <Textarea id="msgTemplateEventClose" name="msgTemplateEventClose" rows={6}
                    defaultValue={(config as any)?.msgTemplateEventClose || `¡Felicidades {{clientName}}! 🎉\n\nHemos recibido tu anticipo y tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.\n\nFolio de seguimiento: *{{folio}}*\nConsulta el estatus y descarga tu contrato aquí:\n{{bookingLink}}\n\n¡Gracias por confiar en *Vendetta*! 🎸`} 
                    className="bg-card border-border/40 text-foreground font-mono text-sm" />
                </div>

                <div className="space-y-2 pt-4 border-t border-border/40">
                  <Label htmlFor="msgTemplateFollowUp" className="text-foreground font-bold text-lg">Cliente: Seguimiento de Pipeline</Label>
                  <p className="text-xs text-muted-foreground mb-2">Mensaje enviado al presionar el botón de "Seguimiento" en el panel de ventas.</p>
                  <Textarea id="msgTemplateFollowUp" name="msgTemplateFollowUp" rows={6}
                    defaultValue={(config as any)?.msgTemplateFollowUp || `Hola {{clientName}}, te escribo de *Vendetta Music* 🎸 para dar seguimiento a tu cotización. ¿Pudiste revisarla? Seguimos a tus órdenes para apartar la fecha.`} 
                    className="bg-card border-border/40 text-foreground font-mono text-sm" />
                </div>

                <div className="mt-4">
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-500 font-bold h-12 text-white">
                    Guardar Plantillas
                  </Button>
                </div>
              </ConfigFormWrapper>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="viaticos" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <section>
            <div className="bg-card border border-border/40 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Map className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Tabulador de Viáticos Fijos</h2>
                  <p className="text-sm text-muted-foreground">Define las tarifas planas para eventos foráneos según la zona de impacto.</p>
                </div>
              </div>

              <ConfigFormWrapper action={saveViaticosConfigAction} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="zona2Rate" className="text-foreground">Zona 2 (CDMX, Valle de Bravo, Ixtapan, Tenancingo)</Label>
                  <Input id="zona2Rate" name="zona2Rate" type="number" step="100" 
                    defaultValue={(config as any)?.zona2Rate || 1500} 
                    className="bg-card border-border/40 text-foreground font-mono text-lg h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zona3Rate" className="text-foreground">Zona 3 (Querétaro, Cuernavaca, Puebla, Pachuca)</Label>
                  <Input id="zona3Rate" name="zona3Rate" type="number" step="100" 
                    defaultValue={(config as any)?.zona3Rate || 3000} 
                    className="bg-card border-border/40 text-foreground font-mono text-lg h-12" />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold h-12 text-lg text-white">
                    Actualizar Tarifas
                  </Button>
                </div>
              </ConfigFormWrapper>
              
              <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-3">
                 <Settings className="w-5 h-5 text-primary shrink-0" />
                 <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                   <p>
                     <strong>¿Cómo funciona?</strong> El cotizador asignará automáticamente:
                   </p>
                   <ul className="list-disc pl-4 space-y-1">
                     <li><strong>Zona 1 (Toluca / Metepec / Alrededores):</strong> $0 MXN.</li>
                     <li><strong>Zona 2 (Media Distancia):</strong> El costo establecido arriba.</li>
                     <li><strong>Zona 3 (Larga Distancia):</strong> El costo establecido arriba.</li>
                     <li><strong>Zona 4 (Resto de México):</strong> No dará costo automático. Dirá que se cotizará por separado.</li>
                   </ul>
                 </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="redes" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <section>
            <div className="bg-card border border-border/40 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Redes Sociales</h2>
                  <p className="text-sm text-muted-foreground">Configura los enlaces públicos que se mostrarán en el pie de página del sitio web.</p>
                </div>
              </div>

              <ConfigFormWrapper action={saveSocialConfigAction} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook URL</Label>
                  <Input id="facebookUrl" name="facebookUrl" type="url" 
                    defaultValue={(config as any)?.facebookUrl || "https://www.facebook.com/vendettamusica"} 
                    className="bg-card border-border/40 text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram URL</Label>
                  <Input id="instagramUrl" name="instagramUrl" type="url" 
                    defaultValue={(config as any)?.instagramUrl || "https://www.instagram.com/vendettamusica"} 
                    className="bg-card border-border/40 text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktokUrl">TikTok URL</Label>
                  <Input id="tiktokUrl" name="tiktokUrl" type="url" 
                    defaultValue={(config as any)?.tiktokUrl || "https://www.tiktok.com/@vendetta.rock"} 
                    className="bg-card border-border/40 text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappUrl">WhatsApp Link (wa.link)</Label>
                  <Input id="whatsappUrl" name="whatsappUrl" type="url" 
                    defaultValue={(config as any)?.whatsappUrl || "https://wa.link/6ysnkx"} 
                    className="bg-card border-border/40 text-foreground" />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-500 font-bold h-12 text-white">
                    Guardar Redes Sociales
                  </Button>
                </div>
              </ConfigFormWrapper>
            </div>
          </section>
        </TabsContent>
      </Tabs>

    </div>
  )
}
