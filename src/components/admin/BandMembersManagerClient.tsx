"use client"

import { useState } from "react"
import { createBandMemberAction, updateBandMemberAction, deleteBandMemberAction } from "@/actions/band-members"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserPlus, Pencil, Trash2, X, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

type PublicBandMember = {
  id: string
  name: string
  role: string
  emoji: string
  img: string
  shortBio: string
  fullBio: string
  ig: string | null
  order: number
}

export function BandMembersManagerClient({ members }: { members: PublicBandMember[] }) {
  const [editing, setEditing] = useState<PublicBandMember | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm("¿Deseas dar de baja a este integrante públicamente?")) return
    setLoading(true)
    const res = await deleteBandMemberAction(id)
    if (res.success) {
      toast.success("Músico retirado")
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    if (editing) {
      const res = await updateBandMemberAction(editing.id, formData)
      if (res.success) {
        toast.success("Perfil actualizado")
        setEditing(null)
      } else toast.error(res.error)
    } else {
      const res = await createBandMemberAction(formData)
      if (res.success) {
        toast.success("Nuevo músico agregado")
        setIsCreating(false)
      } else toast.error(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      
      {!isCreating && !editing && (
        <Button onClick={() => setIsCreating(true)} className="bg-primary text-foreground hover:bg-red-700 font-bold uppercase text-xs tracking-widest gap-2">
          <UserPlus className="w-4 h-4" /> Agregar Nuevo Integrante
        </Button>
      )}

      {(isCreating || editing) && (
        <Card className="bg-card border border-primary/40 shadow-2xl shadow-primary/10 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={() => { setIsCreating(false); setEditing(null) }}>
              <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </Button>
          </div>
          <CardHeader>
             <CardTitle className="text-xl font-black text-foreground uppercase tracking-tight">
               {editing ? "Editando Perfil Público" : "Nuevo Fichaje de la Banda"}
             </CardTitle>
             <CardDescription>Esta información será visible directamente en el Home.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-primary">Nombre</label>
                  <Input name="name" defaultValue={editing?.name} placeholder="Ej. Mauricio" required className="bg-primary/10 border-border/40" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-primary">Rol / Puesto</label>
                  <Input name="role" defaultValue={editing?.role} placeholder="Ej. Guitarra Líder" required className="bg-primary/10 border-border/40" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-primary">Emoji Representativo</label>
                  <Input name="emoji" defaultValue={editing?.emoji || "🎸"} required className="bg-primary/10 border-border/40" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-primary">Ruta de Foto Oficial</label>
                  <Input name="img" defaultValue={editing?.img || "/images/musicians/default.jpg"} required className="bg-primary/10 border-border/40" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-primary">Link Instagram (Opcional)</label>
                  <Input name="ig" defaultValue={editing?.ig || ""} placeholder="https://instagram.com/..." className="bg-primary/10 border-border/40" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-primary">Orden de Aparición</label>
                  <Input name="order" type="number" defaultValue={editing?.order || 0} required className="bg-primary/10 border-border/40" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-primary">Mini-Biografía (Tarjeta)</label>
                <Textarea name="shortBio" defaultValue={editing?.shortBio} required rows={2} className="bg-primary/10 border-border/40 resize-none" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-primary">Biografía Extendida (Modal)</label>
                <Textarea name="fullBio" defaultValue={editing?.fullBio} required rows={3} className="bg-primary/10 border-border/40 resize-none" />
              </div>

              <div className="pt-4 flex justify-end">
                 <Button type="submit" disabled={loading} className="gap-2 bg-primary text-white hover:bg-primary/90 font-bold uppercase tracking-widest px-8">
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                   Guardar Perfil Público
                 </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((m) => (
          <div key={m.id} className="relative rounded-2xl border border-border/40 bg-primary/10 overflow-hidden group">
            <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="secondary" className="w-8 h-8 bg-card hover:bg-primary/80 backdrop-blur-md" onClick={() => setEditing(m)}>
                 <Pencil className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="destructive" className="w-8 h-8 text-white" onClick={() => handleDelete(m.id)} disabled={loading}>
                 <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="h-40 relative">
               <Image src={m.img} alt={m.name} fill className="object-cover object-top" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
               <div className="absolute bottom-3 left-4">
                  <h3 className="font-black text-xl text-white flex items-center gap-2">{m.name} <span className="text-xl">{m.emoji}</span></h3>
                  <p className="text-xs uppercase tracking-widest text-primary font-bold">{m.role}</p>
               </div>
            </div>
            
            <div className="p-4">
               <p className="text-xs text-muted-foreground italic line-clamp-3">{m.shortBio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
