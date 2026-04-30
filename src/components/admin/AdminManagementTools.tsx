"use client"

import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

const EditBookingDialog = dynamic(
  () => import("@/components/admin/EditBookingDialog").then(mod => mod.EditBookingDialog),
  { ssr: false, loading: () => (
    <Button variant="outline" className="w-full opacity-50 h-11 rounded-xl" disabled>
      Cargando edición...
    </Button>
  )}
)

const CancelBookingButton = dynamic(
  () => import("@/components/admin/CancelBookingButton").then(mod => mod.CancelBookingButton),
  { ssr: false, loading: () => (
    <Button variant="outline" className="w-full opacity-50 h-11 rounded-xl" disabled>
      Cargando cancelación...
    </Button>
  )}
)

export function AdminManagementTools({ booking, config }: { booking: any, config?: any }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <EditBookingDialog booking={booking} config={config} />
      <CancelBookingButton 
        bookingId={booking.id} 
        shortId={booking.shortId} 
        hasEvent={!!booking.event} 
      />
    </div>
  )
}
