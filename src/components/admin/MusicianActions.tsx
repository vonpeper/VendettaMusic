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
        <Button size="sm" variant="default" className="h-9 px-4 text-xs font-black uppercase tracking-widest gap-2 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#D81B60] text-white hover:shadow-lg hover:shadow-pink-500/30 border-none transition-all active:scale-95">
          <UserPlus className="w-4 h-4" />
          Agregar Personal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] admin-theme">
        <DialogHeader>
          <DialogTitle>Agregar Personal / Titular</DialogTitle>
          <DialogDescription>
            Da de alta un nuevo miembro del equipo, músico titular o ingeniero.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-border/40 bg-primary/10 flex items-center justify-center overflow-hidden relative group">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-muted-foreground" />
              )}
              <input 
                type="file" 
                name="image" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Foto del Músico</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre Completo</label>
            <Input name="name" required placeholder="Ej. Pepe Bautista" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rol / Instrumento</label>
            <Select name="instrument" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Voz y Guitarra">Voz y Guitarra</SelectItem>
                <SelectItem value="Voz Femenina">Voz Femenina</SelectItem>
                <SelectItem value="Bajo">Bajo</SelectItem>
                <SelectItem value="Batería">Batería</SelectItem>
                <SelectItem value="Piano">Piano</SelectItem>
                <SelectItem value="Saxofón">Saxofón</SelectItem>
                <SelectItem value="Ingeniero de Audio">Ingeniero de Audio</SelectItem>
                <SelectItem value="Técnico">Técnico</SelectItem>
                <SelectItem value="Staff">Staff General</SelectItem>
                <SelectItem value="Proveedor">Proveedor / Externo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">WhatsApp (10 dígitos)</label>
            <Input name="whatsapp" required placeholder="Ej. 7221234567" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Calificación inicial</label>
            <Select name="rating" defaultValue="3">
              <SelectTrigger>
                <SelectValue placeholder="Calificación..." />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(n => (
                  <SelectItem key={n} value={n.toString()}>{n} Estrellas</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones / Notas</label>
            <textarea 
              name="notes" 
              placeholder="Notas generales, equipo propio, etc."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={loading} className="w-full text-white">
              {loading ? "Guardando..." : "Guardar Personal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
