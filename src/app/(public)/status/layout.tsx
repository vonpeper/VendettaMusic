import { Metadata } from "next"

export const metadata: Metadata = {
  title: "🔍 Consulta de Estatus de Evento | Vendetta Live Music",
  description: "Ingresa tu folio de seguimiento (VND-XXXX) para conocer el estatus de tu evento, revisar tu cotización o firmar tu contrato digital.",
  openGraph: {
    title: "🔍 Consulta de Estatus de Evento | Vendetta Live Music",
    description: "Ingresa tu folio de seguimiento para consultar tu cotización o firmar tu contrato digital.",
    url: "https://vendetta.mx/status",
    siteName: "Vendetta Live Music",
    images: [
      {
        url: "https://vendetta.mx/images/opengraph-evento.png",
        width: 1200,
        height: 630,
        alt: "Consulta de Estatus Vendetta Live Music",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🔍 Consulta de Estatus de Evento | Vendetta Live Music",
    description: "Ingresa tu folio de seguimiento para consultar tu cotización o firmar tu contrato digital.",
    images: ["https://vendetta.mx/images/opengraph-evento.png"],
  },
}

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
