"use client"

import { useState } from "react"
import { addSubstituteAction, deleteSubstituteAction } from "@/actions/musicians"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, UserPlus } from "lucide-react"

export function AddSubstituteForm({ musicianProfileId }: { musicianProfileId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await addSubstituteAction(musicianProfileId, formData)
    setLoading(false)
    if (result.success) {
      (e.target as HTMLFormElement).reset()
    } else {
      alert(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-2">
      <Input name="name" placeholder="Nombre del suplente" required className="h-8 text-xs bg-card border-border/40" />
      <Input name="whatsapp" placeholder="WhatsApp (10 dígitos)" required className="h-8 text-xs bg-card border-border/40" />
      <Button type="submit" disabled={loading} size="sm" className="h-8 px-2" variant="secondary">
        <UserPlus className="w-3.5 h-3.5" />
      </Button>
    </form>
  )
}

export function DeleteSubstituteButton({ substituteId }: { substituteId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("¿Eliminar este suplente?")) return
    setLoading(true)
    await deleteSubstituteAction(substituteId)
    setLoading(false)
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading} className="h-6 w-6 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
      <Trash2 className="w-3 h-3" />
    </Button>
  )
}
