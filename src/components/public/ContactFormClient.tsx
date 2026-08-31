"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitContactInquiry } from "@/actions/contact"
import { CheckCircle2, Loader2 } from "lucide-react"

export function ContactFormClient() {
  const [isPending, setIsPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const res = await submitContactInquiry(formData)

    setIsPending(false)
    if (res.success) {
      setSubmitted(true)
    } else {
      setError(res.error || "Ocurrió un error al enviar el formulario")
    }
  }

  if (submitted) {
    return (
      <div className="p-8 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">¡Mensaje Enviado!</h3>
        <p className="text-sm text-gray-300">Hemos recibido tu solicitud. Nuestro equipo revisará los detalles y te responderá a la brevedad.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre Completo</Label>
          <Input id="nombre" name="nombre" required placeholder="ej. Juan Pérez" className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono de Contacto</Label>
          <Input id="telefono" name="telefono" required placeholder="ej. 55 1234 5678" className="bg-background" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input id="email" name="email" type="email" required placeholder="ej. juan@gmail.com" className="bg-background" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha del Evento (Tentativa)</Label>
          <Input id="fecha" name="fecha" type="date" className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Evento</Label>
          <Input id="tipo" name="tipo" placeholder="ej. Boda, Corporativo" className="bg-background" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensaje">Cuéntanos más sobre tu evento</Label>
        <textarea 
          id="mensaje" 
          name="mensaje"
          className="flex min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Lugar del evento, número de invitados, requerimientos especiales..."
        />
      </div>
      
      <Button type="submit" disabled={isPending} size="lg" className="w-full font-bold">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Enviar Solicitud
      </Button>
    </form>
  )
}
