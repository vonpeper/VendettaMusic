import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { isValidShortIdFormat } from "@/lib/folios"
import { formatDateMX } from "@/lib/utils"
import { generateResourceToken } from "@/lib/security"
import { PremiumClientQuoteView } from "@/components/quote/PremiumClientQuoteView"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic'

function buildLookupCandidates(rawIdInput: string) {
  const rawId = decodeURIComponent(rawIdInput || "").trim()
  const lookupUpper = rawId.toUpperCase()
  const normalizedWithPrefix = lookupUpper.startsWith("VND-")
    ? lookupUpper
    : `VND-${lookupUpper.replace(/^-+/, "")}`
  const bareId = lookupUpper.replace(/^VND-/, "").replace(/^-+/, "")

  return {
    rawId,
    lookupUpper,
    normalizedWithPrefix,
    bareId
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { rawId, lookupUpper, normalizedWithPrefix, bareId } = buildLookupCandidates(id)

  if (!isValidShortIdFormat(lookupUpper)) {
    return { title: "No encontrado | Vendetta Live Music" }
  }

  let booking = await db.bookingRequest.findFirst({
    where: {
      OR: [
        { shortId: lookupUpper },
        { shortId: normalizedWithPrefix },
        { shortId: bareId },
        { shortId: lookupUpper.toLowerCase() },
        { shortId: normalizedWithPrefix.toLowerCase() },
        { shortId: bareId.toLowerCase() },
        { id: rawId },
        { id: rawId.toLowerCase() },
        { eventId: rawId },
        { eventId: rawId.toLowerCase() },
        { adminNote: { contains: lookupUpper } },
        { adminNote: { contains: bareId } }
      ]
    }
  })

  if (!booking) {
    const eventMatch = await db.event.findFirst({
      where: {
        OR: [
          { id: rawId },
          { quoteId: rawId }
        ]
      },
      include: { bookingRequest: true }
    })
    if (eventMatch?.bookingRequest) {
      booking = eventMatch.bookingRequest
    }
  }

  if (!booking) {
    return {
      title: "No encontrado | Vendetta Live Music"
    }
  }

  const isConfirmed = booking.status === "agendado" || booking.status === "completado"
  const dateStr = booking.requestedDate ? formatDateMX(booking.requestedDate, "d 'de' MMMM") : ""
  
  const title = isConfirmed 
    ? `✍️ Firma de Contrato & Estatus (${booking.shortId || 'Show'}) | Vendetta Live Music`
    : `🎸 Cotización & Propuesta Exclusiva (${booking.shortId || 'Show'}) | Vendetta Live Music`
    
  const ogTitle = isConfirmed
    ? `✍️ Contrato Digital & Confirmación de Show (${booking.shortId || 'Show'})`
    : `🎸 Cotización de Show: ${booking.clientName} (${booking.shortId || 'Show'})`

  const description = isConfirmed
    ? `¡Fecha confirmada para ${booking.clientName} el ${dateStr}! Entra para consultar la ficha técnica y firmar digitalmente tu contrato de prestación de servicios.`
    : `Hola ${booking.clientName}, te compartimos la cotización exclusiva para tu evento el ${dateStr}. Revisa tu propuesta y aprueba tu fecha en línea.`

  const ogImage = isConfirmed
    ? 'https://vendetta.mx/images/opengraph-confirmacion.png'
    : 'https://vendetta.mx/images/opengraph-cotizacion.jpg?v=2'

  return {
    title,
    description,
    icons: {
      other: [
        {
          rel: 'image_src',
          url: ogImage,
        },
      ],
    },
    openGraph: {
      title: ogTitle,
      description,
      url: `https://vendetta.mx/status/${booking.shortId || booking.id}`,
      siteName: 'Vendetta Live Music',
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: `Cotización de Show: ${booking.clientName} (${booking.shortId || 'Show'})`,
          type: 'image/jpeg',
        },
      ],
      locale: 'es_MX',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [ogImage],
    },
  }
}

export default async function StatusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { rawId, lookupUpper, normalizedWithPrefix, bareId } = buildLookupCandidates(id)

  if (!isValidShortIdFormat(lookupUpper)) {
    return notFound()
  }

  const includeConfig = { 
    client: true,
    lineItems: { orderBy: { order: "asc" as const } },
    event: {
      include: {
        contracts: true,
        musicians: {
          include: {
            musician: {
              include: { user: true }
            }
          }
        }
      }
    }
  }

  let mainBooking = await db.bookingRequest.findFirst({
    where: {
      OR: [
        { shortId: lookupUpper },
        { shortId: normalizedWithPrefix },
        { shortId: bareId },
        { shortId: lookupUpper.toLowerCase() },
        { shortId: normalizedWithPrefix.toLowerCase() },
        { shortId: bareId.toLowerCase() },
        { id: rawId },
        { id: rawId.toLowerCase() },
        { eventId: rawId },
        { eventId: rawId.toLowerCase() },
        { adminNote: { contains: lookupUpper } },
        { adminNote: { contains: bareId } }
      ]
    },
    include: includeConfig
  })

  // Si no se encontró por booking directo, intentar por Event o Quote vinculado
  if (!mainBooking) {
    const eventMatch = await db.event.findFirst({
      where: {
        OR: [
          { id: rawId },
          { quoteId: rawId }
        ]
      },
      select: {
        bookingRequest: {
          select: { id: true }
        }
      }
    })
    if (eventMatch?.bookingRequest?.id) {
      mainBooking = await db.bookingRequest.findUnique({
        where: { id: eventMatch.bookingRequest.id },
        include: includeConfig
      })
    }
  }

  if (!mainBooking) {
    return notFound()
  }

  // Redirección canónica: Si se accedió por un folio sin prefijo (ej. 4A0F), por ID interno (UUID)
  // o por un folio largo legacy, redirigir canónicamente a la URL oficial del shortId
  if (mainBooking.shortId && lookupUpper !== mainBooking.shortId.toUpperCase()) {
    redirect(`/status/${mainBooking.shortId}`)
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
      lineItems={mainBooking.lineItems || []}
      globalConfig={globalConfig}
      downloadQuoteUrl={downloadQuoteUrl}
      downloadContractUrl={downloadContractUrl}
    />
  )
}
