"use client"

import React, { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, MapPin, Plus, Check, ExternalLink, X } from "lucide-react"

export interface VenueData {
  id: string
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  mapsLink?: string | null
  phone?: string | null
}

interface VenueComboboxProps {
  venues: VenueData[]
  selectedVenueId: string | null
  venuePendingText?: string
  onSelectVenue: (venue: VenueData | null, pendingAddress?: string) => void
  onAddNewVenue?: (venueData: Omit<VenueData, "id">) => void
}

export function VenueCombobox({
  venues,
  selectedVenueId,
  venuePendingText = "",
  onSelectVenue,
  onAddNewVenue
}: VenueComboboxProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isPendingVenue, setIsPendingVenue] = useState(Boolean(!selectedVenueId && venuePendingText))
  const [pendingText, setPendingText] = useState(venuePendingText)

  const [newName, setNewName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newCity, setNewCity] = useState("Toluca")
  const [newState, setNewState] = useState("México")
  const [newMapsLink, setNewMapsLink] = useState("")

  const selectedVenue = useMemo(() => {
    return venues.find(v => v.id === selectedVenueId) || null
  }, [venues, selectedVenueId])

  const filteredVenues = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const cleanList = venues.filter(v => !v.name.startsWith("Show - ") && !v.name.startsWith("Show-"))

    if (!term) return cleanList.slice(0, 15)

    return cleanList.filter(v => {
      const nameMatch = v.name.toLowerCase().includes(term)
      const addrMatch = v.address ? v.address.toLowerCase().includes(term) : false
      const cityMatch = v.city ? v.city.toLowerCase().includes(term) : false
      return nameMatch || addrMatch || cityMatch
    }).slice(0, 15)
  }, [venues, searchTerm])

  function handleCreateVenueSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    if (onAddNewVenue) {
      onAddNewVenue({
        name: newName.trim(),
        address: newAddress.trim() || newName.trim(),
        city: newCity.trim() || null,
        state: newState.trim() || null,
        mapsLink: newMapsLink.trim() || null
      })
    }
    setIsCreatingNew(false)
    setNewName("")
    setNewAddress("")
    setNewMapsLink("")
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Locación / Venue
        </Label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsPendingVenue(!isPendingVenue)
              if (!isPendingVenue) {
                onSelectVenue(null, pendingText || "Lugar por confirmar")
              }
            }}
            className="text-xs text-muted-foreground hover:text-white font-medium cursor-pointer"
          >
            {isPendingVenue ? "Seleccionar del catálogo" : "Lugar aún no definido"}
          </button>
          {!isCreatingNew && !isPendingVenue && (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Venue
            </button>
          )}
        </div>
      </div>

      {isPendingVenue ? (
        <div className="p-4 rounded-xl bg-card border border-border/50 space-y-2">
          <Label className="text-xs text-muted-foreground">Ubicación Tentativa / Pendiente (sin crear registro en catálogo)</Label>
          <Input
            value={pendingText}
            onChange={e => {
              setPendingText(e.target.value)
              onSelectVenue(null, e.target.value)
            }}
            placeholder="ej. Jardín privado por confirmar en Valle de Bravo"
            className="text-sm"
          />
        </div>
      ) : isCreatingNew ? (
        <div className="p-4 rounded-xl bg-card border border-primary/40 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Agregar Venue al Catálogo</span>
            <button type="button" onClick={() => setIsCreatingNew(false)} className="text-muted-foreground hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nombre del Lugar *</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="ej. Hacienda Cantalagua"
                className="h-9 text-sm"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Dirección</Label>
              <Input
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                placeholder="ej. Km 129 Carretera México-Toluca"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Municipio / Ciudad</Label>
              <Input
                value={newCity}
                onChange={e => setNewCity(e.target.value)}
                placeholder="ej. Toluca"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Enlace de Google Maps</Label>
              <Input
                value={newMapsLink}
                onChange={e => setNewMapsLink(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingNew(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleCreateVenueSubmit} disabled={!newName.trim()}>
              Guardar en Catálogo y Seleccionar
            </Button>
          </div>
        </div>
      ) : selectedVenue ? (
        <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="font-bold text-white text-base flex items-center gap-2">
              {selectedVenue.name}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
              {selectedVenue.address && (
                <span>📍 {selectedVenue.address}</span>
              )}
              {selectedVenue.city && (
                <span>({selectedVenue.city}, {selectedVenue.state || "México"})</span>
              )}
              {selectedVenue.mapsLink && (
                <a
                  href={selectedVenue.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3 h-3" /> Ver Mapa
                </a>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onSelectVenue(null)
              setIsOpen(true)
            }}
            className="text-xs cursor-pointer"
          >
            Cambiar Lugar
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Buscar salón, hacienda o jardín en el catálogo..."
              className="pl-9 bg-card text-sm"
            />
          </div>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-xl bg-card border border-border shadow-2xl max-h-60 overflow-auto p-1">
              {filteredVenues.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No se encontraron locaciones registradas.
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      setIsCreatingNew(true)
                      setNewName(searchTerm)
                    }}
                    className="block mx-auto mt-2 text-primary font-bold hover:underline"
                  >
                    + Registrar "{searchTerm}" en el catálogo
                  </button>
                </div>
              ) : (
                filteredVenues.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onSelectVenue(v)
                      setIsOpen(false)
                      setSearchTerm("")
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white group-hover:text-primary transition-colors">
                        {v.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {v.address || "Dirección pendiente"} {v.city ? "• " + v.city : ""}
                      </div>
                    </div>
                    <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
