export const dynamic = "force-dynamic"

import { Metadata } from "next"
import { getAgendaEventsAction } from "@/actions/agenda"
import { AgendaCalendarView } from "@/components/agenda/AgendaCalendarView"

export const metadata: Metadata = {
  title: "Agenda de Fechas y Shows | Vendetta Music",
  description: "Calendario en tiempo real de fechas, horarios y locaciones de shows de Vendetta Music.",
}

export default async function AgendaPage() {
  const events = await getAgendaEventsAction()

  return <AgendaCalendarView events={events} />
}
