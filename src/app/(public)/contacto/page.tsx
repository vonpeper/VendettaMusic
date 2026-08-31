import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { ContactFormClient } from "@/components/public/ContactFormClient"

export const metadata: Metadata = {
  title: "Contacto | Vendetta Live Music",
  description: "Contrata a Vendetta para tu boda o evento. Mándanos un mensaje, consulta disponibilidad y solicita una propuesta personalizada.",
  alternates: {
    canonical: "/contacto",
  }
}

export default function ContactoPage() {
  const rawWa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
  const cleanWa = rawWa ? rawWa.replace(/\D/g, "") : null

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-black py-24 md:py-32 border-b border-white/10">
        <div className="container px-4 text-center">
          <h1 className="font-heading font-black text-4xl md:text-6xl text-white uppercase tracking-widest mb-6">
            Ponte en <span className="text-primary italic">Contacto</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Estamos listos para hacer de tu evento un momento épico. Escríbenos y nuestro equipo te responderá a la brevedad.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Form */}
            <div className="bg-card border border-white/10 p-8 md:p-12 rounded-2xl shadow-2xl">
              <h2 className="text-2xl font-heading font-bold text-white mb-6">Envíanos un mensaje</h2>
              <ContactFormClient />
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1 pb-12">
              <h2 className="text-3xl font-heading font-bold text-white mb-8">Información Directa</h2>
              
              <div className="space-y-8 mb-12 flex-1">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 p-3 rounded-xl">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Correo Electrónico</h3>
                    <p className="text-muted-foreground mt-1">rock.vendettamx@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 p-3 rounded-xl">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Área de Cobertura</h3>
                    <p className="text-muted-foreground mt-1">Metepec · Toluca · Valle de Bravo · CDMX.<br/>Servicio para todo México.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                <h3 className="font-bold text-white mb-2">¿Quieres cotizar inmediatamente?</h3>
                <p className="text-sm text-gray-400 mb-6">Usa nuestro cotizador interactivo en línea para ver paquetes, opciones y apartar tu fecha en 2 minutos.</p>
                <Link href="/cotizar">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold gap-2">
                    <span>Ir al Cotizador en Línea</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
