import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { formatDateMX } from "@/lib/utils"
import { generateResourceToken } from "@/lib/security"
import { PremiumClientQuoteView } from "@/components/quote/PremiumClientQuoteView"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const lookupId = (id || "").trim().toUpperCase()

  const booking = await db.bookingRequest.findFirst({
    where: {
      OR: [
        { shortId: lookupId },
        { id: id.trim() },
        { adminNote: { contains: lookupId } }
      ]
    }
  })

  if (!booking) {
    return {
      title: "Propuesta Formal | Vendetta Live Music",
      description: "Propuesta formal y términos de contratación con Vendetta Live Music."
    }
  }

  const clientName = booking.clientName?.trim() || "Cliente Exclusivo"
  const folio = booking.shortId || booking.id
  const eventDate = booking.requestedDate ? formatDateMX(booking.requestedDate, "d 'de' MMMM 'de' yyyy") : "tu fecha especial"
  const venueCity = booking.city || booking.municipio || (booking.address ? booking.address.split(",")[0].trim() : "tu locación")

  const title = `Propuesta Formal | Vendetta Live Music — ${clientName}`
  const description = `Show de Pop Rock en Vivo para el ${eventDate} en ${venueCity}. Revisa tu propuesta formal y firma en línea para apartar tu fecha.`
  const ogDescription = "Revisa tu propuesta formal y asegura tu fecha en línea con Vendetta Live Music."
  const ogImageUrl = "https://vendetta.mx/images/og/vendetta-proposal-card.jpg"

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
          alt: "Vendetta Live Music Propuesta Formal",
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

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lookupId = (id || "").trim().toUpperCase()

  const booking = await db.bookingRequest.findFirst({
    where: {
      OR: [
        { shortId: lookupId },
        { id: id.trim() },
        { adminNote: { contains: lookupId } }
      ]
    },
    include: {
      client: {
        include: { user: true }
      },
      lineItems: { orderBy: { order: "asc" } },
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
  })

  if (!booking) {
    return notFound()
  }

  // Si se accedió por un folio largo legacy pero la cotización tiene un folio estándar corto oficial,
  // redirigir canónicamente a la URL del folio estándar
  if (booking.shortId && lookupId !== booking.shortId.toUpperCase() && lookupId.startsWith("VND-") && lookupId.length > 10) {
    redirect(`/propuesta/${booking.shortId}`)
  }

  const globalConfig = await db.globalConfig.findUnique({
    where: { id: "vendetta_config" }
  })

  // Generar token seguro para descarga pública de cotización / contrato
  const pdfToken = generateResourceToken(booking.id)
  const downloadQuoteUrl = `/api/admin/contract/${booking.id}?token=${pdfToken}&type=quote`
  const downloadContractUrl = `/api/admin/contract/${booking.id}?token=${pdfToken}`

  return (
    <PremiumClientQuoteView
      booking={booking}
      lineItems={booking.lineItems}
      globalConfig={globalConfig}
      downloadQuoteUrl={downloadQuoteUrl}
      downloadContractUrl={downloadContractUrl}
    />
  )
}
