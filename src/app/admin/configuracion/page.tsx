import { db } from "@/lib/db"
import { saveEvolutionConfigAction, saveGoogleCredentialsAction } from "@/actions/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageCircle, Calendar, Settings, ShieldCheck, Mail, ArrowRight, ExternalLink } from "lucide-react"

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
        <h1 className="text-4xl font-heading font-bold text-white tracking-tight">
          Integraciones y Configuración
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Administra las conexiones con servicios externos. Estos ajustes afectan las notificaciones automáticas y la sincronización de agenda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* WhatsApp Section - Evolution API */}
        <section className="space-y-6">
          <div className="bg-card/30 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">WhatsApp (Evolution API)</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${config?.evolutionApiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    {config?.evolutionApiKey ? 'Configurado' : 'Sin Configurar'}
                  </span>
                </div>
              </div>
            </div>

            <form action={saveEvolutionConfigAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Evolution API URL</Label>
                <Input id="url" name="url" defaultValue={config?.evolutionUrl || ""} 
                  placeholder="http://localhost:8080" className="bg-black/50 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">Global API Key</Label>
                <Input id="apiKey" name="apiKey" type="password" 
                  defaultValue={config?.evolutionApiKey ? "********" : ""}
                  placeholder="Tu API Key de Evolution..." className="bg-black/50 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instance">Nombre de Instancia</Label>
                <Input id="instance" name="instance" defaultValue={config?.evolutionInstance || "vendetta_admin"}
                  placeholder="vendetta_admin" className="bg-black/50 border-white/10" />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-500 font-bold mt-2">
                Guardar Configuración WhatsApp
              </Button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                <div className="space-y-2">
                  <p className="text-[10px] text-amber-200/70 leading-relaxed italic">
                    <span className="font-bold text-amber-400">⚠️ NOTA IMPORTANTE:</span> Si el Manager te pide <strong>identificarte</strong> nada más abrirlo, usa <code className="bg-black/40 px-1 rounded">admin / admin</code>.
                  </p>
                  <p className="text-[10px] text-amber-200/70 leading-relaxed">
                    <span className="font-bold text-amber-400">💡 Instrucción de Conexión:</span> En el campo <span className="italic font-bold">Server URL</span> escribe <code className="bg-black/40 px-1 rounded text-white">http://localhost:8080</code> y usa el API Key de arriba. No pongas "admin" en el campo de URL.
                  </p>
                </div>
              </div>
              <a href="http://localhost:8081" target="_blank" rel="noopener noreferrer" 
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                <span className="text-xs font-bold text-gray-300">Abrir Evolution Manager (Puerto 8081)</span>
                <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
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
             <p className="text-sm text-gray-400">
               Tus credenciales de Evolution API se almacenan de forma local. Nunca expongas tu puerto 8080 a internet sin un proxy inverso y autenticación.
             </p>
          </div>
        </section>

        {/* Google Calendar Section */}
        <section className="space-y-6">
          <div className="bg-card/30 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Google Calendar</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${config?.googleRefreshToken ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    {config?.googleRefreshToken ? 'Sincronización Activa' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>

            <form action={saveGoogleCredentialsAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input id="clientId" name="clientId" defaultValue={config?.googleClientId || ""}
                  placeholder="...apps.googleusercontent.com" className="bg-black/50 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input id="clientSecret" name="clientSecret" type="password" 
                  defaultValue={config?.googleClientSecret ? "********" : ""}
                  placeholder="Introducir secreto..." className="bg-black/50 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendarId">Calendar ID (Opcional)</Label>
                <Input id="calendarId" name="calendarId" defaultValue={config?.googleCalendarId || "primary"}
                  placeholder="primary o email@gmail.com" className="bg-black/50 border-white/10" />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-bold mt-2">
                Guardar Credenciales Google
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Estado del Vínculo</h4>
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
             <p className="text-sm text-gray-400 mb-4">
               He preparado una guía paso a paso para ayudarte a configurar tu consola de Google Cloud y obtener las llaves.
             </p>
             <Button variant="link" className="p-0 h-auto text-primary font-bold hover:no-underline underline-offset-4 decoration-2">
               Ver guía de configuración pública →
             </Button>
          </div>
        </section>
      </div>

    </div>
  )
}
