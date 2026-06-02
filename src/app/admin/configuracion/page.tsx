export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { saveEvolutionConfigAction, saveGoogleCredentialsAction, saveViaticosConfigAction, saveSocialConfigAction, saveMessageTemplatesAction, saveBankConfigAction, saveEvolutionWebhookSecretAction, saveOGConfigAction, saveContractConfigAction, savePaymentConfigAction } from "@/actions/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Calendar, Settings, ShieldCheck, Mail, ArrowRight, ExternalLink, Share2, FileText, Plug, Map, Loader2, MessageSquare, Search, CreditCard, Lock } from "lucide-react"
import { ConfigFormWrapper } from "@/components/admin/ConfigFormWrapper"
import { SandboxToggle } from "@/components/admin/SandboxToggle"
import { AdminSignatureManager } from "@/components/admin/AdminSignatureManager"
import { OGPreview } from "@/components/admin/OGPreview"
import { EvolutionTestButton } from "@/components/admin/EvolutionTestButton"
import { LogInboundToggle } from "@/components/admin/LogInboundToggle"

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminConfiguracionPage({ searchParams }: Props) {
  const params = await searchParams
  const defaultTab = params.tab || "integraciones"

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

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex flex-row overflow-x-auto hide-scrollbar snap-x snap-mandatory w-full bg-card/50 border border-border/40 h-auto p-1.5 mb-8 rounded-2xl gap-2 justify-start md:justify-center">
          <TabsTrigger value="integraciones" className="shrink-0 whitespace-nowrap snap-center rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold bg-transparent">
            <Plug className="w-4 h-4 mr-2" />
            Integraciones
          </TabsTrigger>
          <TabsTrigger value="seo" className="shrink-0 whitespace-nowrap snap-center rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 font-bold bg-transparent">
            <Search className="w-4 h-4 mr-2" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="redes" className="shrink-0 whitespace-nowrap snap-center rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 font-bold bg-transparent">
            <Share2 className="w-4 h-4 mr-2" />
            Redes
          </TabsTrigger>
          <TabsTrigger value="viaticos" className="shrink-0 whitespace-nowrap snap-center rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 font-bold bg-transparent">
            <Map className="w-4 h-4 mr-2" />
            Viáticos
          </TabsTrigger>
          <TabsTrigger value="contrato" className="shrink-0 whitespace-nowrap snap-center rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-bold bg-transparent">
            <FileText className="w-4 h-4 mr-2" />
            Contrato
          </TabsTrigger>
          <TabsTrigger value="pagos" className="shrink-0 whitespace-nowrap snap-center rounded-xl py-3 !border-transparent !shadow-none data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 font-bold bg-transparent">
            <CreditCard className="w-4 h-4 mr-2" />
            Pagos
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
                  <div className="bg-slate-900/80 border border-blue-500/30 p-5 rounded-2xl shadow-xl backdrop-blur-md">
                    <div className="space-y-4">
                      <p className="text-xs text-slate-200 leading-relaxed">
                        <span className="font-black text-blue-400 text-[10px] uppercase tracking-widest block mb-1.5">Acceso al Manager</span>
                        Si el sistema solicita <strong className="text-white underline decoration-blue-500/50">credenciales</strong>, utiliza los valores por defecto: <code className="bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/20 font-black text-blue-200 ml-1">admin / admin</code>
                      </p>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        <span className="font-black text-blue-400 text-[10px] uppercase tracking-widest block mb-1.5">Configuración de Conexión</span>
                        En el campo <span className="font-bold text-white">Server URL</span> debes ingresar la URL de la API configurada arriba junto con la <span className="text-blue-300 italic">Global API Key</span>.
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
              
              <div className="bg-slate-900/60 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-md">
                 <div className="flex items-center gap-3 text-blue-400 mb-3">
                   <ShieldCheck className="w-5 h-5" />
                   <h3 className="font-bold text-white">Seguridad de Datos</h3>
                 </div>
                 <p className="text-sm text-slate-300 leading-relaxed">
                   Tus credenciales de Evolution API se almacenan de forma local y segura. Nunca expongas tu puerto 8080 a internet sin un proxy inverso y autenticación debidamente configurada.
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
              
              <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-md shadow-xl">
                 <div className="flex items-center gap-3 text-blue-400 mb-4">
                   <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4" />
                   </div>
                   <h3 className="font-black text-white text-sm uppercase tracking-widest">Guía de Configuración Google</h3>
                 </div>
                 <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                   Para habilitar la sincronización con tu calendario, es necesario configurar un proyecto en la consola de Google Cloud. He preparado una documentación detallada para guiarte en este proceso.
                 </p>
                 <Button variant="link" className="p-0 h-auto text-blue-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-300 hover:no-underline underline-offset-4 decoration-2 decoration-blue-500/30">
                   CONSULTAR GUÍA DE INTEGRACIÓN →
                 </Button>
              </div>
            </section>


            <section className="space-y-6 mt-8">
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
                  <h2 className="text-2xl font-heading font-bold text-foreground underline decoration-primary">CONTROL DE FIRMA</h2>
                  <p className="text-sm text-muted-foreground font-black text-primary">GESTIÓN DE FIRMA ADMINISTRATIVA</p>
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
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-400" />
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
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-bold h-12 text-white">
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
                  <p className="text-sm text-muted-foreground">Define las tarifas planas y las zonas de cobertura (ciudades/estados) para eventos foráneos.</p>
                </div>
              </div>

              <ConfigFormWrapper action={saveViaticosConfigAction} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* CARD ZONA 2 */}
                  <div className="bg-slate-900/40 border border-border/30 rounded-2xl p-6 space-y-5 backdrop-blur-sm hover:border-amber-500/20 transition-all duration-300">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-sm">
                        Z2
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-foreground text-lg">Zona 2 (Media Distancia)</h3>
                        <p className="text-xs text-muted-foreground">Destinos con tarifas intermedias.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zona2Rate" className="text-foreground text-sm font-bold">Monto de la Tarifa ($ MXN)</Label>
                      <Input id="zona2Rate" name="zona2Rate" type="number" step="100" 
                        defaultValue={(config as any)?.zona2Rate || 1500} 
                        className="bg-card border-border/40 text-foreground font-mono text-lg h-12" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zona2Cities" className="text-foreground text-sm font-bold">Ciudades y Municipios Incluidos</Label>
                      <Textarea id="zona2Cities" name="zona2Cities" rows={4}
                        defaultValue={(config as any)?.zona2Cities ?? "valle de bravo, avandaro, malinalco, ixtapan de la sal, tonatico, ciudad de mexico, cdmx, df, distrito federal, naucalpan, tlalnepantla, huixquilucan, interlomas, santa fe, cuajimalpa, alvaro obregon, coyoacan, tlalpan, tepotzotlan, atizapan, izcalli"} 
                        placeholder="Separa cada ciudad o municipio con comas. Ej: valle de bravo, cdmx, malinalco..."
                        className="bg-card border-border/40 text-foreground font-sans text-sm min-h-[100px] leading-relaxed resize-y focus:border-amber-400" />
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Cualquier coincidencia parcial en nombre de municipio o estado activará esta tarifa. Separar exclusivamente por comas.
                      </p>
                    </div>
                  </div>

                  {/* CARD ZONA 3 */}
                  <div className="bg-slate-900/40 border border-border/30 rounded-2xl p-6 space-y-5 backdrop-blur-sm hover:border-amber-500/20 transition-all duration-300">
                    <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-sm">
                        Z3
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-foreground text-lg">Zona 3 (Larga Distancia)</h3>
                        <p className="text-xs text-muted-foreground">Destinos lejanos o estados colindantes.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zona3Rate" className="text-foreground text-sm font-bold">Monto de la Tarifa ($ MXN)</Label>
                      <Input id="zona3Rate" name="zona3Rate" type="number" step="100" 
                        defaultValue={(config as any)?.zona3Rate || 3000} 
                        className="bg-card border-border/40 text-foreground font-mono text-lg h-12" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zona3Cities" className="text-foreground text-sm font-bold">Ciudades y Estados Incluidos</Label>
                      <Textarea id="zona3Cities" name="zona3Cities" rows={4}
                        defaultValue={(config as any)?.zona3Cities ?? "cuernavaca, tepoztlan, jiutepec, morelos, queretaro, san juan del rio, juriquilla, puebla, cholula, atlixco, pachuca, hidalgo, tlaxcala"} 
                        placeholder="Separa cada ciudad o estado con comas. Ej: queretaro, puebla, cuernavaca..."
                        className="bg-card border-border/40 text-foreground font-sans text-sm min-h-[100px] leading-relaxed resize-y focus:border-amber-400" />
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Cualquier coincidencia parcial en nombre de ciudad o estado activará esta tarifa. Separar exclusivamente por comas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold h-12 text-lg text-white rounded-xl transition-all">
                    Actualizar Tarifas y Zonas
                  </Button>
                </div>
              </ConfigFormWrapper>
              
              <div className="mt-8 p-6 bg-slate-900/80 border border-blue-500/30 rounded-2xl flex gap-5 backdrop-blur-md shadow-xl">
                 <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5 text-blue-400" />
                 </div>
                 <div className="text-xs text-slate-300 leading-relaxed space-y-4 text-left">
                   <p className="text-white font-black text-[10px] uppercase tracking-widest">Lógica de Cálculo de Viáticos</p>
                   <ul className="space-y-2.5">
                     <li className="flex items-start gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                       <span className="text-[11px]"><strong className="text-white font-bold">Zona 1 (Toluca / Metepec):</strong> Tarifa base sin cargos adicionales ($0 MXN). Municipios predeterminados del Valle de Toluca no cambian por viáticos fijos.</span>
                     </li>
                     <li className="flex items-start gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                       <span className="text-[11px]"><strong className="text-white font-bold">Coincidencias Dinámicas:</strong> Al cotizar o reservar, si el municipio o estado coincide exactamente con el texto de tu lista de Zona 2 o Zona 3 (sin acentos, en minúsculas), se aplicará la tarifa correspondiente.</span>
                     </li>
                     <li className="flex items-start gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                       <span className="text-[11px]"><strong className="text-white font-bold">Resto de México (Zona 4):</strong> Si un municipio no coincide con ninguna lista, el cotizador indicará "Cotización Manual" para que un agente cotice la logística exacta en la llamada.</span>
                     </li>
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
                <Tabs defaultValue="eventos" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="eventos">Eventos Privados</TabsTrigger>
                    <TabsTrigger value="bares">Bares / Foros</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="eventos" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractLegalText">Contrato de Eventos Privados</Label>
                      <Textarea 
                        id="contractLegalText" 
                        name="contractLegalText" 
                        defaultValue={config?.contractLegalText || ""} 
                        placeholder="Escribe aquí las cláusulas y términos legales del contrato para eventos privados (bodas, xv años, corporativos)..."
                        className="bg-card border-border/40 text-foreground min-h-[400px] font-serif text-base leading-relaxed" 
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Sugerencia: Divide por cláusulas (PRIMERA, SEGUNDA, etc.) para mayor claridad.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="bares" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractBarLegalText">Contrato de Bares / Foros</Label>
                      <Textarea 
                        id="contractBarLegalText" 
                        name="contractBarLegalText" 
                        defaultValue={(config as any)?.contractBarLegalText || ""} 
                        placeholder="Escribe aquí las cláusulas especiales para presentaciones en bares, restaurantes o foros públicos..."
                        className="bg-card border-border/40 text-foreground min-h-[400px] font-serif text-base leading-relaxed" 
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Este contrato se mostrará si el tipo de evento es "Bar".
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                  
                  <div className="mt-6 p-6 rounded-2xl bg-slate-900/80 border border-blue-500/30 backdrop-blur-md shadow-xl">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-5 text-center">Variables del Sistema para el Contrato</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { tag: "{{cliente}}", label: "Nombre completo del cliente" },
                        { tag: "{{fecha}}", label: "Fecha programada del evento" },
                        { tag: "{{horario}}", label: "Hora exacta de inicio del show" },
                        { tag: "{{monto}}", label: "Monto total del servicio (MXN)" },
                        { tag: "{{paquete}}", label: "Nombre del paquete seleccionado" },
                        { tag: "{{ubicación}}", label: "Dirección física del evento" },
                      ].map((v) => (
                        <div key={v.tag} className="flex flex-col gap-2 bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 hover:bg-blue-500/10 transition-colors">
                          <code className="text-[11px] font-black text-white bg-blue-600 px-2.5 py-1 rounded shadow-sm w-fit mx-auto">{v.tag}</code>
                          <p className="text-[10px] text-slate-300 font-bold text-center uppercase tracking-tighter opacity-80">{v.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 font-bold h-12 text-white text-lg">
                    Guardar Textos Legales
                  </Button>
                </div>
              </ConfigFormWrapper>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="pagos" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-6">
              <div className="bg-card border border-border/40 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-foreground">Pasarelas de Pago</h2>
                    <p className="text-sm text-muted-foreground">Activa o desactiva los métodos de pago disponibles en el funnel.</p>
                  </div>
                </div>

                <ConfigFormWrapper action={savePaymentConfigAction} className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4">Métodos Activos</h3>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Mercado Pago</p>
                          <p className="text-[10px] text-muted-foreground">Tarjetas y efectivo (México)</p>
                        </div>
                      </div>
                      <input type="checkbox" name="payMercadoPagoActive" defaultChecked={config?.payMercadoPagoActive ?? true} className="w-5 h-5 accent-blue-500" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <Mail className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Depósito / Transferencia</p>
                          <p className="text-[10px] text-muted-foreground">Pago manual vía CLABE</p>
                        </div>
                      </div>
                      <input type="checkbox" name="payTransferenciaActive" defaultChecked={config?.payTransferenciaActive ?? true} className="w-5 h-5 accent-emerald-500" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                          <Settings className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Personal / Efectivo</p>
                          <p className="text-[10px] text-muted-foreground">Acuerdo directo con agente</p>
                        </div>
                      </div>
                      <input type="checkbox" name="payPersonalActive" defaultChecked={config?.payPersonalActive ?? true} className="w-5 h-5 accent-amber-500" />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                          <Lock className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Stripe</p>
                          <p className="text-[10px] text-muted-foreground">Pago global con tarjeta</p>
                        </div>
                      </div>
                      <input type="checkbox" name="payStripeActive" defaultChecked={config?.payStripeActive ?? false} className="w-5 h-5 accent-indigo-500" />
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-border/40">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Configuración Stripe</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Clave Pública (Publishable Key)</Label>
                        <Input name="stripePublicKey" defaultValue={config?.stripePublicKey || ""} placeholder="pk_live_..." className="bg-card border-border/40 font-mono text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label>Clave Secreta (Secret Key)</Label>
                        <Input name="stripeSecretKey" type="password" defaultValue={config?.stripeSecretKey ? "********" : ""} placeholder="sk_live_..." className="bg-card border-border/40 font-mono text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label>Webhook Secret</Label>
                        <Input name="stripeWebhookSecret" type="password" defaultValue={config?.stripeWebhookSecret ? "********" : ""} placeholder="whsec_..." className="bg-card border-border/40 font-mono text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-border/40">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Configuración Mercado Pago</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Access Token</Label>
                        <Input name="mercadoPagoAccessToken" type="password" defaultValue={config?.mercadoPagoAccessToken ? "********" : ""} placeholder="APP_USR-..." className="bg-card border-border/40 font-mono text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label>Public Key</Label>
                        <Input name="mercadoPagoPublicKey" defaultValue={config?.mercadoPagoPublicKey || ""} placeholder="APP_USR-..." className="bg-card border-border/40 font-mono text-xs" />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold h-12 text-white">
                    Guardar Configuración de Pagos
                  </Button>
                </ConfigFormWrapper>
              </div>
            </section>

            <section className="space-y-6">
              <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-md shadow-xl">
                 <div className="flex items-center gap-3 text-blue-400 mb-4">
                   <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                   </div>
                   <h3 className="font-black text-white text-sm uppercase tracking-widest">Seguridad en Pagos</h3>
                 </div>
                 <p className="text-xs text-slate-300 leading-relaxed mb-4">
                   Las claves de API se encriptan antes de guardarse en la base de datos. Asegúrate de usar claves <strong className="text-white">Live</strong> para producción y claves <strong className="text-white">Test</strong> solo si el modo Sandbox está activo.
                 </p>
                 <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                    <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-2">Webhooks requeridos:</p>
                    <ul className="space-y-2">
                      <li className="text-[10px] text-slate-400 font-mono break-all">
                        Stripe: <span className="text-white">/api/webhooks/stripe</span>
                      </li>
                      <li className="text-[10px] text-slate-400 font-mono break-all">
                        MP: <span className="text-white">/api/webhooks/mercadopago</span>
                      </li>
                    </ul>
                 </div>
              </div>

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
            </section>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
