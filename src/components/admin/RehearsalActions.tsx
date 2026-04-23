"use client"

import { useState } from "react"
import { createRehearsalAction, deleteRehearsalAction } from "@/actions/rehearsals"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Calendar, Plus, Trash2, MapPin } from "lucide-react"

export function NuevoEnsayoButton({ locations, musicians, songs }: {
  locations: any[]
  musicians: any[]
  songs: any[]
}) {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      {showForm && (
        <RehearsalForm
          onClose={() => setShowForm(false)}
          locations={locations}
          musicians={musicians}
          songs={songs}
        />
      )}
      <Button onClick={() => setShowForm(true)} className="font-bold">
        <Plus className="w-4 h-4 mr-2" /> Agendar Ensayo
      </Button>
    </>
  )
}

function RehearsalForm({ onClose, locations, musicians, songs }: any) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createRehearsalAction(formData)
    setLoading(false)
    if (result.success) {
      onClose()
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Agendar Ensayo
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="datetime">Fecha y Hora *</Label>
              <Input id="datetime" name="datetime" type="datetime-local" required className="bg-background border-white/10 text-white" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationId">Lugar (Catálogo)</Label>
              <select id="locationId" name="locationId" className="flex h-10 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white">
                <option value="">Otro...</option>
                {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="locationFree">Dirección Libre (si no está en catálogo)</Label>
              <Input id="locationFree" name="locationFree" placeholder="Ej. Sala de Ensayo Studio 54..." className="bg-background border-white/10" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Tarea / Notas *</Label>
              <textarea id="notes" name="notes" rows={3} required placeholder="Ej. Repaso general del set de los 80s..."
                className="flex w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>

          <fieldset className="border border-white/10 rounded-xl p-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary px-2">Repertorio a Ensayar</legend>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
              {songs.map((song: any) => (
                <label key={song.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer border border-transparent hover:border-white/10">
                  <input type="checkbox" name="songIds" value={song.id} className="rounded border-white/20 bg-background text-primary focus:ring-primary h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{song.artist}</p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="border border-white/10 rounded-xl p-4 bg-primary/5">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary px-2">Notificaciones WhatsApp</legend>
            <p className="text-xs text-muted-foreground mb-3">Selecciona a quiénes se les enviará el mensaje automático. Se vincularán al ensayo los músicos titulares seleccionados.</p>
            
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {musicians.map((m: any) => (
                <div key={m.id} className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="notifyPhones" value={m.whatsapp || m.phone || ""} className="rounded border-white/20 bg-background text-primary focus:ring-primary h-4 w-4" />
                    <input type="checkbox" name="musicianProfileIds" value={m.id} className="hidden" 
                      onChange={(e) => {
                        // Automatically check/uncheck hidden field to link musician to rehearsal if they get notified
                        const sibling = e.target.previousSibling as HTMLInputElement;
                        if(sibling) sibling.checked = e.target.checked;
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{m.user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.instrument || "Músico Base"}</p>
                    </div>
                  </label>
                  
                  {m.substitutes && m.substitutes.length > 0 && (
                    <div className="mt-2 ml-7 pl-3 border-l border-white/10 space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Suplentes:</p>
                      {m.substitutes.map((sub: any) => (
                        <label key={sub.id} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" name="notifyPhones" value={sub.whatsapp} className="rounded border-white/20 bg-background text-primary focus:ring-primary h-4 w-4" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-300">{sub.name}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/10">Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex-1 font-bold">
              {loading ? "Agendando..." : "Agendar y Notificar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function DeleteRehearsalButton({ rehearsalId }: { rehearsalId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("¿Eliminar este ensayo?")) return
    setLoading(true)
    await deleteRehearsalAction(rehearsalId)
    setLoading(false)
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading} className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
