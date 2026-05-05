"use client"

import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Trash2, 
  Loader2, 
  CheckSquare, 
  Square,
  AlertTriangle,
  Mail,
  MessageCircle,
  MapPin,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import { formatDateMX } from "@/lib/utils"
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
  phone: string | null
  company: string | null
  rfc: string | null
  notes: string | null
  _count: {
    events: number
    quotes: number
  }
  events: { id: string; date: Date; contracts: any[] }[]
}

interface ClientesTableClientProps {
  items: ClientListItem[]
}

export function ClientesTableClient({ items }: ClientesTableClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)



  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(i => i.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkDelete = async () => {
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
    } catch (err) {
      toast.error("Ocurrió un error inesperado al eliminar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Acciones Masivas */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
              {selectedIds.size}
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Clientes seleccionados</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Listo para acción masiva</p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2 font-bold h-11 px-6 rounded-xl shadow-xl shadow-red-500/10 hover:scale-105 transition-transform text-white">
                <Trash2 className="w-4 h-4" /> Eliminar permanentemente
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="bg-black border-border/20 backdrop-blur-2xl sm:max-w-[500px] text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-500 text-xl font-black">
                  <AlertTriangle className="w-6 h-6" /> ¿ESTÁS SEGURO?
                </DialogTitle>
                <DialogDescription className="text-gray-400 pt-4 text-base leading-relaxed">
                  Estás por eliminar <strong>{selectedIds.size}</strong> perfiles de cliente definitivamente. 
                  <span className="block mt-4 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 font-medium">
                    Esto también borrará sus cuentas de usuario (email/password) y todo su historial de logs. No se podrán recuperar.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-8 gap-3">
                <DialogClose render={<Button variant="ghost" className="rounded-xl border border-white/10 h-12 px-6 text-white hover:bg-white/10" />}>
                  Cancelar operación
                </DialogClose>
                <Button 
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold h-12 px-8 shadow-lg shadow-red-600/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirmar Eliminación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="border border-border/40 rounded-2xl bg-card overflow-x-auto shadow-2xl">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent bg-white/[0.02]">
              <TableHead className="w-12 text-center">
                <button 
                  onClick={toggleSelectAll}
                  className="w-5 h-5 rounded-md border border-border/40 flex items-center justify-center hover:border-primary/50 transition-all mx-auto"
                >
                  {selectedIds.size === items.length && items.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-primary fill-primary/10" />
                  ) : selectedIds.size > 0 ? (
                    <div className="w-2.5 h-0.5 bg-primary" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-700" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-primary font-bold uppercase text-[10px] tracking-widest">Nombre del Cliente</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest italic font-bold">Contacto</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest italic font-bold">Ubicación</TableHead>
              <TableHead className="text-center text-[10px] uppercase tracking-widest italic font-bold">Gigs</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest italic font-bold">Historial</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-widest italic font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="font-medium">No hay registros de clientes.</p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((client) => (
                <TableRow 
                  key={client.id} 
                  className={`border-border/40 align-top transition-all duration-300 ${
                    selectedIds.has(client.id) 
                    ? 'bg-primary/10 border-l-2 border-l-primary' 
                    : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <TableCell className="py-6 text-center">
                    <button 
                      onClick={() => toggleSelect(client.id)}
                      className="w-5 h-5 rounded-md border border-border/40 flex items-center justify-center hover:border-primary/50 transition-all mx-auto"
                    >
                      {selectedIds.has(client.id) ? (
                        <CheckSquare className="w-4 h-4 text-primary fill-primary/10" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-800" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="py-6" onClick={() => toggleSelect(client.id)}>
                    <div className="font-black text-foreground text-base leading-tight tracking-tight uppercase">{client.user.name}</div>
                    {client.type === "corporate" ? (
                      <Badge className="mt-2 bg-blue-900/30 text-blue-300 border-blue-200 hover:bg-blue-900/40 text-[9px] font-black tracking-widest">
                        CORPORATIVO
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-2 border-primary/20 text-primary text-[9px] font-black tracking-widest uppercase">
                        SOCIAL / PRIVADO
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="py-6">
                    <div className="space-y-2">
                      {client.user.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="truncate max-w-[140px] lowercase">{client.user.email}</span>
                        </div>
                      )}
                      {client.whatsapp && (
                        <div className="flex items-center gap-2 text-xs text-green-500/80 font-bold font-mono">
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{client.whatsapp}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-6">
                    {client.state || client.city ? (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        <div>
                           {client.city && <div className="font-black text-muted-foreground">{client.city}</div>}
                           {client.state && <div className="text-muted-foreground text-[10px] font-bold uppercase">{client.state}</div>}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic font-mono opacity-30">S/U</span>
                    )}
                  </TableCell>

                  <TableCell className="text-center py-6">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-2xl font-black text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">{client._count.events}</span>
                      <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-50">Eventos</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-6">
                    {client.events.length > 0 ? (
                      <div className="space-y-2">
                        {client.events.map(ev => (
                          <div key={ev.id} className="flex items-center gap-2 text-[10px] font-bold px-2 py-1 bg-primary/10 rounded-md border border-border/40">
                            <Calendar className="w-3 h-3 text-primary shrink-0" />
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                              {formatDateMX(ev.date, "dd MMM yyyy")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic opacity-20">-</span>
                    )}
                  </TableCell>



                  <TableCell className="py-6 text-right">
                    <ClienteActions
                      client={{
                        profileId: client.id,
                        name: client.user.name || "",
                        email: client.user.email || "",
                        phone: client.phone,
                        whatsapp: client.whatsapp,
                        state: client.state,
                        city: client.city,
                        type: client.type,
                        company: client.company,
                        rfc: client.rfc,
                        notes: client.notes,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
