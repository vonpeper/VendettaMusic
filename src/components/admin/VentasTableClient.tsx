"use client"

import { useState, useEffect } from "react"
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
  RefreshCw,
  Phone,
  PhoneCall,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  Check,
  Ban,
  MessageCircle
} from "lucide-react"
import { resendNotificationAction } from "@/actions/notifications"
import { getValidWhatsappPhone } from "@/lib/phone"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
import { formatDateMX, formatCurrency, cn } from "@/lib/utils"
import { 
  updateBookingStatusAction, 
  reactivateBookingAction,
  markLeadContactedAction,
  scheduleLeadCallAction,
  confirmDepositPaidAction,
  discardLeadAction
} from "@/actions/ventas"
import { FollowUpButton } from "./FollowUpButton"
import { ContractStatusSwitcher } from "./ContractStatusSwitcher"
import { PreConfirmChecklist, PreConfirmData } from "./PreConfirmChecklist"

interface Booking {
  id: string
  shortId: string | null
  clientName: string
  customName?: string | null
  requestedDate: Date | string
  packageName: string
  baseAmount: number
  viaticosAmount: number
  discountAmount?: number | null
  depositAmount: number
  guestCount?: number
  createdAt?: Date | string
  lineItems?: any[]
  invoice?: boolean
  originalPrice?: number | null
  status: string
  paymentStatus?: string
  clientPhone: string
  followUpCount: number
  clientEmail?: string | null
  mapsLink?: string | null
  city?: string | null
  state?: string | null
  address?: string | null
  cancellationReason?: string | null
  closedAt?: Date | string | null
  event?: {
    customName?: string | null
    location?: { mapsLink?: string | null } | null
    musicians?: any[]
    invoice?: boolean | null
  } | null
  notifications?: {
    admin: string
    client: string
    musicians: string
  }
  contractStatus?: string
  client?: { whatsapp?: string | null; name?: string | null } | null
  payments?: any[]
  adminNote?: string | null
}

export const calculateBookingFinancials = (r: Booking) => {
  const lineItemsTotal = (r.lineItems || []).reduce((acc: number, it: any) => acc + Number(it.lineTotal || (it.quantity * it.unitCost) || 0), 0)
  const subtotal = Math.max(0, Number(r.baseAmount || 0) + Number(r.viaticosAmount || 0) + lineItemsTotal - Number(r.discountAmount || 0))
  const hasInvoice = Boolean(r.event?.invoice || r.invoice)
  const iva = hasInvoice ? Math.round(subtotal * 0.16 * 100) / 100 : 0
  const total = subtotal + iva
  const requiredDeposit = Math.round(total * 0.3)
  return { subtotal, iva, total, lineItemsTotal, requiredDeposit }
}

const formatTotal = (r: any) => {
  const base = Number(r.agreedAmount || r.packagePrice || 0)
  const iva = r.requiresInvoice ? Number(r.ivaAmount || 0) : 0
  return formatCurrency(base + iva)
}

