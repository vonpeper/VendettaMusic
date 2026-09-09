import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { isValidShortIdFormat } from "@/lib/folios"
import { formatDateMX } from "@/lib/utils"
import { generateResourceToken } from "@/lib/security"
import { PremiumClientQuoteView } from "@/components/quote/PremiumClientQuoteView"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const lookupId = (id || "").trim().toUpperCase()

  if (!isValidShortIdFormat(lookupId)) {
    return { title: "No encontrado | Vendetta Live Music" }
  }

  const isUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(lookupId)
  const booking = await db.bookingRequest.findFirst({
    where: isUuid
      ? { OR: [{ shortId: lookupId }, { id: id.trim() }] }
      : { shortId: lookupId }
  })

  if (!booking) {
    return {
      title: "No encontrado | Vendetta Live Music"
    }
  }

  const isConfirmed = booking.status === "agendado" || booking.status === "completado"
  const dateStr = booking.requestedDate ? formatDateMX(booking.requestedDate, "d 'de' MMMM") : ""
  
  const title = isConfirmed 
    ? `✍️ Firma de Contrato & Estatus (${booking.shortId}) | Vendetta Live Music`
    : `🎸 Cotización & Propuesta Exclusiva (${booking.shortId}) | Vendetta Live Music`
    
  const ogTitle = isConfirmed
    ? `✍️ Contrato Digital & Confirmación de Show (${booking.shortId})`
    : `🎸 Cotización de Show: ${booking.clientName} (${booking.shortId})`

  const description = isConfirmed
    ? `¡Fecha confirmada para ${booking.clientName} el ${dateStr}! Entra para consultar la ficha técnica y firmar digitalmente tu contrato de prestación de servicios.`
    : `Hola ${booking.clientName}, te compartimos la cotización exclusiva para tu evento el ${dateStr}. Revisa tu propuesta y aprueba tu fecha en línea.`

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: `https://vendetta.mx/status/${booking.shortId}`,
      siteName: 'Vendetta Live Music',
      images: [
        {
          url: 'https://vendetta.mx/images/opengraph-evento.png',
          width: 1200,
          height: 630,
          alt: 'Vendetta Live Music',
        },
      ],
      locale: 'es_MX',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: ['https://vendetta.mx/images/opengraph-evento.png'],
    },
  }
}

export default async function StatusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lookupId = (id || "").trim().toUpperCase()

  if (!isValidShortIdFormat(lookupId)) {
    return notFound()
  }

  const isUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(lookupId)
  const mainBooking = await db.bookingRequest.findFirst({
    where: isUuid
      ? { OR: [{ shortId: lookupId }, { id: id.trim() }] }
      : { shortId: lookupId },
    include: { 
      client: true,
      lineItems: { orderBy: { order: "asc" } },
      event: {
        include: {
          contracts: true
        }
      }
    }
  })

  if (!mainBooking) {
    return notFound()
  }

  const globalConfig = await db.globalConfig.findUnique({
    where: { id: "vendetta_config" }
  })

  const pdfToken = generateResourceToken(mainBooking.id)
  const downloadQuoteUrl = `/api/admin/contract/${mainBooking.id}?token=${pdfToken}&type=quote`
  const downloadContractUrl = `/api/admin/contract/${mainBooking.id}?token=${pdfToken}`

  return (
    <PremiumClientQuoteView
      booking={mainBooking}
      lineItems={mainBooking.lineItems}
      globalConfig={globalConfig}
      downloadQuoteUrl={downloadQuoteUrl}
      downloadContractUrl={downloadContractUrl}
    />
  )
}
