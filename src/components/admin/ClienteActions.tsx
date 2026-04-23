"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { deleteClienteAction } from "@/actions/clientes"
import { ClienteForm } from "@/components/admin/ClienteForm"
import { Pencil, Trash2, History, FileText } from "lucide-react"

interface ClienteActionsProps {
  client: {
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

export function ClienteActions({ client }: ClienteActionsProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar permanentemente a "${client.name}"? Esta acción NO se puede deshacer.`)) return
    setIsDeleting(true)
    const result = await deleteClienteAction(client.profileId)
    if (!result.success) {
      alert(result.message)
      setIsDeleting(false)
    }
  }

  return (
    <>
      {showEdit && (
        <ClienteForm
          onClose={() => setShowEdit(false)}
          editing={client}
        />
      )}
      <div className="flex items-center gap-1 justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowEdit(true)}
          className="hover:text-primary hover:bg-primary/10 h-8 w-8"
          title="Editar cliente"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          className="hover:text-destructive hover:bg-destructive/10 h-8 w-8"
          title="Eliminar cliente"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </>
  )
}

export function NuevoClienteButton() {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      {showForm && <ClienteForm onClose={() => setShowForm(false)} />}
      <Button onClick={() => setShowForm(true)} className="font-bold">
        + Añadir Cliente
      </Button>
    </>
  )
}
