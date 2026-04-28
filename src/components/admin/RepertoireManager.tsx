"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music, Upload, Plus, Send, Search, Filter, Trash2, ListMusic } from "lucide-react"
import { importSongsAction, createSetlistAction, deleteSetlistAction, updateSongAction, deleteSongsAction } from "@/actions/repertoire"
import { toast } from "sonner"

export function RepertoireManager({ initialSongs, initialSetlists }: { initialSongs: any[], initialSetlists: any[] }) {
  const songs = initialSongs
  const setlists = initialSetlists
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [importOpen, setImportOpen] = useState(false)
  const [setlistOpen, setSetlistOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingSong, setEditingSong] = useState<any>(null)
  const [selectedSongs, setSelectedSongs] = useState<string[]>([])
  
  // Filters
  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.artist.toLowerCase().includes(search.toLowerCase()) ||
    (s.genre && s.genre.toLowerCase().includes(search.toLowerCase()))
  )

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const raw = formData.get("songs") as string
    
    startTransition(async () => {
      const res = await importSongsAction(raw)
      if (res.success) {
        setImportOpen(false)
        toast.success(`Importadas ${res.count} canciones`)
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleCreateSetlist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    
    if (selectedSongs.length === 0) {
      toast.error("Selecciona al menos una canción")
      return
    }

    startTransition(async () => {
      const res = await createSetlistAction(name, selectedSongs)
      if (res.success) {
        setSetlistOpen(false)
        setSelectedSongs([])
        toast.success("Setlist creado con éxito")
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`¿Estás seguro de eliminar ${selectedSongs.length} canciones?`)) return
    
    startTransition(async () => {
      const res = await deleteSongsAction(selectedSongs)
      if (res.success) {
        setSelectedSongs([])
        toast.success("Canciones eliminadas")
      } else {
        toast.error(res.error)
      }
    })
  }

  const toggleAll = () => {
    if (selectedSongs.length === filteredSongs.length) {
      setSelectedSongs([])
    } else {
      setSelectedSongs(filteredSongs.map(s => s.id))
    }
  }

  const toggleSongSelection = (id: string) => {
    setSelectedSongs(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const sendToBand = (setlist: any) => {
    const text = `🎸 *SETLIST: ${setlist.name}*\n\n` + 
      setlist.songs.map((ss: any, i: number) => `${i+1}. ${ss.song.title} - ${ss.song.artist}`).join("\n")
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleEditSong = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title") as string,
      artist: formData.get("artist") as string,
      genre: formData.get("genre") as string,
      era: formData.get("era") as string,
    }

    startTransition(async () => {
      const res = await updateSongAction(editingSong.id, data)
      if (res.success) {
        setEditOpen(false)
        setEditingSong(null)
        toast.success("Canción actualizada")
      } else {
        toast.error(res.error)
      }
    })
  }

  const openEdit = (song: any) => {
    setEditingSong(song)
    setEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por título, artista o género..." 
              className="w-full pl-9 pr-4 py-2 bg-card border border-border/40 rounded-xl text-sm focus:outline-none focus:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {selectedSongs.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="rounded-xl gap-2 animate-in fade-in slide-in-from-left-2"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="w-4 h-4" />
              Borrar ({selectedSongs.length})
            </Button>
          )}
        </div>

        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="rounded-xl gap-2 h-10 px-4 whitespace-nowrap">
                <Upload className="w-4 h-4" /> Importar Lista
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Importación Masiva</DialogTitle>
                <DialogDescription>
                  Pega una lista de canciones (una por línea). 
                  Formato recomendado: <span className="font-bold">Título - Artista</span>
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleImport} className="space-y-4 pt-4">
                <textarea 
                  name="songs" 
                  rows={10} 
                  required
                  placeholder="Ej:&#10;Billie Jean - Michael Jackson&#10;Persiana Americana - Soda Stereo&#10;Levitating - Dua Lipa"
                  className="w-full bg-background border border-border/40 rounded-xl p-4 text-sm font-mono focus:ring-1 focus:ring-primary outline-none"
                />
                <Button type="submit" disabled={isPending} className="w-full text-white font-bold">
                  {isPending ? "Procesando..." : "Importar y Organizar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Canción</DialogTitle>
              </DialogHeader>
              {editingSong && (
                <form onSubmit={handleEditSong} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título</label>
                    <Input name="title" defaultValue={editingSong.title} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Artista</label>
                    <Input name="artist" defaultValue={editingSong.artist} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Género</label>
                      <Input name="genre" defaultValue={editingSong.genre || ""} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Época</label>
                      <Input name="era" defaultValue={editingSong.era || ""} />
                    </div>
                  </div>
                  <Button type="submit" disabled={isPending} className="w-full text-white font-bold">
                    {isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={setlistOpen} onOpenChange={setSetlistOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2 h-10 px-4 text-white font-bold whitespace-nowrap">
                <Plus className="w-4 h-4" /> Crear Setlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Setlist</DialogTitle>
                <DialogDescription>
                  Has seleccionado <span className="font-black text-primary">{selectedSongs.length}</span> canciones.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSetlist} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre del Setlist</label>
                  <Input name="name" placeholder="Ej. Setlist Boda Civil - Pop 80s" required />
                </div>
                <Button type="submit" disabled={isPending || selectedSongs.length === 0} className="w-full text-white font-bold">
                  {isPending ? "Guardando..." : "Guardar Setlist"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="biblioteca" className="w-full">
        <TabsList className="bg-card border border-border/40 mb-6">
          <TabsTrigger value="biblioteca" className="font-bold">Biblioteca ({songs.length})</TabsTrigger>
          <TabsTrigger value="setlists" className="font-bold">Setlists Guardados ({setlists.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="biblioteca">
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="w-[50px]">
                    <input 
                      type="checkbox" 
                      className="rounded border-border/40 text-primary focus:ring-primary"
                      checked={selectedSongs.length === filteredSongs.length && filteredSongs.length > 0}
                      onChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold">Título</TableHead>
                  <TableHead className="font-bold">Artista</TableHead>
                  <TableHead className="font-bold">Género</TableHead>
                  <TableHead className="font-bold">Época</TableHead>
                  <TableHead className="font-bold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSongs.map(song => (
                  <TableRow 
                    key={song.id} 
                    className={`border-border/40 transition-colors cursor-pointer ${selectedSongs.includes(song.id) ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                    onClick={() => toggleSongSelection(song.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedSongs.includes(song.id)}
                        onChange={() => toggleSongSelection(song.id)}
                        className="rounded border-border/40 text-primary focus:ring-primary"
                      />
                    </TableCell>
                    <TableCell className="font-bold text-foreground">{song.title}</TableCell>
                    <TableCell className="text-muted-foreground">{song.artist}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 bg-primary/10 text-[10px] font-black uppercase rounded text-primary border border-primary/20">
                        {song.genre || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-muted-foreground">
                        {song.era || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => openEdit(song)}
                        >
                          <Music className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => {
                            if(confirm("¿Borrar esta canción?")) {
                              startTransition(async () => {
                                await deleteSongsAction([song.id])
                                toast.success("Canción eliminada")
                              })
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="setlists">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {setlists.map(setlist => (
              <div key={setlist.id} className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm hover:border-primary/40 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <ListMusic className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => sendToBand(setlist)}>
                      <Send className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500/50 hover:text-red-500"
                      onClick={() => {
                        if(confirm("¿Borrar este setlist?")) {
                          startTransition(async () => {
                            await deleteSetlistAction(setlist.id)
                            toast.success("Setlist eliminado")
                          })
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-black text-xl text-foreground mb-1">{setlist.name}</h3>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-4">
                  {setlist.songs.length} Canciones
                </p>
                
                <div className="space-y-2 border-t border-border/40 pt-4">
                  {setlist.songs.slice(0, 3).map((ss: any) => (
                    <div key={ss.id} className="text-sm flex items-center gap-2 text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span className="truncate">{ss.song.title}</span>
                    </div>
                  ))}
                  {setlist.songs.length > 3 && (
                    <p className="text-xs text-primary font-bold">+{setlist.songs.length - 3} más...</p>
                  )}
                </div>

                <Button className="w-full mt-6 bg-primary/10 hover:bg-primary text-foreground hover:text-white border-none rounded-xl font-bold">
                  Ver y Editar
                </Button>
              </div>
            ))}
            
            {setlists.length === 0 && (
              <div className="col-span-full p-12 text-center border border-dashed border-border/40 rounded-3xl bg-card">
                <p className="text-muted-foreground">No tienes setlists guardados. Selecciona canciones en la biblioteca para crear uno.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
