"use client"

import { useState } from "react"
import { createProviderAction, updateProviderAction } from "@/actions/providers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProviderFormProps {
  onClose: () => void
  initialData?: any
}

const PROVIDER_TYPES = [
  "Producción Full",
  "Audio",
  "Templete",
  "Pista Iluminada",
  "DJ",
  "Iluminación",
  "Pantalla LED",
  "Otro"
]

export function ProviderForm({ onClose, initialData }: ProviderFormProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    let result
    if (initialData) {
      result = await updateProviderAction(initialData.id, formData)
    } else {
      result = await createProviderAction(formData)
    }
    
    setLoading(false)
    if (result.success) {
      onClose()
    } else {
      alert(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre Completo</Label>
          <Input name="name" required placeholder="Nombre del contacto" defaultValue={initialData?.name} />
        </div>
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Input name="company" placeholder="Nombre de la empresa" defaultValue={initialData?.company} />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Rubro / Tipo de Servicio</Label>
        <Select name="serviceType" defaultValue={initialData?.serviceType || "Audio"} required>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar rubro..." />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_TYPES.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>WhatsApp</Label>
          <Input name="whatsapp" placeholder="10 dígitos" defaultValue={initialData?.whatsapp} />
        </div>
        <div className="space-y-2">
          <Label>Email / Otro Contacto</Label>
          <Input name="contactInfo" placeholder="correo@ejemplo.com" defaultValue={initialData?.contactInfo} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Dirección</Label>
        <Input name="address" placeholder="Dirección física de la bodega / oficinas" defaultValue={initialData?.address} />
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Proveedor"}
        </Button>
      </div>
    </form>
  )
}
