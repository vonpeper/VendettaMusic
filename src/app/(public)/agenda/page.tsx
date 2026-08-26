export const dynamic = "force-dynamic"

import { Metadata } from "next"
import { getAgendaEventsAction } from "@/actions/agenda"
import { AgendaCalendarView } from "@/components/agenda/AgendaCalendarView"

export const metadata: Metadata = {
  title: "Agenda de Fechas y Shows | Vendetta Music",
  description: "Agenda interna de fechas, horarios y presentaciones de Vendetta Music.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
}

export default async function AgendaPage() {
  const events = await getAgendaEventsAction()

  return <AgendaCalendarView events={events} />
}
