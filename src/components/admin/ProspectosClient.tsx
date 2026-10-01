"use client"

import React, { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
  Search, Mail, Phone, Calendar, MessageSquare, 
  ArrowRight, CheckCircle2, UserCheck, 
  Trash2
} from "lucide-react"
import { updateInquiryStatusAction, deleteInquiryAction } from "@/actions/contact"
import { toast } from "sonner"
import Link from "next/link"

export interface ContactInquiryItem {
  id: string
  name: string
  phone?: string | null
  email: string
  requestedDate?: Date | null
  eventType?: string | null
  message?: string | null
  status: string
  matchedClientId?: string | null
  convertedBookingId?: string | null
  convertedBookingShortId?: string | null
  createdAt: Date
}

interface ProspectosClientProps {
  initialInquiries: ContactInquiryItem[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "Nuevo", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  reviewing: { label: "En Revisión", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  contacted: { label: "Contactado", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  converted: { label: "Convertido", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  discarded: { label: "Descartado", color: "bg-muted text-muted-foreground border-border" },
}

export function ProspectosClient({ initialInquiries }: ProspectosClientProps) {
  const [inquiries, setInquiries] = useState<ContactInquiryItem[]>(initialInquiries)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiryItem | null>(null)
  const [isPending, startTransition] = useTransition()

  const pendingCount = inquiries.filter(i => i.status !== "converted" && i.status !== "discarded").length
  const newCount = inquiries.filter(i => i.status === "new").length
  const convertedCount = inquiries.filter(i => i.status === "converted").length
  const discardedCount = inquiries.filter(i => i.status === "discarded").length

  const filteredInquiries = inquiries.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone && item.phone.includes(searchTerm)) ||
      (item.eventType && item.eventType.toLowerCase().includes(searchTerm.toLowerCase()))

    let matchesStatus = true
    if (statusFilter === "pending") {
      matchesStatus = item.status !== "converted" && item.status !== "discarded"
    } else if (statusFilter === "new") {
      matchesStatus = item.status === "new"
    } else if (statusFilter === "contacted") {
      matchesStatus = item.status === "contacted" || item.status === "reviewing"
    } else if (statusFilter === "converted") {
      matchesStatus = item.status === "converted"
    } else if (statusFilter === "discarded") {
      matchesStatus = item.status === "discarded"
    } else if (statusFilter === "all") {
      matchesStatus = true
    }

    return matchesSearch && matchesStatus
  })

  function handleStatusChange(inquiryId: string, newStatus: string) {
    startTransition(async () => {
      const res = await updateInquiryStatusAction(inquiryId, newStatus)
      if (res.success) {
        setInquiries(prev => prev.map(item => item.id === inquiryId ? { ...item, status: newStatus } : item))
        if (selectedInquiry?.id === inquiryId) {
          setSelectedInquiry(prev => prev ? { ...prev, status: newStatus } : null)
        }
        toast.success("Estado del prospecto actualizado")
      } else {
        toast.error(res.error || "No se pudo actualizar el estado")
      }
    })
  }

  function handleDelete(inquiryId: string) {
    if (!confirm("¿Estás seguro de eliminar este prospecto?")) return
    startTransition(async () => {
      const res = await deleteInquiryAction(inquiryId)
      if (res.success) {
        setInquiries(prev => prev.filter(item => item.id !== inquiryId))
        if (selectedInquiry?.id === inquiryId) setSelectedInquiry(null)
        toast.success("Prospecto eliminado")
      } else {
        toast.error(res.error || "No se pudo eliminar")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo, teléfono o tipo..."
            className="pl-9 h-10 bg-card border-border"
          />
        </div>

        {/* Filtro por estado / pestañas */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            className="text-xs h-8 font-semibold gap-1.5"
          >
            <span>Por Atender</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-none font-bold">
              {pendingCount}
            </Badge>
          </Button>

          <Button
            size="sm"
            variant={statusFilter === "converted" ? "default" : "outline"}
            onClick={() => setStatusFilter("converted")}
            className="text-xs h-8 text-emerald-400 gap-1.5"
          >
            <span>Convertidos</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-500/20 text-emerald-400 border-none font-bold">
              {convertedCount}
            </Badge>
          </Button>

          <Button
            size="sm"
            variant={statusFilter === "new" ? "default" : "outline"}
            onClick={() => setStatusFilter("new")}
            className="text-xs h-8 text-blue-400 gap-1.5"
          >
            <span>Nuevos</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/20 text-blue-400 border-none font-bold">
              {newCount}
            </Badge>
          </Button>

          <Button
            size="sm"
            variant={statusFilter === "discarded" ? "default" : "outline"}
            onClick={() => setStatusFilter("discarded")}
            className="text-xs h-8 text-muted-foreground gap-1.5"
          >
            <span>Descartados</span>
            {discardedCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-none font-medium">
                {discardedCount}
              </Badge>
            )}
          </Button>

          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="text-xs h-8 text-muted-foreground"
          >
            Todos ({inquiries.length})
          </Button>
        </div>
      </div>

      {/* Lista de Prospectos */}
      {filteredInquiries.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            {statusFilter === "pending" ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : (
              <MessageSquare className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {statusFilter === "pending"
              ? "¡Bandeja al día! No hay prospectos pendientes"
              : "No se encontraron prospectos"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {statusFilter === "pending"
              ? "Todos los prospectos web han sido atendidos y graduados con cotización en el Centro de Ventas."
              : searchTerm || statusFilter !== "all" 
              ? "Prueba cambiando los filtros o el término de búsqueda." 
              : "Las consultas enviadas desde el formulario de contacto aparecerán aquí."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Tabla / Lista Principal */}
          <div className={`${selectedInquiry ? "md:col-span-7" : "md:col-span-12"} space-y-2.5 transition-all`}>
            {filteredInquiries.map((item) => {
              const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.new
              const isSelected = selectedInquiry?.id === item.id

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedInquiry(item)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-card hover:border-primary/50 shadow-sm ${
                    isSelected ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/[0.02]" : "border-border/70 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      {/* Cabecera del Lead: Nombre y Badges */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {item.convertedBookingId ? (
                          <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-medium border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1 flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Cotización {item.convertedBookingShortId ? `#${item.convertedBookingShortId}` : "en Ventas"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-medium tracking-normal border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </Badge>
                        )}
                        {item.eventType && (
                          <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-normal tracking-normal text-muted-foreground bg-muted/60 border border-border/50">
                            {item.eventType}
                          </Badge>
                        )}
                        {item.matchedClientId && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 gap-1 flex items-center">
                            <UserCheck className="w-3.5 h-3.5" /> Cliente Registrado
                          </Badge>
                        )}
                      </div>

                      {/* Fila de Contacto: Correo, Teléfono, Fecha */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-foreground/85 pt-0.5 font-normal">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-muted-foreground" /> {item.email}
                        </span>
                        {item.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-muted-foreground" /> {item.phone}
                          </span>
                        )}
                        {item.requestedDate && (
                          <span className="flex items-center gap-1.5 text-primary font-semibold">
                            <Calendar className="w-4 h-4" /> Fecha Solicitada: {new Date(item.requestedDate).toLocaleDateString("es-MX", { timeZone: "UTC" })}
                          </span>
                        )}
                      </div>

                      {/* Mensaje / Chips de Parámetros de Alta Legibilidad */}
                      {item.message && (
                        <div className="pt-1.5">
                          {item.message.includes(" | ") ? (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {item.message.split(" | ").map((part, idx) => {
                                const trimmed = part.trim()
                                const colonIdx = trimmed.indexOf(":")
                                if (colonIdx !== -1) {
                                  const key = trimmed.slice(0, colonIdx).trim()
                                  const val = trimmed.slice(colonIdx + 1).trim()
                                  return (
                                    <span 
                                      key={idx} 
                                      className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-normal text-foreground/90 bg-muted/40 hover:bg-muted/70 border border-border/70 px-3 py-1 rounded-lg transition-colors leading-normal tracking-normal"
                                    >
                                      <strong className="font-semibold text-foreground/75">{key}:</strong> {val}
                                    </span>
                                  )
                                }
                                return (
                                  <span 
                                    key={idx} 
                                    className="inline-flex items-center text-xs sm:text-[13px] font-normal text-foreground/90 bg-muted/40 border border-border/70 px-3 py-1 rounded-lg leading-normal tracking-normal"
                                  >
                                    {trimmed}
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm text-foreground/90 font-normal leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/60 tracking-normal">
                              {item.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Fecha de Creación */}
                    <div className="flex flex-col items-end shrink-0 pt-0.5">
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Panel Lateral de Detalle y Acciones */}
          {selectedInquiry && (
            <div className="md:col-span-5">
              <Card className="sticky top-20 border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h4 className="font-bold text-lg text-foreground tracking-normal">{selectedInquiry.name}</h4>
                    <p className="text-xs text-muted-foreground">Prospecto Web #{selectedInquiry.id.slice(-6)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInquiry(null)}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    Cerrar
                  </Button>
                </div>

                {/* Datos de Contacto */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Correo:</span>
                    <a href={`mailto:${selectedInquiry.email}`} className="font-medium text-primary hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </div>
                  {selectedInquiry.phone && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <a href={`tel:${selectedInquiry.phone}`} className="font-medium text-foreground hover:underline">
                        {selectedInquiry.phone}
                      </a>
                    </div>
                  )}
                  {selectedInquiry.eventType && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                      <span className="text-muted-foreground">Tipo de Evento:</span>
                      <span className="font-semibold text-foreground uppercase">{selectedInquiry.eventType}</span>
                    </div>
                  )}
                  {selectedInquiry.requestedDate && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                      <span className="text-muted-foreground">Fecha Tentativa:</span>
                      <span className="font-semibold text-primary">
                        {new Date(selectedInquiry.requestedDate).toLocaleDateString("es-MX", { timeZone: "UTC" })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Mensaje Completo */}
                {selectedInquiry.message && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Mensaje enviado:</span>
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-normal tracking-normal">
                      {selectedInquiry.message}
                    </div>
                  </div>
                )}

                {/* Cambio de Estado */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-semibold text-muted-foreground">Cambiar Estado:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["new", "reviewing", "contacted", "discarded"].map(st => (
                      <Button
                        key={st}
                        size="sm"
                        variant={selectedInquiry.status === st ? "default" : "outline"}
                        disabled={isPending}
                        onClick={() => handleStatusChange(selectedInquiry.id, st)}
                        className="text-xs h-8 capitalize"
                      >
                        {STATUS_CONFIG[st]?.label || st}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Acción de Conversión a Cotización */}
                <div className="pt-3 border-t border-border space-y-2">
                  {selectedInquiry.convertedBookingId ? (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-semibold text-emerald-400">Graduado a Centro de Ventas</p>
                          <p className="text-emerald-300/80 leading-relaxed">
                            Este prospecto ya cuenta con cotización formal {selectedInquiry.convertedBookingShortId ? `con folio #${selectedInquiry.convertedBookingShortId}` : ""}.
                          </p>
                        </div>
                      </div>
                      <Button
                        asChild
                        className="w-full h-10 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer shadow-md shadow-emerald-950/20"
                      >
                        <Link href={`/admin/ventas/${selectedInquiry.convertedBookingId}`}>
                          <CheckCircle2 className="w-4 h-4" /> Ver en Centro de Ventas <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      asChild
                      className="w-full h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer shadow-md shadow-primary/20"
                    >
                      <Link href={`/admin/ventas/manual?inquiryId=${selectedInquiry.id}`}>
                        <ArrowRight className="w-4 h-4" /> 
                        Convertir a Cotización Formal
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(selectedInquiry.id)}
                    className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar Prospecto
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
