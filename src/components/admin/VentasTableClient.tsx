"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { 
  Loader2, 
  Trash2, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Calendar,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ShieldAlert,
  UserCheck,
  Users,
  MoreHorizontal,
  MessageSquare,
  Eye,
  Search,
  X,
  RefreshCw
} from "lucide-react"
import { resendNotificationAction } from "@/actions/notifications"
import { getValidWhatsappPhone } from "@/lib/phone"
import { Button } from "@/components/ui/button"

import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateMX, formatCurrency } from "@/lib/utils"
import { updateBookingStatusAction, reactivateBookingAction } from "@/actions/ventas"
import { FollowUpButton } from "./FollowUpButton"
import { ContractStatusSwitcher } from "./ContractStatusSwitcher"
import { PreConfirmChecklist, PreConfirmData } from "./PreConfirmChecklist"

interface Booking {
  id: string
  shortId: string | null
  clientName: string
  requestedDate: Date | string
  packageName: string
  baseAmount: number
  viaticosAmount: number
  depositAmount: number
  status: string
  paymentStatus?: string
  clientPhone: string
  followUpCount: number
  clientEmail?: string | null
  mapsLink?: string | null
  event?: {
    customName?: string | null
    location?: { mapsLink?: string | null } | null
    musicians?: any[]
  } | null
  notifications?: {
    admin: string
    client: string
    musicians: string
  }
  contractStatus?: string
  client?: { whatsapp?: string | null; name?: string | null } | null
  payments?: any[]
}

const formatTotal = (r: any) => {
  const base = Number(r.agreedAmount || r.packagePrice || 0)
  const iva = r.requiresInvoice ? Number(r.ivaAmount || 0) : 0
  return formatCurrency(base + iva)
}

