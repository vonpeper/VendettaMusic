"use client"

import { useState, useMemo } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Trash2, 
  Loader2, 
  CheckSquare, 
  Square,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Search,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ClienteActions } from "./ClienteActions"
import { deleteClientesAction } from "@/actions/clientes"

interface ClientListItem {
  id: string
  user: {
    name: string | null
    email: string | null
  }
  type: string | null
  whatsapp: string | null
  city: string | null
  state: string | null
  company: string | null
  rfc: string | null
  notes: string | null
  _count: {
    events: number
    quotes: number
    bookings?: number
  }
  events: { id: string; date: Date; contracts: { id: string }[] }[]
}

interface ClientesTableClientProps {
  items: ClientListItem[]
}

export function ClientesTableClient({ items }: ClientesTableClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "events_desc">("name_asc")
  const [previewDuplicateClient, setPreviewDuplicateClient] = useState<ClientListItem | null>(null)

  // Mapa de duplicados por teléfono normalizado (últimos 10 dígitos)
  const duplicatePhoneMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const item of items) {
      if (item.whatsapp) {
        const last10 = item.whatsapp.replace(/\D/g, "").slice(-10)
        if (last10.length === 10) {
          const list = map.get(last10) || []
          list.push(item.id)
          map.set(last10, list)
        }
      }
    }
    return map
  }, [items])

  // Filtrado y ordenamiento de clientes
  const processedClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const cleanTermPhone = term.replace(/\D/g, "")

    const list = items.filter(c => {
      const name = c.user.name?.toLowerCase() || ""
      const email = c.user.email?.toLowerCase() || ""
      const phone = c.whatsapp ? c.whatsapp.replace(/\D/g, "") : ""
      const company = c.company?.toLowerCase() || ""
      const city = c.city?.toLowerCase() || ""

      const matchesSearch = !term || (
        name.includes(term) ||
        email.includes(term) ||
        (cleanTermPhone && phone.includes(cleanTermPhone)) ||
        company.includes(term) ||
        city.includes(term)
      )
      return matchesSearch
    })

    list.sort((a, b) => {
      if (sortBy === "name_asc") {
        return (a.user.name || "").localeCompare(b.user.name || "")
      }
      if (sortBy === "name_desc") {
        return (b.user.name || "").localeCompare(a.user.name || "")
      }
      if (sortBy === "events_desc") {
        return b._count.events - a._count.events
      }
      return 0
    })

    return list
  }, [items, searchTerm, sortBy])

  const toggleSelectAll = () => {
    if (selectedIds.size === processedClients.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(processedClients.map(c => c.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setLoading(true)
    try {
      const result = await deleteClientesAction(Array.from(selectedIds))
      if (result.success) {
        toast.success(result.message)
        setSelectedIds(new Set())
        setIsDialogOpen(false)
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error("Ocurrió un error inesperado al eliminar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Controles de Búsqueda y Ordenamiento */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/40">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo, teléfono o empresa..."
            className="pl-9 bg-background text-sm h-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold shrink-0">Ordenar:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as "name_asc" | "name_desc" | "events_desc")}
            className="h-10 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold"
          >     
            <option value="name_asc">Nombre (A - Z)</option>
            <option value="name_desc">Nombre (Z - A)</option>
            <option value="events_desc">Más Actividad (Eventos)</option>
          </select>
        </div>
      </div>

      {/* Barra de Acciones por Lote */}
      {selectedIds.size > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center justify-between animate-in fade-in">
          <span className="text-sm text-destructive font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {selectedIds.size} cliente(s) seleccionado(s)
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="w-4 h-4" /> Eliminar seleccionados
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-white">¿Confirmas la eliminación?</DialogTitle>
                <DialogDescription>
                  Se eliminarán permanentemente los {selectedIds.size} clientes seleccionados.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleBulkDelete} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Confirmar Eliminación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tabla de Clientes */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="w-12 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-muted-foreground hover:text-white"
                >
                  {selectedIds.size === processedClients.length && processedClients.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </TableHead>
              <TableHead className="font-bold text-white text-xs uppercase tracking-wider">Cliente / Empresa</TableHead>
              <TableHead className="font-bold text-white text-xs uppercase tracking-wider">Contacto</TableHead>
              <TableHead className="font-bold text-white text-xs uppercase tracking-wider">Ubicación</TableHead>
              <TableHead className="font-bold text-white text-xs uppercase tracking-wider text-center">Actividad</TableHead>
              <TableHead className="w-20 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No se encontraron clientes registrados con ese criterio.
                </TableCell>
              </TableRow>
            ) : (
              processedClients.map(client => {
                const isSelected = selectedIds.has(client.id)
                const cleanPhone = client.whatsapp ? client.whatsapp.replace(/\D/g, "").slice(-10) : ""
                const duplicateCount = cleanPhone && cleanPhone.length === 10 ? (duplicatePhoneMap.get(cleanPhone)?.length || 0) - 1 : 0
                const isInvalidPhone = client.whatsapp && client.whatsapp.replace(/\D/g, "").length < 10

                return (
                  <TableRow
                    key={client.id}
                    className={`border-border/40 hover:bg-white/[0.02] transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                  >
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelect(client.id)}
                        className="text-muted-foreground hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {client.user.name || "Sin nombre registrado"}
                        {client.type === "corporate" && (
                          <Badge variant="outline" className="text-[9px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                            Corporativo
                          </Badge>
                        )}
                      </div>
                      {client.company && (
                        <div className="text-xs text-muted-foreground mt-0.5">{client.company}</div>
                      )}
                      {duplicateCount > 0 && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewDuplicateClient(client)}
                            className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 hover:bg-yellow-500/20 cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3" /> {duplicateCount} posible(s) duplicado(s)
                          </button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        {client.whatsapp ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3 h-3 text-primary shrink-0" />
                            <span className={isInvalidPhone ? "text-yellow-400 font-semibold" : "text-white"}>
                              {client.whatsapp}
                            </span>
                            {isInvalidPhone && (
                              <span className="text-[9px] text-yellow-500 bg-yellow-500/10 px-1 rounded">Incompleto</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Sin teléfono</span>
                        )}
                        {client.user.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="w-3 h-3 text-primary shrink-0" />
                            <span>{client.user.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        <span>{client.city || "CDMX / Toluca"}{client.state ? `, ${client.state}` : ""}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-muted-foreground">
                          {client._count.events} evento(s)
                        </span>
                        {(client._count.bookings || client._count.quotes) > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {(client._count.bookings || 0) + client._count.quotes} cotización(es)
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <ClienteActions client={{
                        profileId: client.id,
                        name: client.user.name || "Sin nombre",
                        email: client.user.email || "",
                        phone: client.whatsapp,
                        whatsapp: client.whatsapp,
                        state: client.state,
                        city: client.city,
                        type: client.type,
                        company: client.company,
                        rfc: client.rfc,
                        notes: client.notes
                      }} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Previsualización de Duplicados (Solo Lectura) */}
      {previewDuplicateClient && (
        <Dialog open={!!previewDuplicateClient} onOpenChange={() => setPreviewDuplicateClient(null)}>
          <DialogContent className="bg-card border-border max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" /> Diagnóstico de Coincidencia (Solo Lectura)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Se detectaron registros que comparten el mismo número de teléfono. No se realiza ninguna fusión automática.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs font-bold text-primary uppercase">Registro Seleccionado</div>
                <div className="font-bold text-white text-sm mt-1">{previewDuplicateClient.user.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  ID: {previewDuplicateClient.id} • Teléfono: {previewDuplicateClient.whatsapp} • {previewDuplicateClient._count.events} eventos
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Registros Coincidentes</div>
                {items
                  .filter(c => c.id !== previewDuplicateClient.id && c.whatsapp && previewDuplicateClient.whatsapp && c.whatsapp.replace(/\D/g, "").slice(-10) === previewDuplicateClient.whatsapp.replace(/\D/g, "").slice(-10))
                  .map(match => (
                    <div key={match.id} className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-xs">
                      <div className="font-bold text-white">{match.user.name || "Sin nombre"}</div>
                      <div className="text-muted-foreground mt-0.5">
                        ID: {match.id} • Tel: {match.whatsapp} • Correo: {match.user.email || "N/A"} • Eventos: {match._count.events}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewDuplicateClient(null)}>
                Cerrar Diagnóstico
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
