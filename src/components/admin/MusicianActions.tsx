"use client"

import { useState } from "react"
import { createMusicianProfileAction } from "@/actions/musicians"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Camera, UserPlus } from "lucide-react"

export function AddMusicianForm() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createMusicianProfileAction(formData)
    setLoading(false)
    if (result.success) {
      setOpen(false)
      setPreview(null)
    } else {
      alert(result.error)
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="h-9 px-4 text-xs font-black uppercase tracking-widest gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 border-none transition-all active:scale-95">
          <UserPlus className="w-4 h-4" />
          Agregar Personal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto admin-theme p-0 border border-border/30 shadow-2xl bg-card rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/10 bg-muted/5">
          <DialogTitle className="text-lg font-black text-foreground tracking-tight uppercase flex items-center gap-2">
            <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
            Agregar Personal / Músico
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Da de alta un nuevo miembro en el staff de la banda.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          {/* Fila 1: Foto y Nombre/WhatsApp */}
          <div className="flex gap-4 items-start">
            {/* Foto Picker Circular Compacto */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-blue-500/30 bg-blue-500/5 flex items-center justify-center overflow-hidden relative group hover:border-blue-500/60 transition-all cursor-pointer shadow-inner">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-5 h-5 text-muted-foreground group-hover:scale-110 transition-transform group-hover:text-blue-500" />
                )}
                <input 
                  type="file" 
                  name="image" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
              <span className="text-[8px] text-muted-foreground uppercase font-black tracking-wider">Foto</span>
            </div>

            {/* Nombre y WhatsApp */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Nombre Completo</label>
                <Input 
                  name="name" 
                  required 
                  placeholder="Ej. Pepe Bautista" 
                  className="bg-background border-border/40 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 h-9 text-xs rounded-lg" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">WhatsApp (10 dígitos)</label>
                <Input 
                  name="whatsapp" 
                  required 
                  placeholder="Ej. 7221234567" 
                  className="bg-background border-border/40 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 h-9 text-xs rounded-lg" 
                />
              </div>
            </div>
          </div>

          {/* Fila 2: Rol/Instrumento e Iniciales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Rol / Instrumento</label>
              <Select name="instrument" required>
                <SelectTrigger className="bg-background border-border/40 focus:ring-blue-500/20 h-9 text-xs rounded-lg">
                  <SelectValue placeholder="Selecciona un rol..." />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="Voz y Guitarra">🎸 Voz y Guitarra</SelectItem>
                  <SelectItem value="Voz Femenina">🎤 Voz Femenina</SelectItem>
                  <SelectItem value="Bajo">🎸 Bajo</SelectItem>
                  <SelectItem value="Batería">🥁 Batería</SelectItem>
                  <SelectItem value="Piano">🎹 Piano</SelectItem>
                  <SelectItem value="Saxofón">🎷 Saxofón</SelectItem>
                  <SelectItem value="Ingeniero de Audio">🎧 Ingeniero de Audio</SelectItem>
                  <SelectItem value="Técnico">🔧 Técnico</SelectItem>
                  <SelectItem value="Staff">🙋‍♂️ Staff General</SelectItem>
                  <SelectItem value="Proveedor">💼 Proveedor / Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Calificación Inicial</label>
              <Select name="rating" defaultValue="3">
                <SelectTrigger className="bg-background border-border/40 focus:ring-blue-500/20 h-9 text-xs rounded-lg">
                  <SelectValue placeholder="Calificación..." />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'Estrella' : 'Estrellas'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fila 3: Observaciones */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Observaciones / Notas</label>
            <textarea 
              name="notes" 
              placeholder="Notas generales, equipo propio, disponibilidad, etc."
              rows={2}
              className="flex w-full rounded-lg border border-border/40 bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-foreground resize-none"
            />
          </div>

          {/* Fila 4: Toggle Titular */}
          <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
            <div className="space-y-0.5">
              <span className="text-[11px] font-black text-foreground uppercase tracking-wide block">Músico Titular / Principal</span>
              <p className="text-[9px] text-muted-foreground">Marca si es parte de la alineación titular por defecto.</p>
            </div>
            <div className="relative inline-flex items-center">
              <input type="checkbox" name="isTitular" value="true" id="isTitularToggle" className="sr-only peer" defaultChecked />
              <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </div>

          {/* Fila 5: Botones de Acción */}
          <div className="pt-2 flex gap-3 border-t border-border/10">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="h-10 text-xs font-bold flex-1 border-border/40 hover:bg-muted/50 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase tracking-widest h-10 text-xs flex-[2] shadow-md shadow-blue-500/25 rounded-xl transition-all duration-200"
            >
              {loading ? "Guardando..." : "Registrar Personal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
