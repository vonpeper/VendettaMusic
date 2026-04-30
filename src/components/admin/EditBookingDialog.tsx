"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit3, Loader2, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function EditBookingDialog({ booking }: { booking: any }) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    packageName:   booking.packageName   || "",
    guestCount:    booking.guestCount    || 0,
    venueType:     booking.venueType     || "salon",
    address:       booking.address       || "",
    city:          booking.city          || "",
    requestedDate: booking.requestedDate ? new Date(booking.requestedDate).toISOString().split('T')[0] : "",
    startTime:     booking.startTime     || "21:00",
    endTime:       booking.endTime       || "23:00",
    baseAmount:    booking.baseAmount    || 0,
    depositAmount: booking.depositAmount || 0,
    clientProvidesAudio: booking.clientProvidesAudio || false,
    isPublic:      booking.isPublic      || false,
    mapsLink:      booking.mapsLink      || "",
    bandHours:     booking.bandHours     || 2,
    djHours:       booking.djHours       || 0,
    isDjWithTvs:   booking.isDjWithTvs   || false,
    hasTemplete:   booking.hasTemplete   || false,
    hasPista:      booking.hasPista      || false,
    hasRobot:      booking.hasRobot      || false,
  })

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/booking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, ...formData }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Información actualizada correctamente")
        setOpen(false)
        router.refresh()
      } else {
        toast.error("Error al actualizar: " + (json.error || "Desconocido"))
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={(triggerProps) => (
          <Button 
            {...triggerProps}
            variant="outline" 
            className="w-full border-primary/30 text-primary hover:bg-primary hover:text-foreground transition-all rounded-xl h-11 px-2 gap-1.5 font-black text-xs uppercase tracking-widest overflow-hidden"
          >
            <Edit3 className="w-4 h-4 shrink-0" /> Editar
          </Button>
        )}
      />
      <DialogContent className="bg-card border-border/40 backdrop-blur-xl sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" /> 
            {booking.status === "agendado" ? "Editar Contrato" : "Editar Cotización"} {booking.shortId}
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles del evento. Los cambios se reflejarán en el contrato PDF y la agenda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packageName">Paquete / Servicio</Label>
              <Input 
                id="packageName" 
                value={formData.packageName} 
                onChange={e => setFormData({...formData, packageName: e.target.value})}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueType">Tipo de Lugar</Label>
              <Input 
                id="venueType" 
                value={formData.venueType} 
                onChange={e => setFormData({...formData, venueType: e.target.value})}
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestedDate">Fecha del Evento</Label>
              <Input 
                id="requestedDate" 
                type="date"
                value={formData.requestedDate} 
                onChange={e => setFormData({...formData, requestedDate: e.target.value})}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCount">Invitados Aprox.</Label>
              <Input 
                id="guestCount" 
                type="number"
                value={formData.guestCount} 
                onChange={e => setFormData({...formData, guestCount: parseInt(e.target.value)})}
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora Inicio (ej: 21:00)</Label>
              <Input 
                id="startTime" 
                value={formData.startTime} 
                onChange={e => setFormData({...formData, startTime: e.target.value})}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora Fin (ej: 23:00)</Label>
              <Input 
                id="endTime" 
                value={formData.endTime} 
                onChange={e => setFormData({...formData, endTime: e.target.value})}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ciudad / Municipio</Label>
            <Input 
              id="city" 
              value={formData.city} 
              onChange={e => setFormData({...formData, city: e.target.value})}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección Completa</Label>
            <Input 
              id="address" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="bg-background"
            />
          </div>

          <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/40">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 text-center">Configuración de Show</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bandHours">Horas Banda</Label>
                <Input 
                  id="bandHours" 
                  type="number"
                  value={formData.bandHours} 
                  onChange={e => setFormData({...formData, bandHours: parseInt(e.target.value)})}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="djHours">Horas DJ</Label>
                <Input 
                  id="djHours" 
                  type="number"
                  value={formData.djHours} 
                  onChange={e => setFormData({...formData, djHours: parseInt(e.target.value)})}
                  className="bg-background"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="isDjWithTvs"
                  checked={formData.isDjWithTvs} 
                  onChange={e => setFormData({...formData, isDjWithTvs: e.target.checked})}
                  className="w-4 h-4 accent-primary rounded"
                />
                <Label htmlFor="isDjWithTvs" className="text-xs">DJ con Pantallas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="hasTemplete"
                  checked={formData.hasTemplete} 
                  onChange={e => setFormData({...formData, hasTemplete: e.target.checked})}
                  className="w-4 h-4 accent-primary rounded"
                />
                <Label htmlFor="hasTemplete" className="text-xs">Incluye Templete</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="hasPista"
                  checked={formData.hasPista} 
                  onChange={e => setFormData({...formData, hasPista: e.target.checked})}
                  className="w-4 h-4 accent-primary rounded"
                />
                <Label htmlFor="hasPista" className="text-xs">Incluye Pista LED</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="hasRobot"
                  checked={formData.hasRobot} 
                  onChange={e => setFormData({...formData, hasRobot: e.target.checked})}
                  className="w-4 h-4 accent-primary rounded"
                />
                <Label htmlFor="hasRobot" className="text-xs">Incluye Robot LED</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseAmount">Total del Servicio ($)</Label>
              <Input 
                id="baseAmount" 
                type="number"
                value={formData.baseAmount} 
                onChange={e => setFormData({...formData, baseAmount: parseFloat(e.target.value)})}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Anticipo Pactado ($)</Label>
              <Input 
                id="depositAmount" 
                type="number"
                value={formData.depositAmount} 
                onChange={e => setFormData({...formData, depositAmount: parseFloat(e.target.value)})}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
            <div className="flex items-center space-x-2 group cursor-pointer transition-all">
              <input 
                type="checkbox" 
                id="clientProvidesAudio"
                checked={formData.clientProvidesAudio} 
                onChange={e => setFormData({...formData, clientProvidesAudio: e.target.checked})}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
              <Label htmlFor="clientProvidesAudio" className="cursor-pointer font-bold">Cliente provee audio (Excluir cláusula)</Label>
            </div>

            <div className="flex items-center space-x-2 group cursor-pointer transition-all pt-2 border-t border-primary/10">
              <input 
                type="checkbox" 
                id="isPublic"
                checked={formData.isPublic} 
                onChange={e => setFormData({...formData, isPublic: e.target.checked})}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
              <Label htmlFor="isPublic" className="cursor-pointer font-bold text-primary">Publicar en Agenda (Show Público)</Label>
            </div>

            {formData.isPublic && (
              <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1">
                <Label htmlFor="mapsLink" className="text-[10px] uppercase tracking-wider text-muted-foreground">Link de Google Maps / Ubicación</Label>
                <Input 
                  id="mapsLink" 
                  value={formData.mapsLink} 
                  onChange={e => setFormData({...formData, mapsLink: e.target.value})}
                  placeholder="https://maps.app.goo.gl/..."
                  className="bg-background h-8 text-xs border-primary/20"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-black font-bold rounded-xl px-8 text-white" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
