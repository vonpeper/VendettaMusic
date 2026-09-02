"use client"

import React from "react"
import { UnifiedEventQuoteForm, PackageOption, StaffOption } from "@/components/admin/UnifiedEventQuoteForm"
import { ClientData } from "@/components/admin/crm/ClientCombobox"
import { VenueData } from "@/components/admin/crm/VenueCombobox"
import { X } from "lucide-react"

interface EventFormProps {
  onClose: () => void
  clients: { id: string; name: string; phone?: string | null; email?: string | null; city?: string | null }[]
  locations: { id: string; name: string; address?: string; city?: string | null; state?: string | null; mapsLink?: string | null; phone?: string | null }[]
  packages: PackageOption[]
  staff?: StaffOption[]
  allMusicians?: { id: string; name: string; instrument: string; isTitular: boolean }[]
  initialData?: any
}

export function EventForm({
  onClose,
  clients,
  locations,
  packages,
  staff = [],
  allMusicians = [],
  initialData
}: EventFormProps) {
  const formattedClients: ClientData[] = clients.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone || null,
    email: c.email || null,
    city: c.city || null
  }))

  const formattedVenues: VenueData[] = locations.map(l => ({
    id: l.id,
    name: l.name,
    address: l.address || l.name,
    city: l.city || null,
    state: l.state || null,
    mapsLink: l.mapsLink || null,
    phone: l.phone || null
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-background border border-border rounded-3xl p-6 md:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-white rounded-full hover:bg-white/10 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 pb-4 border-b border-border/40">
          <h2 className="text-xl font-bold font-heading text-white">
            {initialData?.id ? "Editar Evento / Cotización" : "Nuevo Evento Maestro"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {initialData?.id ? "Modifica los datos operativos, locación y montos del registro." : "Registra un nuevo show en el calendario maestro."}
          </p>
        </div>

        <UnifiedEventQuoteForm
          mode={initialData?.id ? "edit" : "create"}
          targetId={initialData?.id}
          initialData={initialData}
          clients={formattedClients}
          venues={formattedVenues}
          packages={packages}
          staff={staff}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}
