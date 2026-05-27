"use client"

import { useState, useTransition, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { 
  updateMusicianProfileAction, 
  updateSubstituteAction, 
  deleteSubstituteAction, 
  addSubstituteAction,
  deleteMusicianProfileAction
} from "@/actions/musicians"
import { toast } from "sonner"
import { Camera, Phone, MessageCircle, Trash2, Save, Plus, Trash, User, Briefcase, Bell, Clock } from "lucide-react"

export function MusicianDetailsSheet({ musician, open, onOpenChange }: { musician: any, open: boolean, onOpenChange: (o: boolean) => void }) {
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)
  
  // States synched with props
  const [isTitular, setIsTitular] = useState(musician?.isTitular || false)
  const [statusState, setStatusState] = useState(musician?.status || "active")
  const [availState, setAvailState] = useState(musician?.availability || "Disponible")

  // Sync state when musician changes (fixes the stale state bug)
  useEffect(() => {
    if (musician) {
      setIsTitular(musician.isTitular || false)
      setStatusState(musician.status || "active")
      setAvailState(musician.availability || "Disponible")
      setPreview(null)
    }
  }, [musician])
  
  if (!musician) return null

  const isInactive = statusState === "inactive"

  const handleMusicianUpdate = async (formData: FormData) => {
    formData.set("isTitular", isInactive ? "false" : (isTitular ? "true" : "false"))
    formData.set("status", statusState)
    formData.set("availability", isInactive ? "Ausencia" : availState)
    
    startTransition(async () => {
      const res = await updateMusicianProfileAction(musician.id, formData)
      if (res.success) {
        toast.success("Información del músico actualizada")
        onOpenChange(false)
      } else {
        toast.error(res.error || "Error al actualizar la información")
      }
    })
  }

  const handleMusicianDelete = async () => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${musician.user.name}? Esta acción no se puede deshacer.`)) {
      startTransition(async () => {
        const res = await deleteMusicianProfileAction(musician.id)
        if (res.success) {
          toast.success("Músico eliminado")
          onOpenChange(false)
        } else {
          toast.error(res.error || "Error al eliminar")
        }
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubstituteUpdate = async (subId: string, formData: FormData) => {
    startTransition(async () => {
      const res = await updateSubstituteAction(subId, formData)
      if (res.success) {
        toast.success("Suplente actualizado")
      } else {
        toast.error(res.error || "Error al actualizar suplente")
      }
    })
  }

  const handleSubstituteDelete = async (subId: string) => {
    if (confirm("¿Seguro que deseas eliminar este suplente?")) {
      startTransition(async () => {
        const res = await deleteSubstituteAction(subId)
        if (res.success) {
          toast.success("Suplente eliminado")
        } else {
          toast.error(res.error || "Error al eliminar")
        }
      })
    }
  }

  const handleAddSubstitute = async (formData: FormData) => {
    startTransition(async () => {
      const res = await addSubstituteAction(musician.id, formData)
      if (res.success) {
        toast.success("Suplente agregado")
        const form = document.getElementById("add-sub-form") as HTMLFormElement
        if (form) form.reset()
      } else {
        toast.error(res.error || "Error al agregar suplente")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-background border-l border-border/40 sm:max-w-xl w-full flex flex-col p-0 admin-theme">
        {/* HEADER STICKY */}
        <div className="p-6 bg-card/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-20">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-2xl font-bold text-foreground">{musician.user.name}</SheetTitle>
                <SheetDescription className="text-primary font-bold tracking-widest uppercase text-xs mt-1">
                  {musician.instrument || "General"}
                </SheetDescription>
              </div>
              {isInactive && (
                <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  Inactivo
                </div>
              )}
            </div>
          </SheetHeader>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-24">
          
          <form id="musician-edit-form" action={handleMusicianUpdate} className="space-y-10">
            
            {/* SECCIÓN IDENTIDAD */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Identidad y Contacto</h3>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-card border border-primary/30 overflow-hidden relative group shadow-inner shrink-0">
                  <img 
                    src={preview || musician.user.image || `https://ui-avatars.com/api/?name=${musician.user.name}&background=random`} 
                    alt={musician.user.name} 
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Cambiar</span>
                    <input type="file" name="image" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <div className="flex-1 space-y-3">
                  <input name="name" defaultValue={musician.user.name} className="w-full bg-card border border-border/40 rounded-lg p-2.5 text-sm text-foreground font-medium focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Nombre completo" />
                  <input name="instrument" defaultValue={musician.instrument} className="w-full bg-card border border-border/40 rounded-lg p-2.5 text-sm text-foreground font-medium focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Instrumento o Rol" />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </div>
                <input name="whatsapp" defaultValue={musician.whatsapp || ""} className="w-full bg-card border border-border/40 rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground font-bold focus:ring-2 focus:ring-primary/20 transition-all" placeholder="WhatsApp (10 dígitos)" />
              </div>
            </section>

            {/* SECCIÓN ESTADO Y DISPONIBILIDAD */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Relación Operativa</h3>
              </div>

              <div className="bg-card border border-border/40 rounded-xl p-1 shadow-sm">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusState("active")
                      if (availState === "Ausencia") setAvailState("Disponible")
                    }}
                    className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${!isInactive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    Activo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusState("inactive")}
                    className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${isInactive ? 'bg-red-500 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    Inactivo
                  </button>
                </div>
              </div>
              {isInactive && (
                <p className="text-[11px] text-red-500/80 mt-2 px-1">
                  Al marcarlo como inactivo, no podrá ser convocado a eventos, su disponibilidad pasará a "Ausencia" y dejará de ser titular.
                </p>
              )}

              <div className={`transition-all duration-300 ${isInactive ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block px-1">Disponibilidad Actual</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Disponible", "Ocupado", "Vacaciones", "Ausencia"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAvailState(opt)}
                      className={`py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                        availState === opt 
                          ? opt === 'Disponible' ? 'bg-green-500 border-green-600 text-white shadow-md'
                          : opt === 'Ocupado' ? 'bg-red-500 border-red-600 text-white shadow-md'
                          : opt === 'Vacaciones' ? 'bg-blue-500 border-blue-600 text-white shadow-md'
                          : 'bg-orange-500 border-orange-600 text-white shadow-md'
                          : 'bg-card border-border/40 text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* SECCIÓN NOTIFICACIONES */}
            <section className={`space-y-4 transition-all duration-300 ${isInactive ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
              <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Notificaciones</h3>
              </div>

              <div 
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${isTitular ? 'bg-primary/10 border-primary/30' : 'bg-card border-border/40 hover:border-primary/30'}`}
                onClick={() => setIsTitular(!isTitular)}
              >
                <div className={`relative w-12 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${isTitular ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isTitular ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-bold ${isTitular ? 'text-primary' : 'text-foreground'}`}>Titular / Staff Prioritario</span>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">Recibirá notificaciones automáticas para todos los eventos asignados.</p>
                </div>
              </div>
            </section>

            {/* SECCIÓN NOTAS */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Observaciones</h3>
              </div>
              <textarea name="notes" defaultValue={musician.notes} rows={3} placeholder="Notas internas..." className="w-full bg-card border border-border/40 rounded-lg p-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
              
              <div className="flex items-center gap-4 pt-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Calificación Interna:</span>
                <select name="rating" defaultValue={musician.rating || 3} className="bg-card border border-border/40 rounded-lg p-2 text-sm text-foreground font-bold">
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Estrellas</option>)}
                </select>
              </div>
            </section>
          </form>

          {/* SECCIÓN SUPLENTES (FUERA DEL FORM PRINCIPAL) */}
          <section className="space-y-4 pt-6 border-t border-border/40">
            <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-4">Suplentes Asignados ({musician.substitutes?.length || 0})</h3>
            
            <div className="space-y-4 mb-6">
              {musician.substitutes?.map((sub: any) => (
                <div key={sub.id} className="bg-card border border-border/40 rounded-xl p-4 relative overflow-hidden transition-all hover:border-primary/30 shadow-sm">
                  <form action={(fd) => handleSubstituteUpdate(sub.id, fd)} className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <input name="name" defaultValue={sub.name} className="bg-transparent border-b border-dashed border-border/40 text-foreground font-bold p-1 focus:outline-none focus:border-primary w-full transition-all" />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-1.5 rounded-md w-fit">
                          <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                          <input name="whatsapp" defaultValue={sub.whatsapp} placeholder="WhatsApp" className="bg-transparent border-none p-0 focus:ring-0 w-32 font-medium" />
                        </div>
                      </div>
                      <button type="button" onClick={() => handleSubstituteDelete(sub.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-lg transition-colors border border-transparent hover:border-red-600 shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg">
                      <select name="availability" defaultValue={sub.availability} className="bg-transparent border-none p-1 text-[11px] font-bold uppercase tracking-wider text-foreground focus:ring-0 cursor-pointer">
                        <option value="Disponible">Disponible</option>
                        <option value="Ocupado">Ocupado</option>
                        <option value="Vacaciones">Vacaciones</option>
                        <option value="Ausencia">Ausencia</option>
                      </select>
                      <div className="w-px h-4 bg-border/40 mx-2"></div>
                      <select name="rating" defaultValue={sub.rating || 3} className="bg-transparent border-none p-1 text-[11px] font-bold text-foreground focus:ring-0 cursor-pointer">
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ⭐️</option>)}
                      </select>
                    </div>
                    
                    <button type="submit" disabled={isPending} className="w-full text-[10px] bg-primary/10 text-primary hover:bg-primary/20 py-2 rounded-lg font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-colors">
                      <Save className="w-3 h-3" /> Guardar Suplente
                    </button>
                  </form>
                </div>
              ))}
              
              {(!musician.substitutes || musician.substitutes.length === 0) && (
                <div className="p-6 bg-card border border-dashed border-border/40 rounded-xl text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <UsersIcon className="w-8 h-8 opacity-20" />
                  <span>No hay suplentes asignados.</span>
                </div>
              )}
            </div>

            {/* ADD NEW SUBSTITUTE */}
            <div className="bg-muted/30 border border-border/40 rounded-xl p-5">
              <h4 className="text-[11px] font-black text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Nuevo Suplente
              </h4>
              <form id="add-sub-form" action={handleAddSubstitute} className="space-y-3">
                <input type="text" name="name" placeholder="Nombre completo" required className="w-full bg-card border border-border/40 rounded-lg p-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                <input type="text" name="whatsapp" placeholder="WhatsApp (10 dígitos)" required className="w-full bg-card border border-border/40 rounded-lg p-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                <div className="flex gap-3">
                  <select name="rating" defaultValue={3} className="flex-1 bg-card border border-border/40 rounded-lg p-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 transition-all">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Estrellas</option>)}
                  </select>
                  <button type="submit" disabled={isPending} className="flex-1 bg-foreground hover:bg-foreground/90 text-background rounded-lg p-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-md">
                    {isPending ? "Agregando..." : "Agregar"}
                  </button>
                </div>
              </form>
            </div>
          </section>


        </div>

        {/* BOTTOM STICKY ACTION BAR */}
        <div className="p-4 bg-card/80 backdrop-blur-xl border-t border-border/40 sticky bottom-0 z-20 flex justify-between items-center mt-auto">
          <button 
            type="button" 
            onClick={handleMusicianDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-500/10 p-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <Trash className="w-4 h-4" /> Borrar
          </button>
          
          <button 
            type="submit" 
            form="musician-edit-form"
            disabled={isPending} 
            className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
