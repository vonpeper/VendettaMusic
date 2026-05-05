import { useState, useTransition } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { 
  updateMusicianProfileAction, 
  updateSubstituteAction, 
  deleteSubstituteAction, 
  addSubstituteAction,
  deleteMusicianProfileAction
} from "@/actions/musicians"
import { Camera, Star, Phone, MessageCircle, Trash2, Save, Plus, Trash } from "lucide-react"

export function MusicianDetailsSheet({ musician, open, onOpenChange }: { musician: any, open: boolean, onOpenChange: (o: boolean) => void }) {
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)
  
  if (!musician) return null

  const handleMusicianUpdate = async (formData: FormData) => {
    startTransition(async () => {
      const res = await updateMusicianProfileAction(musician.id, formData)
      if (res.success) {
        setPreview(null)
      }
    })
  }

  const handleMusicianDelete = async () => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${musician.user.name}? Esta acción no se puede deshacer.`)) {
      startTransition(async () => {
        const res = await deleteMusicianProfileAction(musician.id)
        if (res.success) {
          onOpenChange(false)
        } else {
          alert(res.error)
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
      await updateSubstituteAction(subId, formData)
    })
  }

  const handleSubstituteDelete = async (subId: string) => {
    if (confirm("¿Seguro que deseas eliminar este suplente?")) {
      startTransition(async () => {
        await deleteSubstituteAction(subId)
      })
    }
  }

  const handleAddSubstitute = async (formData: FormData) => {
    startTransition(async () => {
      const res = await addSubstituteAction(musician.id, formData)
      if (res.success) {
        const form = document.getElementById("add-sub-form") as HTMLFormElement
        if (form) form.reset()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-background border-l border-border/40 sm:max-w-xl w-full overflow-y-auto p-0 admin-theme">
        <div className="p-6 bg-card border-b border-border/40">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-foreground">{musician.user.name}</SheetTitle>
            <SheetDescription className="text-primary font-medium tracking-widest uppercase text-xs">
              {musician.instrument || "General"}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-8">
          {/* Musician Settings */}
          <section>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Configuración del Titular</h3>
            <form action={handleMusicianUpdate} className="space-y-4">
              
              {/* Photo Update */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border border-primary/30 overflow-hidden relative group">
                  <img 
                    src={preview || musician.user.image || `https://ui-avatars.com/api/?name=${musician.user.name}&background=random`} 
                    alt={musician.user.name} 
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-foreground" />
                    <input type="file" name="image" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <div>
                  <h4 className="text-foreground font-bold">{musician.user.name}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Haz clic en la foto para cambiarla</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Nombre Completo</label>
                <input name="name" defaultValue={musician.user.name} required className="w-full bg-card border border-border/40 rounded-md p-2 text-sm text-foreground" />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Instrumento / Rol</label>
                <input name="instrument" defaultValue={musician.instrument} className="w-full bg-card border border-border/40 rounded-md p-2 text-sm text-foreground" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">WhatsApp (Principal)</label>
                  <input name="whatsapp" defaultValue={musician.whatsapp} required className="w-full bg-card border border-border/40 rounded-md p-2 text-sm text-foreground font-bold text-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Teléfono de Respaldo</label>
                  <input name="phone" defaultValue={musician.phone} className="w-full bg-card border border-border/40 rounded-md p-2 text-sm text-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Estatus</label>
                  <select name="status" defaultValue={musician.status} className="w-full bg-card border border-border/40 rounded-md p-2 text-sm text-foreground">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Disponibilidad</label>
                  <select name="availability" defaultValue={musician.availability} className="w-full bg-card border border-border/40 rounded-md p-2 text-sm text-foreground">
                    <option value="Disponible">Disponible</option>
                    <option value="Ocupado">Ocupado</option>
                    <option value="Vacaciones">Vacaciones</option>
                    <option value="Ausencia">Ausencia</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Calificación (Estrellas)</label>
                <select name="rating" defaultValue={musician.rating || 3} className="w-full bg-card border border-border/40 rounded-md p-2 text-sm text-foreground">
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Estrellas</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Observaciones / Notas</label>
                <textarea name="notes" defaultValue={musician.notes} rows={3} className="w-full bg-card border border-border/40 rounded-md p-2 text-sm text-foreground" />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border/40">
                <button 
                  type="button" 
                  onClick={handleMusicianDelete}
                  className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-2 px-2"
                >
                  <Trash className="w-3 h-3" /> Borrar Músico
                </button>
                
                <button type="submit" disabled={isPending} className="bg-gradient-to-r from-[#E91E63] to-[#D81B60] text-white px-6 py-2 rounded-md text-sm font-black transition-all shadow-lg shadow-pink-500/20 flex items-center gap-2">
                  <Save className="w-4 h-4" /> {isPending ? "Guardando..." : "Actualizar Información"}
                </button>
              </div>
            </form>
          </section>

          {/* Substitutes List */}
          <section>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Suplentes Asignados ({musician.substitutes.length})</h3>
            
            <div className="space-y-4 mb-6">
              {musician.substitutes.map((sub: any) => (
                <div key={sub.id} className="bg-card border border-border/40 rounded-xl p-4 relative overflow-hidden">
                  <form action={(fd) => handleSubstituteUpdate(sub.id, fd)} className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <input name="name" defaultValue={sub.name} className="bg-transparent border-none text-foreground font-bold p-0 focus:ring-0 w-full" />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageCircle className="w-3 h-3 text-green-500" />
                          <input name="whatsapp" defaultValue={sub.whatsapp} placeholder="WhatsApp" className="bg-transparent border-none p-0 focus:ring-0 w-48" />
                        </div>
                      </div>
                      <button type="button" onClick={() => handleSubstituteDelete(sub.id)} className="text-red-700 hover:text-red-300 p-2 bg-red-400/10 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-muted-foreground">Disponibilidad</label>
                        <select name="availability" defaultValue={sub.availability} className="w-full bg-card border border-border/40 rounded-md p-1.5 text-xs text-foreground">
                          <option value="Disponible">Disponible</option>
                          <option value="Ocupado">Ocupado</option>
                          <option value="Vacaciones">Vacaciones</option>
                          <option value="Ausencia">Ausencia</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-muted-foreground">Rating (1-5)</label>
                        <select name="rating" defaultValue={sub.rating || 3} className="w-full bg-card border border-border/40 rounded-md p-1.5 text-xs text-foreground">
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Estrellas</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-2">
                      <button type="submit" disabled={isPending} className="text-xs text-primary hover:text-primary/80 font-bold flex items-center gap-1">
                        <Save className="w-3 h-3" /> Guardar
                      </button>
                    </div>
                  </form>
                </div>
              ))}
              
              {musician.substitutes.length === 0 && (
                <div className="p-4 bg-card border border-border/40 rounded-lg text-center text-sm text-muted-foreground">
                  No hay suplentes asignados.
                </div>
              )}
            </div>

            {/* Add New Substitute */}
            <div className="bg-card border border-border/40 rounded-xl p-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Agregar Nuevo Suplente
              </h4>
              <form id="add-sub-form" action={handleAddSubstitute} className="space-y-3">
                <input type="text" name="name" placeholder="Nombre completo" required className="w-full bg-background border border-border/40 rounded-md p-2 text-sm text-foreground" />
                <input type="text" name="whatsapp" placeholder="WhatsApp (10 dígitos)" required className="w-full bg-background border border-border/40 rounded-md p-2 text-sm text-foreground" />
                <div className="grid grid-cols-2 gap-3">
                  <select name="rating" defaultValue={3} className="w-full bg-background border border-border/40 rounded-md p-2 text-sm text-foreground">
                    <option value={1}>1 Estrella</option>
                    <option value={2}>2 Estrellas</option>
                    <option value={3}>3 Estrellas</option>
                    <option value={4}>4 Estrellas</option>
                    <option value={5}>5 Estrellas</option>
                  </select>
                  <button type="submit" disabled={isPending} className="w-full bg-primary hover:bg-primary/90 text-foreground rounded-md p-2 text-sm font-bold transition-colors">
                    {isPending ? "Agregando..." : "Agregar"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
