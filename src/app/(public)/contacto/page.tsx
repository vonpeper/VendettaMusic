import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Phone, Mail } from "lucide-react"

export default function ContactoPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-black py-24 md:py-32 border-b border-white/10">
        <div className="container px-4 text-center">
          <h1 className="font-heading font-black text-4xl md:text-6xl text-white uppercase tracking-widest mb-6">
            Ponte en <span className="text-primary italic">Contacto</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Estamos listos para hacer de tu evento un momento épico. Escríbenos y nuestro equipo te responderá de inmediato.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Form */}
            <div className="bg-card border border-white/10 p-8 md:p-12 rounded-2xl shadow-2xl">
              <h2 className="text-2xl font-heading font-bold text-white mb-6">Envíanos un mensaje</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input id="nombre" placeholder="ej. Juan Pérez" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
                    <Input id="telefono" placeholder="ej. 55 1234 5678" className="bg-background" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" placeholder="ej. juan@gmail.com" className="bg-background" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha del Evento (Tentativa)</Label>
                    <Input id="fecha" type="date" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Evento</Label>
                    <Input id="tipo" placeholder="ej. Boda, Corporativo" className="bg-background" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensaje">Cuéntanos más sobre tu evento</Label>
                  <textarea 
                    id="mensaje" 
                    className="flex min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Lugar del evento, número de invitados, requerimientos especiales..."
                  />
                </div>
                
                <Button size="lg" className="w-full font-bold">Enviar Solicitud</Button>
              </form>
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1 pb-12">
              <h2 className="text-3xl font-heading font-bold text-white mb-8">Información Directa</h2>
              
              <div className="space-y-8 mb-12 flex-1">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 p-3 rounded-xl">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Teléfono / WhatsApp</h3>
                    <p className="text-muted-foreground mt-1">+52 (55) 1234 - 5678</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 p-3 rounded-xl">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Correo Electrónico</h3>
                    <p className="text-muted-foreground mt-1">contacto@vendettalive.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 p-3 rounded-xl">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Ubicación / Oficinas</h3>
                    <p className="text-muted-foreground mt-1">Av. Principal 123, Ciudad de México.<br/>Atención previa cita.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                <h3 className="font-bold text-white mb-2">¿Prefieres un trato más directo?</h3>
                <p className="text-sm text-gray-400 mb-6">Mándanos un WhatsApp ahora mismo y te compartimos disponibilidad en tiempo real.</p>
                <Button className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white">Chatear por WhatsApp</Button>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
