"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle2, XCircle, Clock, Info, Filter } from "lucide-react"
import { NotifyEventButton, EditEventoButton, DeleteEventoButton } from "./EventActions"
import { formatDateMX } from "@/lib/utils"

const MXN = (v: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v)

const DRESS_LABELS: Record<string, string> = {
  formal:        "🎩 Formal",
  formal_casual: "👔 Formal Casual",
  rock:          "🎸 Rock",
  nocturno:      "🌙 Nocturno",
}

const STATUS_COLORS: Record<string, string> = {
  pendiente:  "border-yellow-200 text-yellow-700 bg-yellow-50",
  agendado:   "border-green-200 text-green-700 bg-green-50",
  completado: "border-blue-200 text-blue-700 bg-blue-50",
  cancelado:  "border-red-200 text-red-700 bg-red-50",
}

export function MasterEventsTable({ events, clients, locations, packages, staff }: any) {
  const [activeTab, setActiveTab] = useState("todos")
  const [showCurrentMonth, setShowCurrentMonth] = useState(false)
  const now = new Date()

  const filteredEvents = events.filter((evt: any) => {
    const eventDate = new Date(evt.date)
    
    // Status Filter
    if (activeTab !== "todos" && evt.status !== activeTab) return false
    
    // Month Filter
    if (showCurrentMonth) {
      const isCurrentMonth = eventDate.getUTCMonth() === now.getMonth() && 
                            eventDate.getUTCFullYear() === now.getFullYear()
      if (!isCurrentMonth) return false
    }
    
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-card border border-border/40 p-1 h-11">
            <TabsTrigger value="todos" className="px-5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold">
              Todos
            </TabsTrigger>
            <TabsTrigger value="agendado" className="px-5 rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold">
              Agendados
            </TabsTrigger>
            <TabsTrigger value="completado" className="px-5 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold">
              Completados
            </TabsTrigger>
            <TabsTrigger value="cancelado" className="px-5 rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold">
              Cancelados
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button 
          variant={showCurrentMonth ? "default" : "outline"}
          onClick={() => setShowCurrentMonth(!showCurrentMonth)}
          className={`gap-2 h-11 px-6 rounded-xl font-bold transition-all ${
            showCurrentMonth ? "bg-primary text-white shadow-lg shadow-primary/20" : "border-border/40 text-muted-foreground"
          }`}
        >
          <Calendar className="w-4 h-4" />
          {showCurrentMonth ? "Viendo Mes Actual" : "Filtrar por Mes Actual"}
        </Button>
      </div>

      <div className="border border-border/40 rounded-xl bg-card overflow-hidden shadow-sm px-6">
        <div className="overflow-x-auto">
          <Table className="min-w-[1300px]">
            <TableHeader>
              <tr className="bg-primary/5 border-b border-border/40">
                <TableHead className="text-primary font-bold w-24 py-5 pl-6">Fecha</TableHead>
                <TableHead className="font-bold">Evento, Identidad y Estatus</TableHead>
                <TableHead className="font-bold">Horario y Logística</TableHead>
                <TableHead className="font-bold">Finanzas</TableHead>
                <TableHead className="text-right pr-10 font-bold">Acciones</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Filter className="w-12 h-12 mb-2" />
                      <p className="text-lg font-medium">No se encontraron eventos con estos filtros.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEvents.map((evt: any) => {
                const eventDate = new Date(evt.date)
                const isCurrentMonth = eventDate.getUTCMonth() === now.getMonth() && 
                                      eventDate.getUTCFullYear() === now.getFullYear()
                
                return (
                  <TableRow key={evt.id} className="border-border/40 align-top hover:bg-black/[0.01] transition-colors">
                    {/* Fecha */}
                    <TableCell className="py-6 pl-6">
                      <div className={`w-14 h-14 rounded-lg flex flex-col justify-center items-center shadow-sm ${
                        isCurrentMonth ? "bg-primary text-white" : "bg-white border border-border text-foreground"
                      }`}>
                        <span className="text-[10px] font-bold uppercase leading-none">
                          {eventDate.toLocaleString("es-MX", { month: "short", timeZone: "UTC" })}
                        </span>
                        <span className="text-xl font-black leading-none mt-1">{eventDate.getUTCDate()}</span>
                        <span className={`text-[8px] mt-0.5 ${isCurrentMonth ? "text-white/80" : "text-muted-foreground"}`}>
                          {eventDate.getUTCFullYear()}
                        </span>
                      </div>
                    </TableCell>

                    {/* Identidad y Detalles Consolidados */}
                    <TableCell className="py-6 min-w-[300px]">
                      <div className="font-bold text-foreground text-base leading-tight">
                        {evt.customName || evt.client?.user?.name || "Sin nombre"}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {evt.guestCount > 0 && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded border border-border/20">
                            👥 {evt.guestCount}
                          </div>
                        )}
                        {!!evt.ceremonyType && (
                          <div className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                            {evt.ceremonyType.replace("_", " ")}
                          </div>
                        )}
                        {!!evt.dressCode && (
                          <div className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-border/20">
                            {DRESS_LABELS[evt.dressCode] ?? evt.dressCode}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {evt.location && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <span className="opacity-60">📍</span> {evt.location.name}
                          </div>
                        )}
                        {evt.package && (
                          <div className="text-[10px] text-primary font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="opacity-60 text-xs">📦</span> {evt.package.name}
                          </div>
                        )}
                      </div>

                      {/* Estatus Consolidado */}
                      <div className="mt-3">
                        <Badge className={`text-[9px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-md ${STATUS_COLORS[evt.status] ?? "border-border text-muted-foreground"}`}>
                          {evt.status === "agendado" ? "Confirmado" : evt.status}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Horario y Logística */}
                    <TableCell className="py-6">
                      <div className="space-y-2">
                        {evt.arrivalTime && (
                          <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 bg-muted/20 px-2 py-1 rounded w-fit">
                            <Clock className="w-3 h-3 opacity-60" /> {evt.arrivalTime} (Llegada)
                          </div>
                        )}
                        {evt.performanceStart && (
                          <div className="text-foreground font-black text-sm bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-lg w-fit shadow-sm">
                            ⚡️ {evt.performanceStart}{evt.performanceEnd ? ` — ${evt.performanceEnd}` : ""}
                          </div>
                        )}
                        {!evt.performanceStart && !evt.arrivalTime && (
                          <span className="text-xs text-muted-foreground italic opacity-50 italic">Por confirmar horario</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Finanzas (Consolidadas y Limpias) */}
                    <TableCell className="py-6">
                      <div className="bg-white p-3 rounded-xl border border-border/40 w-48 shadow-sm space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground font-bold uppercase tracking-tight">Subtotal:</span>
                          <span className="font-black text-foreground">{MXN(evt.amount)}</span>
                        </div>
                        
                        {evt.deposit > 0 && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground font-bold uppercase tracking-tight">Anticipo:</span>
                            <span className="text-green-600 font-bold">{MXN(evt.deposit)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-border/20">
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">Saldo:</span>
                          <span className={`text-xs font-black ${evt.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                            {evt.balance > 0 ? MXN(evt.balance) : "PAGADO ✅"}
                          </span>
                        </div>

                        {/* Facturación: Solo si es true y existe monto con tax */}
                        {evt.invoice && (
                          <div className="mt-3 pt-2 border-t border-dashed border-blue-200 bg-blue-50/50 -mx-3 -mb-3 p-3 rounded-b-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">🧾 Facturar</span>
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            </div>
                            {evt.totalWithTax ? (
                              <div className="text-[11px] font-black text-blue-900 text-right leading-none">
                                {MXN(evt.totalWithTax)}
                                <span className="block text-[7px] opacity-60 mt-0.5">Total c/ IVA</span>
                              </div>
                            ) : (
                              <div className="text-[8px] font-bold text-blue-600 text-right italic">
                                IVA pendiente
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>



                    {/* Acciones */}
                    <TableCell className="py-6 text-right pr-10">
                      <div className="flex items-center gap-1.5 justify-end">
                        <NotifyEventButton
                          eventId={evt.id}
                          alreadySent={evt.notificationSent}
                        />
                        <EditEventoButton
                          event={evt}
                          clients={clients}
                          locations={locations}
                          packages={packages}
                          staff={staff}
                          showText={false}
                        />
                        <DeleteEventoButton
                          eventId={evt.id}
                          showText={false}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
