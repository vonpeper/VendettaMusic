import { cache } from "react"
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

/**
 * Consulta de BookingRequest deduplicada por petición mediante React.cache().
 * Garantiza que generateMetadata y StatusDetailPage compartan exactamente
 * el mismo resultado en memoria sin duplicar consultas a la base de datos.
 */
export const getBookingData = cache(async (rawIdInput: string) => {
  const { rawId, lookupUpper, normalizedWithPrefix, bareId } = buildLookupCandidates(rawIdInput)

  if (!isValidShortIdFormat(lookupUpper)) {
    return null
  }

  const includeConfig = { 
    client: { include: { user: true } },
    lineItems: { orderBy: { order: "asc" as const } },
    payments: true,
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

  return mainBooking
})

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const booking = await getBookingData(id)

  if (!booking) {
    return {
      title: "Propuesta Formal | Vendetta Live Music",
      description: "Propuesta formal y términos de contratación con Vendetta Live Music."
    }
  }

  const clientName = booking.clientName?.trim() || booking.client?.user?.name?.trim() || "Cliente Exclusivo"
  const folio = booking.shortId || booking.id
  const eventDate = booking.requestedDate ? formatDateMX(booking.requestedDate, "d 'de' MMMM 'de' yyyy") : "tu fecha especial"
  const venueCity = booking.city || booking.municipio || (booking.address ? booking.address.split(",")[0].trim() : "tu locación")

  const isConfirmed = 
    booking.status === "agendado" || 
    booking.status === "confirmado" || 
    booking.paymentStatus === "paid" || 
    booking.paymentStatus === "partial" || 
    Boolean(booking.event)

  const title = isConfirmed
    ? `Show Confirmado | Contrato Digital — ${clientName} | Vendetta Live Music`
    : `Propuesta Oficial | Vendetta Live Music — ${clientName}`

  const description = isConfirmed
    ? `Tu fecha para el ${eventDate} en ${venueCity} está confirmada y bloqueada en nuestra agenda. Entra y firma tu contrato digital de servicios artísticos.`
    : `Show de Pop Rock en Vivo para el ${eventDate} en ${venueCity}. Revisa tu propuesta formal personalizada y asegura tu fecha.`

  const ogDescription = isConfirmed
    ? "Tu fecha ha quedado oficialmente bloqueada en nuestra agenda. Entra y firma digitalmente tu contrato en nuestro portal."
    : "Revisa tu propuesta formal personalizada y confirma tu fecha directamente en nuestro portal digital."

  const ogImageUrl = isConfirmed
    ? "https://vendetta.mx/images/og/vendetta-contract-card.jpg?v=20261110v5"
    : "https://vendetta.mx/images/og/vendetta-proposal-card.jpg?v=20261110v5"

  const ogAlt = isConfirmed
    ? "Vendetta Live Music Show Confirmado y Contrato Digital"
    : "Vendetta Live Music Propuesta Oficial de Show"

  return {
    title,
    description,
    icons: {
      other: [
        {
          rel: 'image_src',
          url: ogImageUrl,
        },
      ],
    },
    openGraph: {
      title,
      description: ogDescription,
      url: `https://vendetta.mx/status/${folio}`,
      siteName: "Vendetta Live Music",
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          alt: ogAlt,
          type: "image/jpeg",
        },
      ],
      locale: "es_MX",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription,
      images: [ogImageUrl],
    },
  }
}

export default async function StatusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { lookupUpper } = buildLookupCandidates(id)

  const mainBooking = await getBookingData(id)

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
