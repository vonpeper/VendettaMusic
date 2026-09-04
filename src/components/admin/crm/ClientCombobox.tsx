"use client"

import React, { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, User, Phone, Mail, UserPlus, Check, AlertTriangle, X } from "lucide-react"

export interface ClientData {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  city?: string | null
  state?: string | null
  rfc?: string | null
  company?: string | null
}

interface ClientComboboxProps {
  clients: ClientData[]
  selectedClientId: string | null
  onSelectClient: (client: ClientData | null) => void
  onAddNewClient?: (clientData: Omit<ClientData, "id">) => void
}

export function ClientCombobox({
  clients,
  selectedClientId,
  onSelectClient,
  onAddNewClient
}: ClientComboboxProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newCity, setNewCity] = useState("")

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null
  }, [clients, selectedClientId])

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return clients.slice(0, 15)

    const cleanTermPhone = term.replace(/\D/g, "")

    return clients.filter(c => {
      const nameMatch = c.name?.toLowerCase().includes(term)
      const emailMatch = c.email?.toLowerCase().includes(term)
      const phoneMatch = cleanTermPhone && c.phone ? c.phone.replace(/\D/g, "").includes(cleanTermPhone) : false
      return nameMatch || emailMatch || phoneMatch
    }).slice(0, 15)
  }, [clients, searchTerm])

  const duplicateWarning = useMemo(() => {
    if (!selectedClient || !selectedClient.phone) return null
    const cleanPhone = selectedClient.phone.replace(/\D/g, "").slice(-10)
    if (cleanPhone.length < 10) return null

    const matches = clients.filter(
      c => c.id !== selectedClient.id && c.phone && c.phone.replace(/\D/g, "").slice(-10) === cleanPhone
    )
    return matches.length > 0 ? matches.length : null
  }, [clients, selectedClient])

  function handleCreateClientSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    if (onAddNewClient) {
      onAddNewClient({
        name: newName.trim(),
        phone: newPhone.trim() || null,
        email: newEmail.trim().toLowerCase() || null,
        city: newCity.trim() || null,
      })
    }
    setIsCreatingNew(false)
    setNewName("")
    setNewPhone("")
    setNewEmail("")
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Titular / Cliente
        </Label>
        {!isCreatingNew && (
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Crear nuevo cliente
          </button>
        )}
      </div>

      {isCreatingNew ? (
        <div className="p-4 rounded-xl bg-card border border-primary/40 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Registrar Nuevo Cliente</span>
            <button type="button" onClick={() => setIsCreatingNew(false)} className="text-muted-foreground hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nombre Completo *</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="ej. Sofía Martínez"
                className="h-9 text-sm"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Teléfono (10 dígitos)</Label>
              <Input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="ej. 5512345678"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Correo Electrónico</Label>
              <Input
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="ej. sofia@gmail.com"
                type="email"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Ciudad / Zona</Label>
              <Input
                value={newCity}
                onChange={e => setNewCity(e.target.value)}
                placeholder="ej. Metepec / CDMX"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingNew(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleCreateClientSubmit} disabled={!newName.trim()}>
              Registrar y Seleccionar
            </Button>
          </div>
        </div>
      ) : selectedClient ? (
        <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="font-bold text-white text-base flex items-center gap-2">
              {selectedClient.name}
              <span className="text-[10px] bg-primary/20 text-primary font-mono px-2 py-0.5 rounded-md">
                ID: {selectedClient.id.slice(0, 8)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
              {selectedClient.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-primary" /> {selectedClient.phone}
                </span>
              )}
              {selectedClient.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-primary" /> {selectedClient.email}
                </span>
              )}
              {selectedClient.city && (
                <span>📍 {selectedClient.city}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onSelectClient(null)
                setIsOpen(true)
              }}
              className="text-xs cursor-pointer"
            >
              Cambiar Cliente
            </Button>
          </div>
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
              placeholder="Buscar cliente por nombre, email o teléfono..."
              className="pl-9 bg-card text-sm"
            />
          </div>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-xl bg-card border border-border shadow-2xl max-h-60 overflow-auto p-1">
              {filteredClients.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No se encontraron clientes coincidentes.
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      setIsCreatingNew(true)
                      setNewName(searchTerm)
                    }}
                    className="block mx-auto mt-2 text-primary font-bold hover:underline"
                  >
                    {`+ Crear "${searchTerm}" como nuevo cliente`}
                  </button>
                </div>
              ) : (
                filteredClients.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectClient(c)
                      setIsOpen(false)
                      setSearchTerm("")
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white group-hover:text-primary transition-colors">
                        {c.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                        {c.phone && <span>📞 {c.phone}</span>}
                        {c.email && <span>✉️ {c.email}</span>}
                        {c.city && <span>📍 {c.city}</span>}
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

      {duplicateWarning && (
        <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Advertencia: Existen {duplicateWarning} otro(s) registro(s) con el mismo teléfono de contacto.</span>
        </div>
      )}
    </div>
  )
}
