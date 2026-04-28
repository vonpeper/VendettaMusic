"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClienteAction, updateClienteAction } from "@/actions/clientes"
import { X, AlertCircle, CheckCircle2 } from "lucide-react"

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
    phone: string | null
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
  const [state, formAction, isPending] = useActionState(action, null)

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

        <form action={formAction} className="p-6 space-y-6">
          {isEditing && <input type="hidden" name="profileId" value={editing!.profileId} />}

          {/* Datos Personales */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Datos Personales</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input id="name" name="name" defaultValue={editing?.name} required placeholder="Ej. María González Pérez" className="bg-background border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico (Opcional)</Label>
                <Input id="email" name="email" type="email" defaultValue={editing?.email} placeholder="correo@ejemplo.com" className="bg-background border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" defaultValue={editing?.phone || ""} placeholder="Ej. 55 1234 5678" className="bg-background border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" defaultValue={editing?.whatsapp || ""} placeholder="Ej. +52 55 1234 5678" className="bg-background border-border/40" />
              </div>
            </div>
          </fieldset>

          {/* Ubicación */}
          <fieldset className="space-y-4 border-t border-border/40 pt-4">
            <legend className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Ubicación</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <select id="state" name="state" defaultValue={editing?.state || ""} className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Seleccionar estado</option>
                  {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Municipio / Ciudad</Label>
                <Input id="city" name="city" defaultValue={editing?.city || ""} placeholder="Ej. Zapopan" className="bg-background border-border/40" />
              </div>
            </div>
          </fieldset>

          {/* Tipo de cliente */}
          <fieldset className="space-y-4 border-t border-border/40 pt-4">
            <legend className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Clasificación</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="type">Tipo de Cliente</Label>
                <select id="type" name="type" defaultValue={editing?.type || "private"} className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="private">Social / Privado</option>
                  <option value="corporate">Corporativo</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company">Empresa (si aplica)</Label>
                <Input id="company" name="company" defaultValue={editing?.company || ""} placeholder="Nombre de la empresa u organización" className="bg-background border-border/40" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfc">RFC (para facturación)</Label>
              <Input id="rfc" name="rfc" defaultValue={editing?.rfc || ""} placeholder="XAXX010101000" className="bg-background border-border/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas internas</Label>
              <textarea id="notes" name="notes" defaultValue={editing?.notes || ""} rows={3} placeholder="Observaciones relevantes del cliente..." className="flex w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </fieldset>

          {!isEditing && (
            <p className="text-xs text-muted-foreground bg-primary/10 rounded-lg p-3 border border-border/40">
              🔒 El cliente recibirá acceso con contraseña temporal: <strong className="text-primary">Vendetta2026!</strong> (debe cambiarla al ingresar).
            </p>
          )}

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