const getDynamicPaymentStatus = (r: Booking) => {
  const total = Number(r.baseAmount) + Number(r.viaticosAmount || 0);
  const deposit = Number(r.depositAmount || 0);
  const paid = (r.payments || []).filter((p: any) => p.status === 'completed' || p.status === 'paid').reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const balance = total - paid;
  
  if (paid === 0 && deposit === 0) return { label: "SIN ANTICIPO", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
  if (paid === 0) return { label: "PAGO PENDIENTE", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" };
  if (balance <= 0) return { label: "LIQUIDADO", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
  if (paid >= deposit) return { label: "ANTICIPO PAGADO", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
  return { label: "PAGO PARCIAL", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
}

type SortKey = "fecha" | "cliente" | "monto" | "estado"
type SortDir = "asc" | "desc"

export function VentasTableClient({ items, followUpTemplate }: { items: Booking[], followUpTemplate?: string | null }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [reactivatingBooking, setReactivatingBooking] = useState<any | null>(null)
  const [preConfirmData, setPreConfirmData] = useState<PreConfirmData | null>(null)
  const [isReactivating, setIsReactivating] = useState(false)
  const [search, setSearch] = useState("")
  const [columnFilters, setColumnFilters] = useState({
    cliente: "",
    id: ""
  })
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("fecha")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const router = useRouter()

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  const STATUS_LABELS: Record<string, string> = {
    all: "Todos", pendiente: "Pendiente", agendado: "Confirmado",
    completado: "Completado", cancelado: "Cancelado", EXPIRED: "Expirado"
  }

  const filtered = items
    .filter(b => {
      const name = (b.event?.customName || b.clientName).toLowerCase()
      const sid = (b.shortId || "").toLowerCase()
      const q = search.toLowerCase()
      
      // Global search
      const matchGlobal = !q || name.includes(q) || sid.includes(q)
      
      // Column filters
      const matchCliente = !columnFilters.cliente || name.includes(columnFilters.cliente.toLowerCase())
      const matchId = !columnFilters.id || sid.includes(columnFilters.id.toLowerCase())
      
      const matchStatus = statusFilter === "all" || b.status === statusFilter
      
      return matchGlobal && matchCliente && matchId && matchStatus
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortKey === "fecha") cmp = new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime()
      else if (sortKey === "cliente") cmp = (a.event?.customName || a.clientName).localeCompare(b.event?.customName || b.clientName)
      else if (sortKey === "monto") cmp = (Number(a.baseAmount) + Number(a.viaticosAmount || 0)) - (Number(b.baseAmount) + Number(b.viaticosAmount || 0))
      else if (sortKey === "estado") cmp = a.status.localeCompare(b.status)
      return sortDir === "asc" ? cmp : -cmp
    })

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40" />
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 ml-1 text-blue-400" /> : <ChevronDown className="w-3 h-3 ml-1 text-blue-400" />
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(i => i.id)))
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkDelete = async () => {
    setLoading(true)
    const ids = Array.from(selectedIds).join(",")
    try {
      const res = await fetch(`/api/booking?id=${ids}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        toast.success(`${json.count} registros eliminados correctamente`)
        setSelectedIds(new Set())
        router.refresh()
      } else {
        toast.error("Error al eliminar: " + (json.error || "Desconocido"))
      }
    } catch {
      toast.error("Error de conexión al servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string, bookingObj?: any) => {
    if (newStatus === "agendado" && bookingObj) {
      setPreConfirmData({
        bookingId: id,
        clientName: bookingObj.clientName || bookingObj.client?.name || "Cliente",
        clientPhone: (bookingObj.clientPhone && bookingObj.clientPhone !== "5500000000" && bookingObj.clientPhone !== "0000000000") ? bookingObj.clientPhone : (bookingObj.client?.whatsapp || ""),
        mapsLink: bookingObj.mapsLink || bookingObj.event?.location?.mapsLink || null,
        musiciansCount: bookingObj.event?.musicians?.length || 0,
      })
      return
    }

    setUpdatingId(id)
    try {
      const result = await updateBookingStatusAction(id, newStatus)
      if (result.success) { toast.success("Estado actualizado"); router.refresh() }
      else toast.error("Error: " + result.error)
    } catch { toast.error("Error de red") }
    finally { setUpdatingId(null) }
  }

  if (items.length === 0) return (
    <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl">
      <p className="text-muted-foreground">No hay solicitudes en esta categoría.</p>
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, evento o ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-card border border-border/40 rounded-xl text-sm text-foreground focus:outline-none focus:border-blue-600/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border/40 rounded-xl text-sm text-foreground focus:outline-none focus:border-blue-600/50 transition-colors min-w-[150px]"
        >
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="text-xs text-muted-foreground self-center whitespace-nowrap">
          {filtered.length} de {items.length} registros
        </div>
      </div>

      {/* Acciones masivas */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-600 font-bold text-sm">{selectedIds.size}</div>
            <p className="text-sm font-medium text-blue-600">Elementos seleccionados</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="gap-2 font-black h-9 px-4 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#D81B60] text-white hover:shadow-lg hover:shadow-pink-500/30 border-none">
                <Trash2 className="w-4 h-4" /> Eliminar Selección
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="bg-card border-border/40 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-500"><AlertTriangle className="w-5 h-5" /> ¿Confirmar eliminación masiva?</DialogTitle>
                <DialogDescription className="text-muted-foreground pt-2">
                  Estás por eliminar <strong>{selectedIds.size}</strong> registros permanentemente.
                  <span className="block mt-2 font-bold text-red-700">Esta acción no se puede deshacer.</span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <DialogClose asChild><Button variant="ghost" className="rounded-xl border-border/40">Cancelar</Button></DialogClose>
                <Button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Sí, eliminar todo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="bg-card border border-border/40 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse block md:table">
          <thead className="hidden md:table-header-group">
            <tr className="bg-blue-600/10 border-b border-border/40">
              <th className="px-6 py-4 w-12 text-center">
                <button onClick={toggleSelectAll} className="w-5 h-5 mx-auto rounded border border-border/40 flex items-center justify-center hover:border-blue-600/50 transition-colors">
                  {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-blue-600 fill-blue-600/10" /> : selectedIds.size > 0 ? <div className="w-2.5 h-0.5 bg-blue-600" /> : <Square className="w-4 h-4 text-gray-600" />}
                </button>
              </th>
              <th className="px-6 py-4">
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleSort("cliente")} className="flex items-center text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-400 transition-colors">
                    Cliente / ID <SortIcon col="cliente" />
                  </button>
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      placeholder="Filtro cliente..."
                      value={columnFilters.cliente}
                      onChange={e => setColumnFilters(prev => ({ ...prev, cliente: e.target.value }))}
                      className="w-full bg-muted/20 border border-border/20 rounded px-2 py-1 text-[10px] text-foreground focus:outline-none focus:border-blue-500/30"
                    />
                    <input 
                      type="text" 
                      placeholder="ID..."
                      value={columnFilters.id}
                      onChange={e => setColumnFilters(prev => ({ ...prev, id: e.target.value }))}
                      className="w-16 bg-muted/20 border border-border/20 rounded px-2 py-1 text-[10px] text-foreground focus:outline-none focus:border-blue-500/30"
                    />
                  </div>
                </div>
              </th>
              <th className="px-6 py-4">
                <button onClick={() => handleSort("fecha")} className="flex items-center text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-400 transition-colors">
                  Fecha / Paquete <SortIcon col="fecha" />
                </button>
              </th>
              <th className="px-6 py-4">
                <button onClick={() => handleSort("monto")} className="flex items-center text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-400 transition-colors">
                  Monto Total <SortIcon col="monto" />
                </button>
              </th>
              <th className="px-6 py-4 text-center">
                <button onClick={() => handleSort("estado")} className="flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-400 transition-colors mx-auto">
                  Estado <SortIcon col="estado" />
                </button>
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-center">Contrato</th>
              <th className="px-6 py-4 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-right">Opciones</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group divide-y-0 md:divide-y md:divide-white/5 p-4 md:p-0 space-y-4 md:space-y-0">
            {filtered.length === 0 && (
              <tr className="block md:table-row"><td colSpan={6} className="block md:table-cell px-6 py-12 text-center text-muted-foreground text-sm">Sin resultados para la búsqueda actual.</td></tr>
            )}
            {filtered.map(reserva => (
              <tr 
                key={reserva.id} 
                className={`flex flex-col md:table-row bg-card md:bg-transparent border border-border/40 md:border-b md:border-x-0 md:border-t-0 rounded-2xl md:rounded-none mb-6 md:mb-0 align-top hover:bg-blue-600/5 transition-colors group relative overflow-hidden shadow-sm md:shadow-none ${selectedIds.has(reserva.id) ? 'bg-blue-600/5 ring-1 ring-blue-600/20' : ''}`}
              >
                <td className="flex justify-between md:table-cell p-4 md:py-4 md:px-6 border-b border-border/10 md:border-none items-center bg-muted/5 md:bg-transparent">
                  <button 
                    onClick={() => toggleSelect(reserva.id)}
                    className="w-5 h-5 rounded border border-border/40 flex items-center justify-center hover:border-blue-600/50 transition-colors"
                  >
                    {selectedIds.has(reserva.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 fill-blue-600/10" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </td>
                <td className="flex flex-col md:table-cell p-4 md:py-4 md:px-6 border-b border-border/10 md:border-none items-start">
                  <Link 
                    href={`/admin/ventas/${reserva.id}`}
                    className="font-bold text-foreground hover:text-primary hover:underline transition-colors block truncate max-w-[200px] md:max-w-none"
                    title={reserva.event?.customName || reserva.clientName}
                  >
                    {reserva.event?.customName || reserva.clientName}
                  </Link>
                  {reserva.event?.customName && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px] md:max-w-none" title={reserva.clientName}>{reserva.clientName}</div>
                  )}
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {(() => {
                      const phone = getValidWhatsappPhone(reserva?.client?.whatsapp || reserva?.clientPhone || "");
                      return phone ? phone : "El teléfono del cliente no es válido o está vacío. Revisa el número en el detalle de la venta.";
                    })()}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{reserva.shortId || "S/F"}</div>
                </td>
                <td className="flex flex-col md:table-cell p-4 md:py-4 md:px-6 border-b border-border/10 md:border-none items-start gap-1">
                  <div className="text-sm text-foreground flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    {formatDateMX(reserva.requestedDate, "dd/MM/yyyy")}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{reserva.packageName}</div>
                </td>
                <td className="flex flex-row md:table-cell p-4 md:py-4 md:px-6 border-b border-border/10 md:border-none items-center md:items-start font-mono gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-black text-foreground">{formatCurrency(Number(reserva.baseAmount) + Number(reserva.viaticosAmount || 0))}</div>
                    {(() => {
                      const st = getDynamicPaymentStatus(reserva)
                      return (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter whitespace-nowrap ${st.color}`}>
                          {st.label}
                        </span>
                      )
                    })()}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Anticipo: {formatCurrency(Number(reserva.depositAmount))}</div>
                </td>
                <td className="flex justify-between md:table-cell px-2 py-3 md:px-6 md:py-4 border-b border-border/10 md:border-none items-center md:text-center">
                  <StatusSwitcher 
                    status={reserva.status} 
                    id={reserva.id} 
                    reserva={reserva}
                    onStatusChange={handleStatusChange}
                    isUpdating={updatingId === reserva.id}
                  />
                </td>
                <td className="flex flex-col items-center justify-center md:table-cell p-4 md:py-4 md:px-6 border-b border-border/10 md:border-none text-center">
                  <ContractStatusSwitcher 
                    bookingId={reserva.id} 
                    status={reserva.contractStatus || "pending"} 
                  />
                </td>
                <td className="flex justify-end md:table-cell p-4 md:py-4 md:px-6 text-right md:pr-8 bg-muted/5 md:bg-transparent">
                  <div className="flex justify-end items-center gap-1.5 flex-wrap">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted/50 rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-background/95 backdrop-blur-md border-border/40 shadow-xl rounded-xl p-2">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground px-2 py-1.5">Gestión de Evento</DropdownMenuLabel>
                        
                        <Link href={`/admin/ventas/${reserva.id}`}>
                          <DropdownMenuItem className="gap-3 cursor-pointer rounded-lg focus:bg-blue-600/10 py-2.5">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground/80">Ver Detalles Completos</span>
                              <span className="text-[9px] text-muted-foreground">Logística, pagos y contratos</span>
                            </div>
                          </DropdownMenuItem>
                        </Link>

                          {(reserva.status === "pendiente" || reserva.status === "pending") && (
                            <DropdownMenuItem 
                              className="gap-3 cursor-pointer rounded-lg focus:bg-green-500/10 py-2.5"
                              onClick={() => {
                                setPreConfirmData({
                                  bookingId: reserva.id,
                                  clientName: reserva.clientName || reserva.client?.name || "Cliente",
                                  clientPhone: (reserva.clientPhone && reserva.clientPhone !== "5500000000" && reserva.clientPhone !== "0000000000") ? reserva.clientPhone : (reserva.client?.whatsapp || ""),
                                  mapsLink: reserva.mapsLink || reserva.event?.location?.mapsLink || null,
                                  musiciansCount: reserva.event?.musicians?.length || 0,
                                })
                              }}
                            >
                              <UserCheck className="w-4 h-4 text-green-600" />
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-green-600">Confirmar y Agendar</span>
                                <span className="text-[9px] text-muted-foreground">Mover a eventos confirmados</span>
                              </div>
                            </DropdownMenuItem>
                          )}

                          {reserva.status === "EXPIRED" && (
                            <DropdownMenuItem 
                              className="gap-3 cursor-pointer rounded-lg focus:bg-orange-500/10 py-2.5"
                              onClick={() => setReactivatingBooking(reserva)}
                            >
                              <RefreshCw className="w-4 h-4 text-orange-600" />
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-orange-600">Reactivar Contrato</span>
                                <span className="text-[9px] text-muted-foreground">Recuperar venta expirada</span>
                              </div>
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator className="bg-border/40 my-1" />
                      
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground px-2 py-1.5">Comunicación (WhatsApp)</DropdownMenuLabel>
                        
                        <div className="space-y-0.5">
                          <NotificationSemaphore 
                            bookingId={reserva.id}
                            stats={reserva.notifications}
                            variant="dropdown"
                          />
                          <FollowUpButton 
                            id={reserva.id}
                            type="booking"
                            phone={getValidWhatsappPhone(reserva?.client?.whatsapp || reserva?.clientPhone || "") ?? ""}
                            clientName={reserva.clientName || reserva.client?.name || "Cliente"}
                            currentCount={reserva.followUpCount}
                            template={followUpTemplate || undefined}
                            variant="dropdown"
                          />
                        </div>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialogo de Reactivación */}
      <Dialog open={!!reactivatingBooking} onOpenChange={(open) => !open && setReactivatingBooking(null)}>
        <DialogContent className="max-w-md bg-background border-border shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-primary animate-spin-slow" />
              Reactivar Cotización
            </DialogTitle>
            <DialogDescription>
              La reserva de <strong>{reactivatingBooking?.clientName}</strong> ha expirado.
              ¿Cómo deseas proceder con la reactivación?
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Button 
              className="h-auto flex flex-col items-start gap-1 p-4 text-left justify-start bg-primary/5 hover:bg-primary/10 border-primary/20 border text-foreground"
              disabled={isReactivating}
              onClick={async () => {
                setIsReactivating(true)
                try {
                  const res = await reactivateBookingAction(reactivatingBooking.id)
                  if (res.success) {
                    toast.success("Reserva reactivada con éxito")
                    setReactivatingBooking(null)
                    router.refresh()
                  } else {
                    toast.error(res.error || "Error al reactivar")
                  }
                } catch {
                  toast.error("Error de conexión")
                } finally {
                  setIsReactivating(false)
                }
              }}
            >
              <span className="font-bold text-sm">Mismo Presupuesto</span>
              <span className="text-[10px] text-muted-foreground">Mantiene los precios actuales y vuelve a estado pendiente por 15 días más.</span>
              {isReactivating && <Loader2 className="w-4 h-4 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />}
            </Button>

            <Button 
              variant="outline"
              className="h-auto flex flex-col items-start gap-1 p-4 text-left justify-start hover:bg-blue-600/5 border-blue-600/20"
              onClick={() => {
                router.push(`/admin/ventas/manual?reactivateId=${reactivatingBooking.id}`)
                setReactivatingBooking(null)
              }}
            >
              <span className="font-bold text-sm text-blue-600">Cambiar Datos / Presupuesto</span>
              <span className="text-[10px] text-muted-foreground">Redirige al formulario manual pre-llenado para ajustar precios, fechas o servicios.</span>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setReactivatingBooking(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Pre-Confirmación */}
      {preConfirmData && (
        <PreConfirmChecklist
          data={preConfirmData}
          isOpen={!!preConfirmData}
          onOpenChange={(open) => !open && setPreConfirmData(null)}
          onConfirm={async () => {
            if (preConfirmData?.bookingId) {
              await handleStatusChange(preConfirmData.bookingId, 'agendado')
            }
          }}
        />
      )}
    </div>
  )
}

function NotificationSemaphore({ bookingId, stats, variant = "default" }: { bookingId: string, stats?: any, variant?: "default" | "dropdown" }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleResend = async (type: "admin" | "client" | "musician") => {
    if (!window.confirm(`¿Estás seguro que deseas reenviar la notificación automática para: ${type}?`)) return;
    setLoading(type)
    try {
      const res = await resendNotificationAction(bookingId, type)
      if (res.success) toast.success(res.message || `Notificación de ${type} reenviada`)
      else toast.error(res.error || "Error al reenviar")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'sent') return 'text-green-500 bg-green-500/10 border-green-500/20'
    if (status === 'failed') return 'text-red-500 bg-red-500/10 border-red-500/20 animate-pulse cursor-pointer hover:bg-red-500/20'
    return 'text-muted-foreground bg-muted/10 border-border/20 cursor-pointer hover:bg-blue-600/10'
  }

  if (variant === "dropdown") {
    return (
      <>
        <DropdownMenuItem 
          className="gap-2 cursor-pointer rounded-lg focus:bg-primary/10"
          onClick={() => handleResend('musician')}
          disabled={loading === 'musician'}
        >
          {loading === 'musician' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className={`w-4 h-4 ${stats?.musicians === 'sent' ? 'text-green-500' : 'text-muted-foreground'}`} />}
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Notificar Músicos (WhatsApp)</span>
            <span className="text-[9px] text-muted-foreground">Envía convocatoria con horarios y vestimenta</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className="gap-2 cursor-pointer rounded-lg focus:bg-primary/10"
          onClick={() => handleResend('client')}
        >
          {loading === 'client' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className={`w-4 h-4 ${stats?.client === 'sent' ? 'text-green-500' : 'text-muted-foreground'}`} />}
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Enviar Cotización / Seguimiento</span>
            <span className="text-[9px] text-muted-foreground">Envía link de estatus al cliente</span>
          </div>
        </DropdownMenuItem>
      </>
    )
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      {/* Admin */}
      <button 
        onClick={() => handleResend('admin')}
        disabled={loading === 'admin'}
        title="Admin: Aviso de venta"
        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${getStatusColor(stats?.admin)}`}
      >
        {loading === 'admin' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
      </button>

      {/* Client */}
      <button 
        onClick={() => handleResend('client')}
        disabled={loading === 'client'}
        title="Cliente: Cotización / Seguimiento"
        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${getStatusColor(stats?.client)}`}
      >
        {loading === 'client' ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
      </button>

      {/* Musicians */}
      <button 
        onClick={() => handleResend('musician')}
        disabled={loading === 'musician'}
        title="Músicos: Convocatoria"
        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${getStatusColor(stats?.musicians)}`}
      >
        {loading === 'musician' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

function StatusSwitcher({ status, id, onStatusChange, isUpdating, reserva }: { 
  status: string, 
  id: string, 
  onStatusChange: (id: string, s: string, booking?: any) => void,
  isUpdating: boolean,
  reserva?: any
}) {
  const configs: any = {
    pendiente:  { color: "text-yellow-600 border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20", label: "Pendiente" },
    agendado:   { color: "text-green-600 border-green-500/40 bg-green-500/10 hover:bg-green-500/20", label: "Confirmado" },
    completado: { color: "text-blue-600 border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20", label: "Completado" },
    cancelado:  { color: "text-red-600 border-red-500/40 bg-red-500/10 hover:bg-red-500/20", label: "Cancelado" },
    EXPIRED:    { color: "text-muted-foreground border-gray-700 bg-gray-800/50 hover:bg-gray-800/70", label: "Expirado" },
  }
  
  const cfg = configs[status] || configs.pendiente

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          disabled={isUpdating}
          className={`${cfg.color} border px-2 py-1 text-[10px] rounded-md font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 mx-auto disabled:opacity-50`}
        >
          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {cfg.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="bg-card border-border/40 backdrop-blur-xl min-w-[140px]">
        {Object.entries(configs).map(([key, value]: [string, any]) => (
          <DropdownMenuItem 
            key={key}
            onClick={() => onStatusChange(id, key, reserva)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-blue-600/10"
          >
            <div className={`w-2 h-2 rounded-full ${value.color.split(' ')[0].replace('text-', 'bg-')}`} />
            {value.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
