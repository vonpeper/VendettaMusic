export const dynamic = "force-dynamic"

import { Metadata } from "next"
import { getAgendaEventsAction } from "@/actions/agenda"
import { AgendaCalendarView } from "@/components/agenda/AgendaCalendarView"

export const metadata: Metadata = {
  title: "⚡ Vendetta Agenda | Calendario & Convocatorias en Vivo",
  description: "Agenda interna de fechas, llamados, horarios y presentaciones en vivo de Vendetta Music.",
  openGraph: {
    title: "⚡ Vendetta Agenda | Calendario & Convocatorias",
    description: "Consulta fechas confirmadas, llamados de montaje, horarios y vestimenta en tiempo real.",
    url: "https://vendetta.mx/agenda",
    siteName: "Vendetta Music Operations",
    images: [
      {
        url: "https://vendetta.mx/images/opengraph-confirmacion.png",
        width: 1200,
        height: 630,
        alt: "Agenda de Shows Vendetta Live Music",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "⚡ Vendetta Agenda | Calendario & Convocatorias",
    description: "Consulta fechas confirmadas, llamados de montaje y horarios en tiempo real.",
    images: ["https://vendetta.mx/images/opengraph-confirmacion.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AgendaPage() {
  const events = await getAgendaEventsAction()

  return <AgendaCalendarView events={events} />
}
