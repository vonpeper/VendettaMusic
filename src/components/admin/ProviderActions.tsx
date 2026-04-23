"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit2, Plus, Trash2 } from "lucide-react"
import { deleteProviderAction } from "@/actions/providers"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProviderForm } from "./ProviderForm"

export function NuevoProveedorButton() {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
            <DialogDescription>
              Da de alta un nuevo proveedor para poder contactarlo y asignarlo a eventos.
            </DialogDescription>
          </DialogHeader>
          <ProviderForm onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
      <Button onClick={() => setShowForm(true)} className="font-bold gap-2">
        <Plus className="w-4 h-4" /> Nuevo Proveedor
      </Button>
    </>
  )
}

export function EditProveedorButton({ provider, showText = false }: { provider: any, showText?: boolean }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription>
              Actualiza los datos de contacto y servicios del proveedor.
            </DialogDescription>
          </DialogHeader>
          <ProviderForm initialData={provider} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
      <Button 
        variant="ghost" 
        size={showText ? "sm" : "icon"} 
        onClick={() => setShowForm(true)}
        className={`${showText ? "px-3 gap-2" : "h-8 w-8"} text-gray-400 hover:text-white hover:bg-white/10`}
      >
        <Edit2 className="w-3.5 h-3.5" />
        {showText && <span>Editar</span>}
      </Button>
    </>
  )
}

export function DeleteProveedorButton({ providerId }: { providerId: string }) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteProviderAction(providerId)
    if (!result.success) {
      alert(result.error)
      setConfirm(false)
    }
    setLoading(false)
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          disabled={loading}
          className="h-8 text-xs font-bold px-2"
        >
          {loading ? "..." : "Confirmar"}
        </Button>
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setConfirm(false)}
          className="h-8 text-xs px-2 text-gray-400 hover:text-white uppercase"
        >
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => setConfirm(true)}
      className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
      title="Eliminar proveedor"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  )
}
