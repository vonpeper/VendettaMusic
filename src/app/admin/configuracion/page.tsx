export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { saveEvolutionConfigAction, saveGoogleCredentialsAction, saveViaticosConfigAction, saveSocialConfigAction, saveMessageTemplatesAction, saveBankConfigAction, saveEvolutionWebhookSecretAction, saveOGConfigAction, saveContractConfigAction } from "@/actions/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Calendar, Settings, ShieldCheck, Mail, ArrowRight, ExternalLink, Share2, FileText, Plug, Map, Loader2, MessageSquare, Search } from "lucide-react"
import { ConfigFormWrapper } from "@/components/admin/ConfigFormWrapper"
import { SandboxToggle } from "@/components/admin/SandboxToggle"
import { AdminSignatureManager } from "@/components/admin/AdminSignatureManager"
import { OGPreview } from "@/components/admin/OGPreview"
import { EvolutionTestButton } from "@/components/admin/EvolutionTestButton"
import { LogInboundToggle } from "@/components/admin/LogInboundToggle"

export default async function AdminConfiguracionPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin")
  }

  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24 admin-deploy-v3">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 text-primary mb-2">
          <Settings className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest">Ajustes del Sistema</span>
        </div>
        <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight">
          Configuración Maestro
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Administra las conexiones con servicios externos. Estos ajustes afectan las notificaciones automáticas y la sincronización de agenda.
        </p>
      </div>

      <Tabs defaultValue="integraciones" className="w-full">
        <TabsList className="grid grid-cols-2 md:flex md:flex-row w-full bg-card/50 border border-border/40 h-auto p-1.5 mb-8 rounded-2xl gap-2">
          <TabsTrigger value="integraciones" className="rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold bg-transparent">
            <Plug className="w-4 h-4 mr-2" />
            Integraciones
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 font-bold bg-transparent">
            <Search className="w-4 h-4 mr-2" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="redes" className="rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 font-bold bg-transparent">
            <Share2 className="w-4 h-4 mr-2" />
            Redes
          </TabsTrigger>
          <TabsTrigger value="viaticos" className="rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 font-bold bg-transparent">
            <Map className="w-4 h-4 mr-2" />
            Viáticos
          </TabsTrigger>
          <TabsTrigger value="contrato" className="rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-bold bg-transparent">
            <FileText className="w-4 h-4 mr-2" />
            Contrato
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
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${config?.evolutionApiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          {config?.evolutionApiKey ? 'Conectado' : 'Sin Configurar'}
                        </span>
                      </div>
                      {config?.isSandbox && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                          <ShieldCheck className="w-3 h-3 text-indigo-400" />
                          <span className="text-[9px] text-indigo-400 font-black uppercase tracking-tighter">Entorno de Pruebas</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <ConfigFormWrapper action={saveEvolutionConfigAction} className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="url">Evolution API URL</Label>
                    <Input id="url" name="url" defaultValue={config?.evolutionUrl || ""} 
                      placeholder="https://tu-api-evolution.com" className="bg-card border-border/40" />
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
                  <div className="space-y-2">
                    <Label htmlFor="adminWhatsapp">WhatsApp del Administrador</Label>
                    <Input id="adminWhatsapp" name="adminWhatsapp" defaultValue={config?.adminWhatsapp || ""}
                      placeholder="5217221234567 (E.164 sin +)" className="bg-card border-border/40" />
                    <p className="text-[10px] text-muted-foreground">Recibe avisos cuando un cliente confirma un evento desde el funnel.</p>
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-500 font-bold mt-2 text-white">
                    Guardar Configuración WhatsApp
                  </Button>
                </ConfigFormWrapper>
                
                <div className="mt-6 pt-6 border-t border-border/40 space-y-3">
                  <EvolutionTestButton />
                  <LogInboundToggle initialValue={config?.logInboundActive ?? true} />
                  <div className="bg-[#FFEB3B] border-2 border-amber-600 p-4 rounded-xl shadow-lg">
                    <div className="space-y-3">
                      <p className="text-xs text-amber-950 leading-relaxed font-medium">
                        <span className="font-black text-amber-900 text-sm">⚠️ NOTA IMPORTANTE:</span><br/>
                        Si el Manager te pide <strong>identificarte</strong> usa: <code className="bg-white/50 px-2 py-0.5 rounded border border-amber-600/30 font-bold">admin / admin</code>
                      </p>
                      <p className="text-xs text-amber-950 leading-relaxed font-medium">
                        <span className="font-black text-amber-900 text-sm">💡 CONEXIÓN:</span><br/>
                        En <span className="font-bold">Server URL</span> usa la dirección de arriba y la Global API Key.
                      </p>
                    </div>
                  </div>
                  {config?.evolutionUrl && (
                    <a href={`${config.evolutionUrl.replace(/\/$/, "")}/manager`} target="_blank" rel="noopener noreferrer" 
                      className="flex items-center justify-between p-3 rounded-xl bg-primary/10 hover:bg-primary/10 transition-colors group">
                      <span className="text-xs font-bold text-muted-foreground">Abrir Evolution Manager</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </a>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border/40 flex flex-col gap-3">
                  <Link href="/admin/notificaciones" className="w-full">
                    <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10 text-primary group h-10 font-bold text-xs">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ver Historial de Mensajes Enviados
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    ⚠️ Las notificaciones automáticas se enviarán a través de la instancia configurada arriba.
                  </p>
                </div>
              </div>
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
              
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
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

            {/* ================ Datos Bancarios (transferencias) ================ */}
            <section className="space-y-6 mt-8">
              <div className="bg-card border border-border/40 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Cuenta para transferencia</h2>
                    <p className="text-[11px] text-muted-foreground">Mostrada al cliente cuando elige "Transferencia" en el funnel.</p>
                  </div>
                </div>
                <ConfigFormWrapper action={saveBankConfigAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Banco</Label>
                    <Input id="bankName" name="bankName" defaultValue={config?.bankName || ""} className="bg-card border-border/40" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Cuenta</Label>
                    <Input id="bankAccount" name="bankAccount" defaultValue={config?.bankAccount || ""} className="bg-card border-border/40" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bankClabe">CLABE</Label>
                    <Input id="bankClabe" name="bankClabe" defaultValue={config?.bankClabe || ""} className="bg-card border-border/40 font-mono" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bankBeneficiary">Beneficiario</Label>
                    <Input id="bankBeneficiary" name="bankBeneficiary" defaultValue={config?.bankBeneficiary || ""} className="bg-card border-border/40" />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold mt-2 text-white md:col-span-2">
                    Guardar Datos Bancarios
                  </Button>
                </ConfigFormWrapper>
              </div>

              {/* Evolution Webhook Secret */}
              <div className="bg-card border border-border/40 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Webhook Secret (Evolution)</h2>
                    <p className="text-[11px] text-muted-foreground">
                      Secreto compartido para validar webhooks entrantes en
                      <code className="ml-1 px-1 py-0.5 rounded bg-muted/40 text-[10px]">/api/webhooks/evolution</code>.
                    </p>
                  </div>
                </div>
                <ConfigFormWrapper action={saveEvolutionWebhookSecretAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="evolutionWebhookSecret">Webhook Secret</Label>
                    <Input
                      id="evolutionWebhookSecret"
                      name="evolutionWebhookSecret"
                      type="password"
                      defaultValue={config?.evolutionWebhookSecret ? "********" : ""}
                      placeholder="Mínimo 32 caracteres aleatorios"
                      className="bg-card border-border/40 font-mono"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold mt-2 text-white">
                    Guardar Webhook Secret
                  </Button>
                </ConfigFormWrapper>
              </div>
            </section>
            </div>

            {/* Firma Digital Corporativa - Full Width */}
            <section className="space-y-6 pt-12 mt-12 border-t border-border/60">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center relative">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground underline decoration-[#E91E63]">CONTROL DE FIRMA</h2>
                  <p className="text-sm text-muted-foreground font-black text-[#E91E63]">GESTIÓN DE FIRMA ADMINISTRATIVA</p>
                </div>
              </div>
              
              <div className="bg-card border border-border/40 rounded-3xl p-4 sm:p-8 shadow-sm">
                 <AdminSignatureManager initialSignature={config?.adminSignature || null} />
              </div>
            </section>
        </TabsContent>

        <TabsContent value="seo" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <section>
            <div className="bg-card border border-border/40 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">OpenGraph y SEO</h2>
                  <p className="text-sm text-muted-foreground">Personaliza cómo se ve tu sitio cuando compartes el enlace en Facebook, WhatsApp o Instagram.</p>
                </div>
              </div>

              <ConfigFormWrapper action={saveOGConfigAction} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ogTitle">Título OpenGraph (og:title)</Label>
                  <Input id="ogTitle" name="ogTitle" 
                    defaultValue={config?.ogTitle || "Vendetta | Música en Vivo para Eventos"} 
                    placeholder="Ej: Vendetta | El mejor show para tu boda"
                    className="bg-card border-border/40 text-foreground" />
                  <p className="text-[10px] text-muted-foreground">Recomendado: Menos de 60 caracteres.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogDescription">Descripción OpenGraph (og:description)</Label>
                  <Textarea id="ogDescription" name="ogDescription" 
                    defaultValue={config?.ogDescription || "La mejor música en vivo para tu boda o evento corporativo en México. ¡Arma tu show ahora!"} 
                    placeholder="Describe brevemente el servicio..."
                    className="bg-card border-border/40 text-foreground min-h-[100px]" />
                  <p className="text-[10px] text-muted-foreground">Recomendado: Entre 50 y 160 caracteres.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ogImage">URL de Imagen OpenGraph (og:image)</Label>
                  <Input id="ogImage" name="ogImage" 
                    defaultValue={config?.ogImage || "/images/shows/arma-tu-show.jpg"} 
                    placeholder="https://tu-sitio.com/imagen.jpg o ruta interna /images/..."
                    className="bg-card border-border/40 text-foreground font-mono" />
                  <p className="text-[10px] text-muted-foreground italic">
                    * Proporción recomendada 1200x630px. Puedes subir una imagen a la carpeta public y poner aquí la ruta.
                  </p>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-500 font-bold h-12 text-white">
                    Guardar Configuración SEO
                  </Button>
                </div>
              </ConfigFormWrapper>

              <OGPreview 
                ogImage={config?.ogImage} 
                ogTitle={config?.ogTitle} 
                ogDescription={config?.ogDescription} 
              />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="redes" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <section>
            <div className="bg-card border border-border/40 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-indigo-400" />
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
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold h-12 text-white">
                    Guardar Redes Sociales
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
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Map className="w-6 h-6 text-amber-400" />
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
              
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex gap-3">
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

        <TabsContent value="contrato" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <section>
            <div className="bg-card border border-border/40 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Texto Legal del Contrato</h2>
                  <p className="text-sm text-muted-foreground">Este texto aparecerá en el contrato PDF que firman los clientes. Puedes usar variables (próximamente) o texto plano.</p>
                </div>
              </div>

              <ConfigFormWrapper action={saveContractConfigAction} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="contractLegalText">Contenido del Contrato</Label>
                  <Textarea 
                    id="contractLegalText" 
                    name="contractLegalText" 
                    defaultValue={config?.contractLegalText || ""} 
                    placeholder="Escribe aquí las cláusulas y términos legales del contrato..."
                    className="bg-card border-border/40 text-foreground min-h-[400px] font-serif text-base leading-relaxed" 
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Sugerencia: Divide por cláusulas (PRIMERA, SEGUNDA, etc.) para mayor claridad.
                  </p>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 font-bold h-12 text-white text-lg">
                    Guardar Texto Legal
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
