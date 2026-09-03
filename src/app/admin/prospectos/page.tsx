export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ProspectosClient } from "@/components/admin/ProspectosClient"
import { MessageSquare } from "lucide-react"

export default async function AdminProspectosPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  const rawInquiries = await db.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: { convertedBooking: { select: { id: true } } }
  })

  const inquiries = rawInquiries.map(item => ({
    id: item.id,
    name: item.name,
    phone: item.phone,
    email: item.email,
    requestedDate: item.requestedDate,
    eventType: item.eventType,
    message: item.message,
    status: item.status,
    matchedClientId: item.matchedClientId,
    convertedBookingId: item.convertedBooking?.id || null,
    createdAt: item.createdAt
  }))

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-primary" /> Prospectos y Consultas Web
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Bandeja administrativa de mensajes recibidos desde el formulario de contacto público.
          </p>
        </div>
      </div>

      <ProspectosClient initialInquiries={inquiries} />
    </div>
  )
}
