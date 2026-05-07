import { rejectAttendanceAction } from "@/actions/confirmations"
import { redirect } from "next/navigation"

export default async function RejectGoPage({
  params,
}: {
  params: Promise<{ musicianId: string; eventId: string }>;
}) {
  const { musicianId, eventId } = await params

  await rejectAttendanceAction(musicianId, eventId)
  
  redirect(`/confirmar/${musicianId}/${eventId}?rejected=true`)
}