export const getDynamicPaymentStatus = (r: Booking) => {
  const { total, requiredDeposit } = calculateBookingFinancials(r)
  const deposit = Number(r.depositAmount || 0) > 0 ? Number(r.depositAmount) : requiredDeposit
  const paid = (r.payments || []).filter((p: any) => p.status === 'completed' || p.status === 'paid').reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const balance = total - paid
  
  if (total === 0) return { label: "POR COTIZAR", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
  if (paid === 0 && deposit === 0) return { label: "SIN ANTICIPO", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" }
  if (paid === 0) return { label: "ANTICIPO PENDIENTE (30%)", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" }
  if (balance <= 0) return { label: "LIQUIDADO", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
  if (paid >= deposit) return { label: "ANTICIPO PAGADO (30%)", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }
  return { label: "PAGO PARCIAL", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" }
}

export function formatDaysRemaining(targetDate: Date | string) {
  const d = new Date(targetDate)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const diffDays = Math.round((dMidnight - nowMidnight) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return { text: "Hoy", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
  if (diffDays === 1) return { text: "Mañana", color: "text-amber-300 bg-amber-500/10 border-amber-500/20" }
  if (diffDays > 1) return { text: `En ${diffDays} días`, color: diffDays <= 7 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-blue-400 bg-blue-500/10 border-blue-500/20" }
  return { text: `Pasado hace ${Math.abs(diffDays)}d`, color: "text-muted-foreground bg-muted/20 border-border/40" }
}

export function getWhatsAppDirectUrl(phone: string, clientName: string, shortId?: string | null) {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return null
  const cleanPhone = digits.length === 10 ? `52${digits}` : digits
  const greeting = `Hola ${clientName.trim()} 👋 Te saludamos del equipo de Vendetta Live Music respecto a tu solicitud${shortId ? ` (${shortId})` : ""}. ¿Tienes un momento para conversar sobre tu evento?`
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`
}

export function getWhatsAppClosureUrl(phone: string, clientName: string, eventDate?: Date | string | null) {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return null
  const cleanPhone = digits.length === 10 ? `52${digits}` : digits
  const formattedDate = eventDate ? formatDateMX(new Date(eventDate), "dd 'de' MMMM") : "acordada"
  const message = `Hola ${clientName.trim()}, para mantener actualizada nuestra agenda liberamos la fecha tentativa del ${formattedDate}. Si en el futuro retoman el evento, con gusto volvemos a cotizar. ¡Mucho éxito con su fiesta!`
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export const DISCARD_REASONS = [
  "Fuera de presupuesto",
  "Contrató a otra banda",
  "Evento cancelado",
  "Sin respuesta"
] as const

type SortKey = "fecha" | "cliente" | "monto" | "estado"
type SortDir = "asc" | "desc"

export function VentasTableClient({ items, followUpTemplate }: { items: Booking[], followUpTemplate?: string | null }) {
  const [localItems, setLocalItems] = useState<Booking[]>(items)
  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [reactivatingBooking, setReactivatingBooking] = useState<any | null>(null)
  const [preConfirmData, setPreConfirmData] = useState<PreConfirmData | null>(null)
  const [isReactivating, setIsReactivating] = useState(false)
  const [search, setSearch] = useState("")
  const [columnFilters, setColumnFilters] = useState({
    cliente: "",
    id: ""
  })
  const [statusFilter, setStatusFilter] = useState("all")
  const [tabFilter, setTabFilter] = useState<"all" | "activos" | "confirmados" | "expirados_cancelados">("all")
  const [discardTargetLead, setDiscardTargetLead] = useState<Booking | null>(null)
  const [selectedDiscardReason, setSelectedDiscardReason] = useState<string>("Fuera de presupuesto")
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("fecha")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const router = useRouter()

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  const STATUS_LABELS: Record<string, string> = {
    all: "Todos",
    pendiente_aprobacion: "Pendiente de Aprobación",
    propuesta_enviada: "Propuesta Enviada",
    requiere_llamada: "Requiere Llamada",
    contactado: "Contactado",
    llamada_agendada: "Llamada Agendada",
    pendiente: "Pendiente",
    agendado: "Confirmado",
    completado: "Completado",
    cancelado: "Cancelado",
    expirado: "Expirado",
    no_interesado: "No Interesado",
    EXPIRED: "Expirado"
  }

  const filtered = localItems
    .filter(b => {
      const s = b.status?.toLowerCase() || ""
      let matchTab = true
      if (tabFilter === "activos") {
        matchTab = ["pendiente_aprobacion", "propuesta_enviada", "requiere_llamada", "contactado", "llamada_agendada", "pendiente", "pending", "cotizado", "new"].includes(s)
      } else if (tabFilter === "confirmados") {
        matchTab = ["agendado", "completado"].includes(s)
      } else if (tabFilter === "expirados_cancelados") {
        matchTab = ["expirado", "expired", "cancelado", "no_interesado"].includes(s)
      }

      const eventTitle = (b.event?.customName || b.customName || "").toLowerCase()
      const clientName = (b.clientName || "").toLowerCase()
      const sid = (b.shortId || "").toLowerCase()
      const phoneDigits = (b.clientPhone || b.client?.whatsapp || "").replace(/\D/g, "")
      const email = (b.clientEmail || "").toLowerCase()
      const city = (b.city || b.address || "").toLowerCase()
      const pkg = (b.packageName || "").toLowerCase()
      const note = (b.adminNote || "").toLowerCase()

      const q = search.toLowerCase().trim()
      const qDigits = q.replace(/\D/g, "")
      
      // Global search: coincide con nombre, evento, id, teléfono, correo, ciudad, paquete o nota
      const matchGlobal = !q || 
        eventTitle.includes(q) || 
        clientName.includes(q) || 
        sid.includes(q) || 
        (qDigits.length >= 3 && phoneDigits.includes(qDigits)) ||
        email.includes(q) ||
        city.includes(q) ||
        pkg.includes(q) ||
        note.includes(q)
      
      // Column filters
      const matchCliente = !columnFilters.cliente || 
        clientName.includes(columnFilters.cliente.toLowerCase()) || 
        eventTitle.includes(columnFilters.cliente.toLowerCase())
      const matchId = !columnFilters.id || sid.includes(columnFilters.id.toLowerCase())
      
      const matchStatus = statusFilter === "all" || b.status === statusFilter
      
      return matchTab && matchGlobal && matchCliente && matchId && matchStatus
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortKey === "fecha") cmp = new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime()
      else if (sortKey === "cliente") cmp = (a.event?.customName || a.customName || a.clientName).localeCompare(b.event?.customName || b.customName || b.clientName)
      else if (sortKey === "monto") cmp = calculateBookingFinancials(a).total - calculateBookingFinancials(b).total
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

    if (newStatus === "cancelado") {
      const leadToCancel = bookingObj || localItems.find(b => b.id === id)
      if (leadToCancel) {
        setDiscardTargetLead(leadToCancel)
        setSelectedDiscardReason("Fuera de presupuesto")
        return
      }
    }

    setUpdatingId(id)
    try {
      const result = await updateBookingStatusAction(id, newStatus)
      if (result.success) { 
        toast.success("Estado actualizado")
        setLocalItems(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
        router.refresh() 
      }
      else toast.error("Error: " + result.error)
    } catch { toast.error("Error de red") }
    finally { setUpdatingId(null) }
  }

  const handleDiscardLead = async (lead: Booking, reason: string) => {
    setIsDiscarding(true)
    try {
      const res = await discardLeadAction({ bookingId: lead.id, reason })
      if (res.success) {
        toast.success(`Lead descartado: "${reason}"`, {
          description: `Se liberó la fecha tentativa de ${lead.clientName}.`
        })
        setLocalItems(prev => prev.map(b => b.id === lead.id ? {
          ...b,
          status: "cancelado",
          cancellationReason: reason,
          closedAt: new Date()
        } : b))
        setDiscardTargetLead(null)
        router.refresh()
      } else {
        toast.error("Error al descartar lead", { description: res.error })
      }
    } catch (err: any) {
      toast.error("Error al descartar", { description: err.message })
    } finally {
      setIsDiscarding(false)
    }
  }

  const handleMarkContacted = async (leadId: string) => {
    setActionLoadingId(leadId)
    try {
      const res = await markLeadContactedAction(leadId)
      if (res.success) {
        toast.success("Lead marcado como contactado")
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo actualizar")
      }
    } catch {
      toast.error("Error de red")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleScheduleCall = async (leadId: string) => {
    const note = window.prompt("Notas de la llamada técnica (opcional):", "Llamada acordada por WhatsApp")
    if (note === null) return
    setActionLoadingId(leadId)
    try {
      const res = await scheduleLeadCallAction(leadId, note)
      if (res.success) {
        toast.success("Llamada técnica agendada")
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo agendar la llamada")
      }
    } catch {
      toast.error("Error de red")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleConfirmDeposit = async (lead: Booking) => {
    const financials = calculateBookingFinancials(lead)
    const requiredDeposit = Math.round(financials.total * 0.3)
    const depositToConfirm = Number(lead.depositAmount || 0) > 0 ? Number(lead.depositAmount) : requiredDeposit
    const confirmMsg = `¿Confirmar anticipo de ${formatCurrency(depositToConfirm)} para ${lead.clientName}? Esto confirmará el evento y habilitará el contrato legal.`
    if (!window.confirm(confirmMsg)) return
    
    setActionLoadingId(lead.id)
    try {
      const res = await confirmDepositPaidAction(lead.id)
      if (res.success) {
        toast.success("¡Anticipo del 30% confirmado! Evento agendado con éxito.")
        router.refresh()
      } else {
        toast.error(res.error || "Error al confirmar anticipo")
      }
    } catch {
      toast.error("Error de red")
    } finally {
      setActionLoadingId(null)
    }
  }

  const activeLeads = localItems.filter(b => {
    const s = b.status?.toLowerCase() || ""
    return (
      s === "pendiente_aprobacion" ||
      s === "propuesta_enviada" ||
      s === "requiere_llamada" ||
      s === "contactado" ||
      s === "llamada_agendada" ||
      s === "pendiente" ||
      s === "pending" ||
      s === "new"
    )
  }).sort((a, b) => {
    const priority = (st: string) => {
      if (st === "pendiente_aprobacion") return 3
      if (st === "requiere_llamada") return 2
      if (st === "propuesta_enviada") return 1
      return 0
    }
    const prioDiff = priority(b.status) - priority(a.status)
    if (prioDiff !== 0) return prioDiff
    const dateA = a.createdAt ? new Date((a as any).createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date((b as any).createdAt).getTime() : 0
    return dateB - dateA
  })

  if (localItems.length === 0) return (
    <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl">
      <p className="text-muted-foreground">No hay solicitudes en esta categoría.</p>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* SECCIÓN PRIORITARIA: LEADS NUEVOS / POR CONTACTAR */}
      {activeLeads.length > 0 && (
        <div className="space-y-4 bg-card/40 border border-border/40 p-5 md:p-6 rounded-3xl backdrop-blur-sm shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-heading font-black text-foreground tracking-tight">
                    Leads Nuevos / Por Contactar
                  </h2>
                  <Badge variant="outline" className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-xs font-black">
                    {activeLeads.length} {activeLeads.length === 1 ? "lead activo" : "leads activos"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Prospectos y cotizaciones recientes ordenados por llegada. Contacta vía WhatsApp, agenda llamada técnica o confirma su anticipo.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
            {activeLeads.map(lead => {
              const isSpecial = (lead.guestCount && lead.guestCount > 100) ||
                lead.status === "requiere_llamada" ||
                lead.packageName?.includes("Especial") ||
                lead.packageName?.includes(">100")
              
              const financials = calculateBookingFinancials(lead)
              const requiredDeposit = Math.round(financials.total * 0.3)
              const paymentStatus = getDynamicPaymentStatus(lead)
              const daysRemaining = formatDaysRemaining(lead.requestedDate)
              const cleanPhone = lead.client?.whatsapp || lead.clientPhone || ""
              const waUrl = getWhatsAppDirectUrl(cleanPhone, lead.clientName, lead.shortId)
              const isActionLoading = actionLoadingId === lead.id

              return (
                <div 
                  key={`lead-card-${lead.id}`}
                  className="bg-card border border-border/40 hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5 group relative overflow-hidden"
                >
                  <div>
                    {/* Top Row: Type Badge + ShortId */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {lead.status === "pendiente_aprobacion" ? (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-black uppercase tracking-wider gap-1.5 hover:bg-amber-500/20">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Pendiente Aprobación
                        </Badge>
                      ) : lead.status === "propuesta_enviada" ? (
                        <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px] font-black uppercase tracking-wider gap-1.5 hover:bg-cyan-500/20">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                          Propuesta Enviada
                        </Badge>
                      ) : isSpecial ? (
                        <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] font-black uppercase tracking-wider gap-1.5 hover:bg-purple-500/20">
                          <PhoneCall className="w-3 h-3 text-purple-400" />
                          Producción Especial &gt;100 pax
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] font-black uppercase tracking-wider gap-1.5 hover:bg-blue-500/20">
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          Essential ≤100 pax
                        </Badge>
                      )}
                      <span className="font-mono text-[11px] font-black text-muted-foreground">{lead.shortId || "S/F"}</span>
                    </div>

                    {/* Client Name & WhatsApp direct */}
                    <div className="space-y-1 mb-3">
                      <Link 
                        href={`/admin/ventas/${lead.id}`}
                        className="font-black text-base text-foreground hover:text-primary transition-colors leading-tight line-clamp-1 block"
                        title={lead.clientName}
                      >
                        {lead.clientName}
                      </Link>
                      
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          {cleanPhone || "Sin teléfono"}
                        </span>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all hover:scale-[1.02] shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Abrir WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Event Logistics: Date, Days remaining, Location, Pax */}
                    <div className="p-3 bg-muted/20 rounded-xl space-y-2 border border-border/20 text-xs mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          {formatDateMX(lead.requestedDate, "d 'de' MMMM, yyyy")}
                        </span>
                        {daysRemaining && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${daysRemaining.color}`}>
                            {daysRemaining.text}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">
                          {lead.city || lead.address || "Ubicación por definir"}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-foreground whitespace-nowrap">
                          {lead.guestCount && lead.guestCount > 0 ? `${lead.guestCount} pax` : "Aforo por definir"}
                        </span>
                      </div>

                      {lead.adminNote && (
                        <div className="pt-1 border-t border-border/10 text-[10px] text-muted-foreground line-clamp-2 italic">
                          {lead.adminNote}
                        </div>
                      )}
                    </div>

                    {/* Financial Estimates */}
                    <div className="p-3 bg-card border border-border/30 rounded-xl mb-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Inversión Estimada:</span>
                        <span className="text-sm font-black text-foreground font-mono">
                          {financials.total > 0 ? formatCurrency(financials.total) : "Por cotizar en llamada"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Anticipo Requerido (30%):</span>
                        <span className="text-xs font-bold text-foreground font-mono">
                          {financials.total > 0 ? formatCurrency(requiredDeposit) : "30% al agendar"}
                        </span>
                      </div>
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Estado Anticipo:</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${paymentStatus.color}`}>
                          {paymentStatus.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick 1-Click Action Buttons */}
                  <div className="pt-3 border-t border-border/30 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={lead.status === "contactado" ? "secondary" : "outline"}
                        disabled={isActionLoading || lead.status === "contactado"}
                        onClick={() => handleMarkContacted(lead.id)}
                        className={`h-9 text-xs font-bold rounded-xl transition-all ${lead.status === "contactado" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "border-border/40 hover:bg-cyan-500/10 hover:text-cyan-400"}`}
                      >
                        {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                        {lead.status === "contactado" ? "Contactado ✓" : "Contactado"}
                      </Button>

                      <Button
                        size="sm"
                        variant={lead.status === "llamada_agendada" ? "secondary" : "outline"}
                        disabled={isActionLoading}
                        onClick={() => handleScheduleCall(lead.id)}
                        className={`h-9 text-xs font-bold rounded-xl transition-all ${lead.status === "llamada_agendada" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30" : "border-border/40 hover:bg-indigo-500/10 hover:text-indigo-400"}`}
                      >
                        {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <PhoneCall className="w-3 h-3 mr-1" />}
                        {lead.status === "llamada_agendada" ? "Llamada ✓" : "Agendar Llamada"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        disabled={isActionLoading}
                        onClick={() => handleConfirmDeposit(lead)}
                        className="h-9 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm"
                      >
                        {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                        Confirmar Anticipo
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-9 text-xs font-bold rounded-xl border-border/40 hover:bg-blue-600/10 hover:text-blue-400"
                      >
                        <Link href={`/admin/ventas/${lead.id}`}>
                          <Eye className="w-3 h-3 mr-1" /> Ver Ficha / Editar
                        </Link>
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/20">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDiscardTargetLead(lead)
                          setSelectedDiscardReason("Fuera de presupuesto")
                        }}
                        disabled={isActionLoading}
                        className="h-7 px-2 text-[11px] font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors gap-1"
                      >
                        <Ban className="w-3 h-3" />
                        Descartar / Cancelar
                      </Button>

                      <span className="text-[10px] text-muted-foreground/60 font-mono">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("es-MX", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pestañas Rápidas de Navegación de Tabla */}
      <div className="flex flex-wrap items-center gap-1.5 bg-card/60 p-1.5 rounded-2xl border border-border/30 w-fit">
        <button
          onClick={() => { setTabFilter("all"); setStatusFilter("all") }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-1.5",
            tabFilter === "all"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <span>Todos</span>
          <span className="text-[10px] opacity-80 font-mono">({localItems.length})</span>
        </button>

        <button
          onClick={() => { setTabFilter("activos"); setStatusFilter("all") }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-1.5",
            tabFilter === "activos"
              ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <span>Activos</span>
          <span className="text-[10px] opacity-80 font-mono">
            ({localItems.filter(b => ["pendiente_aprobacion", "propuesta_enviada", "requiere_llamada", "contactado", "llamada_agendada", "pendiente", "pending", "cotizado", "new"].includes(b.status?.toLowerCase())).length})
          </span>
        </button>

        <button
          onClick={() => { setTabFilter("confirmados"); setStatusFilter("all") }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-1.5",
            tabFilter === "confirmados"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <span>Confirmados</span>
          <span className="text-[10px] opacity-80 font-mono">
            ({localItems.filter(b => ["agendado", "completado"].includes(b.status?.toLowerCase())).length})
          </span>
        </button>

        <button
          onClick={() => { setTabFilter("expirados_cancelados"); setStatusFilter("all") }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-1.5",
            tabFilter === "expirados_cancelados"
              ? "bg-red-600 text-white shadow-sm shadow-red-600/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          <span>Expirados / Cancelados</span>
          <span className="text-[10px] opacity-80 font-mono">
            ({localItems.filter(b => ["expirado", "expired", "cancelado", "no_interesado"].includes(b.status?.toLowerCase())).length})
          </span>
        </button>
      </div>

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
              <Button variant="default" size="sm" className="gap-2 font-black h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 border-none">
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

      <div className="bg-card border border-border/40 rounded-2xl overflow-x-auto shadow-sm custom-scrollbar">
        <table className="w-full text-left border-collapse block lg:table">
          <thead className="hidden lg:table-header-group">
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
          <tbody className="block lg:table-row-group divide-y-0 lg:divide-y lg:divide-white/5 p-4 lg:p-0 space-y-4 lg:space-y-0">
            {filtered.length === 0 && (
              <tr className="block lg:table-row"><td colSpan={6} className="block lg:table-cell px-6 py-12 text-center text-muted-foreground text-sm">Sin resultados para la búsqueda actual.</td></tr>
            )}
            {filtered.map(reserva => (
              <tr 
                key={reserva.id} 
                className={`flex flex-col lg:table-row bg-card lg:bg-transparent border border-border/40 lg:border-b lg:border-x-0 lg:border-t-0 rounded-2xl lg:rounded-none mb-6 lg:mb-0 align-top hover:bg-blue-600/5 transition-colors group relative overflow-hidden shadow-sm lg:shadow-none ${selectedIds.has(reserva.id) ? 'bg-blue-600/5 ring-1 ring-blue-600/20' : ''}`}
              >
                <td className="flex justify-between lg:table-cell p-4 lg:py-4 lg:px-6 border-b border-border/10 lg:border-none items-center bg-muted/5 lg:bg-transparent">
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
                <td className="flex flex-col lg:table-cell p-4 lg:py-4 lg:px-6 border-b border-border/10 lg:border-none items-start">
                  <Link 
                    href={`/admin/ventas/${reserva.id}`}
                    className="font-bold text-foreground hover:text-primary hover:underline transition-colors block truncate max-w-[200px] lg:max-w-none"
                    title={reserva.event?.customName || reserva.customName || reserva.clientName}
                  >
                    {reserva.event?.customName || reserva.customName || reserva.clientName}
                  </Link>
                  {Boolean(reserva.event?.customName || reserva.customName) && (reserva.event?.customName || reserva.customName) !== reserva.clientName && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px] lg:max-w-none" title={reserva.clientName}>
                      👤 {reserva.clientName}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {(() => {
                      const phone = getValidWhatsappPhone(reserva?.client?.whatsapp || reserva?.clientPhone || "");
                      return phone ? phone : (reserva.clientPhone || "Sin teléfono");
                    })()}
                  </div>
                  <div className="text-[10px] text-primary font-mono mt-0.5 font-bold">{reserva.shortId || "S/F"}</div>
                  {reserva.city && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">📍 {reserva.city}</div>
                  )}
                  {reserva.adminNote?.includes("POR REVISAR") && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        ⚠️ Por Revisar (Producción)
                      </span>
                    </div>
                  )}
                  {Boolean(reserva.cancellationReason) && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-500/10 border border-red-500/30 text-red-400" title={reserva.cancellationReason || ""}>
                        Motivo: {reserva.cancellationReason}
                      </span>
                    </div>
                  )}
                </td>
                <td className="flex flex-col lg:table-cell p-4 lg:py-4 lg:px-6 border-b border-border/10 lg:border-none items-start gap-1">
                  <div className="text-sm text-foreground flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    {formatDateMX(reserva.requestedDate, "dd/MM/yyyy")}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{reserva.packageName}</div>
                </td>
                <td className="flex flex-row lg:table-cell p-4 lg:py-4 lg:px-6 border-b border-border/10 lg:border-none items-center lg:items-start font-mono gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-black text-foreground">{formatCurrency(calculateBookingFinancials(reserva).total)}</div>
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
                <td className="flex justify-between lg:table-cell px-2 py-3 lg:px-6 lg:py-4 border-b border-border/10 lg:border-none items-center lg:text-center">
                  <StatusSwitcher 
                    status={reserva.status} 
                    id={reserva.id} 
                    reserva={reserva}
                    onStatusChange={handleStatusChange}
                    isUpdating={updatingId === reserva.id}
                  />
                </td>
                <td className="flex flex-col items-center justify-center lg:table-cell p-4 lg:py-4 lg:px-6 border-b border-border/10 lg:border-none text-center">
                  <ContractStatusSwitcher 
                    bookingId={reserva.id} 
                    status={reserva.contractStatus || "pending"} 
                  />
                </td>
                <td className="flex justify-end lg:table-cell p-4 lg:py-4 lg:px-6 text-right lg:pr-8 bg-muted/5 lg:bg-transparent">
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

                          {(reserva.status === "EXPIRED" || reserva.status === "expirado") && (
                            <DropdownMenuItem 
                              className="gap-3 cursor-pointer rounded-lg focus:bg-orange-500/10 py-2.5"
                              onClick={() => setReactivatingBooking(reserva)}
                            >
                              <RefreshCw className="w-4 h-4 text-orange-600" />
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-orange-600">Reactivar Cotización</span>
                                <span className="text-[9px] text-muted-foreground">Recuperar venta expirada</span>
                              </div>
                            </DropdownMenuItem>
                          )}

                          {reserva.status !== "cancelado" && (
                            <DropdownMenuItem
                              className="gap-3 cursor-pointer rounded-lg focus:bg-red-500/10 py-2.5 text-red-400"
                              onClick={() => {
                                setDiscardTargetLead(reserva)
                                setSelectedDiscardReason("Fuera de presupuesto")
                              }}
                            >
                              <Ban className="w-4 h-4 text-red-500" />
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-red-500">Descartar / Cancelar</span>
                                <span className="text-[9px] text-muted-foreground">Cierre negativo con motivo</span>
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

      {/* Dialogo para Descartar / Cancelar Lead */}
      <Dialog open={!!discardTargetLead} onOpenChange={(open) => !open && setDiscardTargetLead(null)}>
        <DialogContent className="max-w-md bg-background border-border shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-black text-foreground flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              Descartar Prospecto / Cotización
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs pt-1">
              Estás por descartar la solicitud de <strong className="text-foreground">{discardTargetLead?.clientName}</strong> ({discardTargetLead?.shortId || "Sin folio"}). El estado cambiará a cancelado y la fecha tentativa quedará liberada en la agenda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Motivo del descarte:
              </label>
              <select
                value={selectedDiscardReason}
                onChange={e => setSelectedDiscardReason(e.target.value)}
                className="w-full px-3 py-2 bg-muted/40 border border-border/40 rounded-xl text-sm text-foreground focus:outline-none focus:border-red-500/50"
              >
                {DISCARD_REASONS.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            {/* Mensaje de cortesía de cierre en WhatsApp (Opcional) */}
            {discardTargetLead && (discardTargetLead.client?.whatsapp || discardTargetLead.clientPhone) && (
              <div className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Mensaje de cortesía (WhatsApp):
                  </span>
                  <a
                    href={getWhatsAppClosureUrl(
                      discardTargetLead.client?.whatsapp || discardTargetLead.clientPhone,
                      discardTargetLead.clientName,
                      discardTargetLead.requestedDate
                    ) || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Abrir WhatsApp ↗
                  </a>
                </div>
                <p className="text-[11px] text-muted-foreground italic bg-background/50 p-2.5 rounded-lg border border-border/20 leading-relaxed">
                  &ldquo;Hola {discardTargetLead.clientName}, para mantener actualizada nuestra agenda liberamos la fecha tentativa del {formatDateMX(new Date(discardTargetLead.requestedDate), "dd 'de' MMMM")}. Si en el futuro retoman el evento, con gusto volvemos a cotizar. ¡Mucho éxito con su fiesta!&rdquo;
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDiscardTargetLead(null)} className="rounded-xl border-border/40 text-xs">
              Volver
            </Button>
            <Button
              onClick={() => discardTargetLead && handleDiscardLead(discardTargetLead, selectedDiscardReason)}
              disabled={isDiscarding}
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/20"
            >
              {isDiscarding ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Ban className="w-3.5 h-3.5 mr-1.5" />}
              Confirmar Descarte
            </Button>
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
    pendiente_aprobacion: { color: "text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20", label: "Pendiente Aprobación" },
    propuesta_enviada:    { color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20", label: "Propuesta Enviada" },
    requiere_llamada: { color: "text-purple-400 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20", label: "Requiere Llamada" },
    contactado:       { color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20", label: "Contactado" },
    llamada_agendada: { color: "text-indigo-400 border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20", label: "Llamada Agendada" },
    pendiente:        { color: "text-yellow-600 border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20", label: "Pendiente" },
    agendado:         { color: "text-green-600 border-green-500/40 bg-green-500/10 hover:bg-green-500/20", label: "Confirmado" },
    completado:       { color: "text-blue-600 border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20", label: "Completado" },
    cancelado:        { color: "text-red-400 border-red-500/40 bg-red-500/10 hover:bg-red-500/20", label: "Cancelado" },
    expirado:         { color: "text-zinc-400 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800/70", label: "Expirado" },
    no_interesado:    { color: "text-orange-400 border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20", label: "No Interesado" },
    EXPIRED:          { color: "text-zinc-400 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800/70", label: "Expirado" },
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
