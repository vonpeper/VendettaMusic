"use client"

import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

const DeleteContractButton = dynamic(
  () => import("@/components/admin/DeleteContractButton").then(mod => mod.DeleteContractButton),
  { ssr: false, loading: () => (
    <Button variant="outline" className="w-full opacity-50 h-11 rounded-xl col-span-2" disabled>
      Cargando...
    </Button>
  )}
)

export function AdminManagementTools({ booking }: { booking: any }) {
  const hasContract = !!(booking.event?.contracts?.length || booking.signedAt || booking.clientSignature)

  return (
    <div className="space-y-3">
      {hasContract && (
        <DeleteContractButton bookingId={booking.id} shortId={booking.shortId} />
      )}
    </div>
  )
}
