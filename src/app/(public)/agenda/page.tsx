export const dynamic = "force-dynamic"

import { Metadata } from "next"
import { getAgendaEventsAction } from "@/actions/agenda"
import { AgendaCalendarView } from "@/components/agenda/AgendaCalendarView"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  title: "Agenda de Fechas y Shows | Vendetta Music",
  description: "Agenda interna de fechas, horarios y presentaciones de Vendetta Music.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AgendaPage() {
  const [events, config] = await Promise.all([
    getAgendaEventsAction(),
    db.globalConfig.findUnique({ where: { id: "vendetta_config" } }).catch(() => null)
  ])

  const adminWhatsapp =
    config?.adminWhatsapp ||
    process.env.ADMIN_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    "5217222880045"

  return <AgendaCalendarView events={events} adminWhatsapp={adminWhatsapp} />
}
