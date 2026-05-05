"use client"

import { useState } from "react"
import { createRehearsalAction, deleteRehearsalAction, updateRehearsalAction } from "@/actions/rehearsals"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Calendar, Plus, Trash2, MapPin, Edit2 } from "lucide-react"

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

export function EditRehearsalButton({ rehearsal, locations, musicians, songs }: {
  rehearsal: any
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
          initialData={rehearsal}
        />
      )}
      <Button variant="ghost" size="icon" onClick={() => setShowForm(true)} className="h-8 w-8 text-primary/60 hover:text-primary hover:bg-primary/10">
        <Edit2 className="w-4 h-4" />
      </Button>
    </>
  )
}

function RehearsalForm({ onClose, locations, musicians, songs, initialData }: any) {
  const [loading, setLoading] = useState(false)
  const [newSongs, setNewSongs] = useState<{ id: number }[]>([])

  const addNewSongField = () => setNewSongs([...newSongs, { id: Date.now() }])
  const removeNewSongField = (id: number) => setNewSongs(newSongs.filter(s => s.id !== id))

  // Parse initial data for edition
  const isEdit = !!initialData
  const defaultDate = isEdit ? new Date(initialData.datetime).toISOString().split('T')[0] : ""
  const defaultTime = isEdit ? new Date(initialData.datetime).toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ""
  const selectedSongIds = isEdit ? initialData.songs.map((s: any) => s.songId) : []
  const selectedMusicianIds = isEdit ? initialData.musicians.map((m: any) => m.musicianId) : []

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    const result = isEdit 
      ? await updateRehearsalAction(formData)
      : await createRehearsalAction(formData)

    setLoading(false)
    if (result.success) {
      onClose()
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-card backdrop-blur-sm p-4">
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border/40 sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> {isEdit ? "Editar Ensayo" : "Agendar Ensayo"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEdit && <input type="hidden" name="rehearsalId" value={initialData.id} />}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" name="date" type="date" defaultValue={defaultDate} required className="bg-background border-border/40 text-foreground" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora *</Label>
              <Input id="time" name="time" type="time" defaultValue={defaultTime} required className="bg-background border-border/40 text-foreground" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationId">Lugar (Catálogo)</Label>
              <select id="locationId" name="locationId" defaultValue={initialData?.locationId || ""} className="flex h-10 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground">
                <option value="">Otro...</option>
                {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="locationFree">Dirección Libre (si no está en catálogo)</Label>
              <Input id="locationFree" name="locationFree" placeholder="Ej. Sala de Ensayo Studio 54..." className="bg-background border-border/40" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Tarea / Notas *</Label>
              <textarea id="notes" name="notes" rows={3} required defaultValue={initialData?.notes || ""} placeholder="Ej. Repaso general del set de los 80s..."
                className="flex w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>

          <fieldset className="border border-border/40 rounded-xl p-4">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary px-2">Repertorio a Ensayar</legend>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 mb-4">
              {songs.map((song: any) => (
                <label key={song.id} className="flex items-center gap-3 p-2 hover:bg-primary/10 rounded-lg cursor-pointer border border-transparent hover:border-border/40">
                  <input type="checkbox" name="songIds" value={song.id} defaultChecked={selectedSongIds.includes(song.id)} className="rounded border-border/40 bg-background text-primary focus:ring-primary h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{song.artist}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-3 pt-3 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Canciones Nuevas (No en catálogo)</p>
              {newSongs.map((ns) => (
                <div key={ns.id} className="flex gap-2 items-end group">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[9px] uppercase opacity-60">Título</Label>
                    <Input name="newSongTitle" placeholder="Ej. Flowers" className="h-8 text-xs bg-background" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[9px] uppercase opacity-60">Artista</Label>
                    <Input name="newSongArtist" placeholder="Ej. Miley Cyrus" className="h-8 text-xs bg-background" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeNewSongField(ns.id)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addNewSongField} className="w-full text-xs border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/10">
                <Plus className="w-3 h-3 mr-2" /> Agregar Canción Nueva
              </Button>
            </div>
          </fieldset>

          <fieldset className="border border-border/40 rounded-xl p-4 bg-primary/10">
            <legend className="text-[10px] font-bold uppercase tracking-widest text-primary px-2">Notificaciones WhatsApp</legend>
            <p className="text-xs text-muted-foreground mb-3">Selecciona a quiénes se les enviará el mensaje automático. Se vincularán al ensayo los músicos titulares seleccionados.</p>
            
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {musicians.map((m: any) => (
                <div key={m.id} className="bg-card p-3 rounded-lg border border-border/40">
                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input type="checkbox" name="musicianProfileIds" value={m.id} defaultChecked={selectedMusicianIds.includes(m.id)} className="rounded border-border/40 bg-background text-primary focus:ring-primary h-4 w-4" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{m.user.name}</p>
                        <p className="text-[10px] text-muted-foreground">{m.instrument || "Músico Base"}</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors">
                      <input type="checkbox" name="notifyPhones" value={m.whatsapp || m.phone || ""} className="rounded border-primary/40 bg-background text-primary focus:ring-primary h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-tighter text-primary">Notificar</span>
                    </label>
                  </div>
                  
                  {m.substitutes && m.substitutes.length > 0 && (
                    <div className="mt-2 ml-7 pl-3 border-l border-border/40 space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Suplentes:</p>
                      {m.substitutes.map((sub: any) => (
                        <label key={sub.id} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" name="notifyPhones" value={sub.whatsapp} className="rounded border-border/40 bg-background text-primary focus:ring-primary h-4 w-4" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">{sub.name}</p>
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
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border/40">Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex-1 font-bold text-white">
              {loading ? (isEdit ? "Guardando..." : "Agendando...") : (isEdit ? "Guardar Cambios" : "Agendar y Notificar")}
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
