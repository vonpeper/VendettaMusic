"use client"
import { useActionState } from "react"
import { createQuoteAction } from "@/actions/quote"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export function QuoteForm({ packages }: { packages: any[] }) {
  const [state, formAction, isPending] = useActionState(createQuoteAction, null)

  return (
    <form action={formAction} className="space-y-8">
      {state && !state.success && (
        <div className="p-4 bg-destructive/20 border border-destructive/50 rounded-lg flex items-center gap-3 text-destructive-foreground text-sm">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p>{state.message}</p>
        </div>
      )}

      {/* Package Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-white mb-4">1. Elige tu paquete base</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <Label 
              key={pkg.id} 
              className="cursor-pointer"
            >
              <Input type="radio" name="packageId" value={pkg.id} className="peer sr-only" required />
              <Card className="peer-checked:border-primary peer-checked:bg-primary/5 transition-colors border-border/50 hover:bg-white/5">
                <CardContent className="p-4">
                  <h3 className="font-bold text-white text-lg">{pkg.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1 mb-2 line-clamp-2">{pkg.description}</p>
                  <div className="font-bold text-primary">Desde ${(pkg.baseCostPerHour * pkg.minDuration).toLocaleString()} MXN</div>
                  <div className="text-xs text-muted-foreground">{pkg.minDuration} horas incluidas</div>
                </CardContent>
              </Card>
            </Label>
          ))}
        </div>
      </div>

      {/* Event Details */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h2 className="text-xl font-heading font-bold text-white mb-4">2. Detalles del Evento</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="eventDate">Fecha del Evento</Label>
            <Input id="eventDate" name="eventDate" type="date" required className="bg-background border-white/10 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ceremonyType">Motivo de festejo</Label>
            <select id="ceremonyType" name="ceremonyType" required className="flex h-10 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white">
              <option value="" disabled selected>Selecciona tu evento</option>
              <option value="Boda">Boda</option>
              <option value="XV Años">XV Años</option>
              <option value="Cumpleaños">Cumpleaños</option>
              <option value="Evento Corporativo">Evento Corporativo</option>
              <option value="Festival">Festival</option>
              <option value="Happening Franquicia">Happening (Franquicia)</option>
              <option value="Happening Bar">Happening (Bar)</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="guests">Número estimado de invitados</Label>
            <Input id="guests" name="guests" type="number" placeholder="Ej. 150" className="bg-background border-white/10 text-white" />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="notes">Información Adicional (Lugar, horarios)</Label>
          <textarea 
            id="notes" 
            name="notes"
            className="flex min-h-[120px] w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
            placeholder="La boda será en Hacienda San José Pignatelli a las 18:00 hrs..."
          />
        </div>
      </div>

      <div className="pt-6">
        <Button size="lg" className="w-full sm:w-auto font-bold" disabled={isPending}>
          {isPending ? "Generando Cotización..." : "Solicitar Cotización de este Evento"}
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Al solicitar la cotización, un coordinador se pondrá en contacto contigo para afinar detalles técnicos y validar disponibilidad. Esta solicitud no representa un compromiso de pago.
        </p>
      </div>
    </form>
  )
}
