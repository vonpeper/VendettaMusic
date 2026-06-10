"use client"

import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

const CancelBookingButton = dynamic(
  () => import("@/components/admin/CancelBookingButton").then(mod => mod.CancelBookingButton),
  { ssr: false, loading: () => (
    <Button variant="outline" className="w-full opacity-50 h-11 rounded-xl" disabled>
      Cargando cancelación...
    </Button>
  )}
)

const DeleteContractButton = dynamic(
  () => import("@/components/admin/DeleteContractButton").then(mod => mod.DeleteContractButton),
  { ssr: false, loading: () => (
    <Button variant="outline" className="w-full opacity-50 h-11 rounded-xl col-span-2" disabled>
      Cargando...
    </Button>
  )}
)

export function AdminManagementTools({ booking, config }: { booking: any, config?: any }) {
  const hasContract = !!(booking.event?.contracts?.length || booking.signedAt || booking.clientSignature)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4">
        <CancelBookingButton
          bookingId={booking.id}
          shortId={booking.shortId}
          hasEvent={!!booking.event}
          redirectOnSuccess={true}
        />
      </div>
      {hasContract && (
        <DeleteContractButton bookingId={booking.id} shortId={booking.shortId} />
      )}
    </div>
  )
}
