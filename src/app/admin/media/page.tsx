import { db } from "@/lib/db"
import { MediaManagerClient } from "@/components/admin/MediaManagerClient"
import { BandMembersManagerClient } from "@/components/admin/BandMembersManagerClient"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Gestión de Medios | Admin Vendetta",
  description: "Panel de control multimedia para Vendetta",
}

export default async function AdminMediaPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin")
  }

  const allMedia = await db.siteMedia.findMany({
    orderBy: { createdAt: "desc" }
  })

  const groupedMedia = {
    hero: allMedia.find((m: any) => m.section === "hero") || null,
    mentiras: allMedia.find((m: any) => m.section === "mentiras") || null,
    arma_tu_show: allMedia.find((m: any) => m.section === "arma_tu_show") || null,
    video_home: allMedia.find((m: any) => m.section === "video_home") || null,
    galeria: allMedia.filter((m: any) => m.section === "galeria"),
  }

  const bandMembers = await db.publicBandMember.findMany({
    orderBy: { order: "asc" }
  })

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Medios & Galería</h1>
        <p className="text-sm text-muted-foreground mt-1">Sube tus fotos o videos y actualiza el Home en tiempo real.</p>
      </div>
      
      <MediaManagerClient initialData={groupedMedia} />

      <div className="pt-12 border-t border-border/40 mt-12">
        <div>
          <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Alineación de la Banda</h2>
          <p className="text-sm text-muted-foreground mt-1">Edita los textos públicos e imágenes de los Músicos del Home.</p>
        </div>
        <div className="mt-8">
          <BandMembersManagerClient members={bandMembers} />
        </div>
      </div>
    </div>
  )
}
