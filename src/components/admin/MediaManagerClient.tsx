"use client"

import { useState, useRef } from "react"
import { uploadMedia, deleteMedia, saveVideoLink } from "@/actions/media"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, UploadCloud, Video, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

type MediaGroup = {
  hero: any | null
  mentiras: any | null
  arma_tu_show: any | null
  video_home: any | null
  galeria: any[]
}

export function MediaManagerClient({ initialData }: { initialData: MediaGroup }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState(initialData.video_home?.url || "")

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(section)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("section", section)

    const res = await uploadMedia(formData)
    setLoading(null)

    if (res.success) {
      toast.success("Imagen subida con éxito")
      // In a real scenario, we would refresh the page or update state locally. 
      // RevalidatePath already triggers a reload for the Server Component, 
      // but Since we passed initialData, a refresh is the safest to get new IDs:
      window.location.reload()
    } else {
      toast.error(res.error || "Error al subir imagen")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar de forma permanente?")) return
    setLoading("delete_" + id)
    const res = await deleteMedia(id)
    if (res.success) {
      toast.success("Eliminado")
      window.location.reload()
    } else {
      toast.error(res.error || "Error al eliminar")
      setLoading(null)
    }
  }

  const handleSaveVideo = async () => {
    if (!videoUrl) return toast.error("Ingresa una URL válida")
    setLoading("video")
    const res = await saveVideoLink("video_home", videoUrl)
    setLoading(null)
    if (res.success) {
      toast.success("Enlace de video guardado")
      window.location.reload()
    } else {
      toast.error(res.error || "Error al guardar video")
    }
  }

  const FileUploader = ({ section, label }: { section: string, label: string }) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isUploading = loading === section

    return (
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-white/80">{label}</label>
        <div className="flex items-center gap-4">
          <input 
             type="file" 
             accept="image/*" 
             className="hidden" 
             ref={fileInputRef}
             onChange={(e) => handleUpload(e, section)} 
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full bg-white/5 hover:bg-white/10 text-white/70 border-white/10"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
            Seleccionar archivo...
          </Button>
        </div>
      </div>
    )
  }

  const PreviewImage = ({ media }: { media: any }) => {
    if (!media) return <div className="h-32 w-full border border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/30"><ImageIcon className="w-6 h-6" /></div>
    return (
      <div className="relative group w-full h-32 rounded-xl overflow-hidden border border-white/10">
        <Image src={media.url} alt="preview" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
          <Button variant="destructive" size="sm" onClick={() => handleDelete(media.id)} disabled={loading === "delete_"+media.id}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
      <Card className="bg-white/5 border-white/10">
        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Banners Dinámicos</CardTitle></CardHeader>
        <CardContent className="space-y-8">
           <div className="grid grid-cols-2 gap-4 items-end">
              <FileUploader section="hero" label="Imagen Hero Principal" />
              <PreviewImage media={data.hero} />
           </div>
           <div className="grid grid-cols-2 gap-4 items-end">
              <FileUploader section="mentiras" label="Banner 'Mentiras'" />
              <PreviewImage media={data.mentiras} />
           </div>
           <div className="grid grid-cols-2 gap-4 items-end">
              <FileUploader section="arma_tu_show" label="Banner 'Arma Tu Show'" />
              <PreviewImage media={data.arma_tu_show} />
           </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Video className="w-5 h-5"/> Video Promocional</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">Ingresa el enlace a tu video de YouTube para el botón del Home.</p>
          <div className="flex gap-2">
            <Input 
              placeholder="Ej. https://www.youtube.com/watch?v=..." 
              value={videoUrl} 
              onChange={(e) => setVideoUrl(e.target.value)} 
              className="bg-black/50 border-white/20 text-white"
            />
            <Button onClick={handleSaveVideo} disabled={loading === "video"}>
              {loading === "video" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </Button>
          </div>
          {data.video_home?.url && (
            <div className="mt-4 p-4 border border-green-500/30 bg-green-500/10 rounded-lg text-sm text-green-300 break-all">
              Vinculado actual: {data.video_home.url}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 bg-white/5 border-white/10">
        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Galería de Experiencias</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-xs">
            <FileUploader section="galeria" label="Añadir nueva foto a la galería" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.galeria.map((media) => (
              <PreviewImage key={media.id} media={media} />
            ))}
            {data.galeria.length === 0 && (
               <p className="text-white/40 text-sm col-span-full">La galería está vacía.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
