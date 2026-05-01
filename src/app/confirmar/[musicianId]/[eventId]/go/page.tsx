import { confirmAttendanceAction } from "@/actions/confirmations"
import { redirect } from "next/navigation"

export default async function ConfirmGoPage({
  params,
}: {
  params: Promise<{ musicianId: string; eventId: string }>;
}) {
  const { musicianId, eventId } = await params

  await confirmAttendanceAction(musicianId, eventId)
  
  redirect(`/confirmar/${musicianId}/${eventId}?success=true`)
}
