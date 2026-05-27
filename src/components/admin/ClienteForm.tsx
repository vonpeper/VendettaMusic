"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClienteAction, updateClienteAction } from "@/actions/clientes"
import { X, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useEffect } from "react"

const ESTADOS_MX = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas",
  "Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México",
  "Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit",
  "Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí",
  "Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"
]

interface ClienteFormProps {
  onClose: () => void
  editing?: {
    profileId: string
    name: string
    email: string

    whatsapp: string | null
    state: string | null
    city: string | null
    type: string | null
    company: string | null
    rfc: string | null
    notes: string | null
  }
}

export function ClienteForm({ onClose, editing }: ClienteFormProps) {
  const isEditing = !!editing
  const action = isEditing ? updateClienteAction : createClienteAction
  const [state, formAction, isPending] = useActionState(action, null) as [any, any, boolean]
  const [clientType, setClientType] = useState(editing?.type || "private")

  useEffect(() => {
    if (state && !state.success) {
      toast.error(state.message || "Error al procesar la solicitud")
    }
  }, [state])

  if (state?.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-card backdrop-blur-sm">
        <div className="bg-card border border-green-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <CheckCircle2 className="w-14 h-14 text-green-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">{state.message}</h3>
          <Button onClick={onClose} className="mt-4 w-full text-white">Cerrar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-card backdrop-blur-sm p-4">
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/40">
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {isEditing ? "Actualiza los datos del cliente." : "Completa el registro del nuevo cliente."}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-primary/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {state && !state.success && (
          <div className="mx-6 mt-4 p-3 bg-destructive/20 border border-destructive/40 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <form action={formAction} className="p-6 space-y-4">
          {isEditing && <input type="hidden" name="profileId" value={editing!.profileId} />}

          {/* Datos de contacto */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Datos de contacto</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input id="name" name="name" defaultValue={editing?.name} required placeholder="Ej. María González Pérez" className="bg-background border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico (Opcional)</Label>
                <Input id="email" name="email" type="email" defaultValue={editing?.email} placeholder="correo@ejemplo.com" className="bg-background border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Teléfono / WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" defaultValue={editing?.whatsapp || ""} placeholder="Ej. +52 55 1234 5678" className="bg-background border-border/40" />
              </div>
            </div>
          </fieldset>



          {/* Clasificación */}
          <fieldset className="space-y-2 border-t border-border/40 pt-2">
            <legend className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Clasificación</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Cliente</Label>
                <select
                  id="type"
                  name="type"
                  value={clientType}
                  onChange={e => setClientType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border/40 bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="private">Particular</option>
                  <option value="bar">Bar / Establecimiento</option>
                  <option value="corporate">Corporativo</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Tipo de cliente: representa a la persona o entidad que contrata el servicio.</p>
              </div>
              {clientType !== "private" && (
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa (si aplica)</Label>
                  <Input
                    id="company"
                    name="company"
                    defaultValue={editing?.company || ""}
                    placeholder="Nombre de la empresa u organización"
                    className="bg-card border-border/40"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Obligatorio para clientes tipo Bar / Establecimiento o Corporativo cuando sea relevante.</p>
                </div>
              )}
            </div>
            {clientType !== "private" && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="rfc">RFC (para facturación)</Label>
                <Input
                  id="rfc"
                  name="rfc"
                  defaultValue={editing?.rfc || ""}
                  placeholder="XAXX010101000"
                  className="bg-card border-border/40"
                />
                <p className="text-xs text-muted-foreground mt-1">Requerido para facturación cuando el cliente es Corporativo o Bar / Establecimiento.</p>
              </div>
            )}
          </fieldset>

          {/* Ubicación de referencia */}
          <fieldset className="space-y-2 border-t border-border/40 pt-2">
            <legend className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Ubicación de referencia</legend>
            <p className="text-xs text-muted-foreground mb-3">Ciudad y estado del cliente — solo como referencia de contacto, no como venue del evento.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={editing?.city || ""}
                  placeholder="Ej. Toluca, Metepec, CDMX..."
                  className="bg-background border-border/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <select
                  id="state"
                  name="state"
                  defaultValue={editing?.state || ""}
                  className="flex h-10 w-full rounded-md border border-border/40 bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— Sin especificar —</option>
                  {ESTADOS_MX.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Notas internas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas internas</Label>
            <textarea id="notes" name="notes" defaultValue={editing?.notes || ""} rows={3} placeholder="Observaciones relevantes del cliente..." className="flex w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>

          {/* Información de seguimiento */}
          {!isEditing && (
            <p className="text-xs text-muted-foreground bg-primary/10 rounded-lg p-3 border border-border/40">
              ℹ️ El cliente podrá consultar su evento mediante su ID o enlace de seguimiento.
            </p>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border/40">
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 font-bold text-white">
              {isPending ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
