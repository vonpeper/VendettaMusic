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
      title: "Propuesta comercial | Vendetta Live Music"
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
      url: `https://vendetta.mx/propuesta/${booking.shortId}`,
      siteName: 'Vendetta Live Music',
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: `Cotización de Show: ${booking.clientName} (${booking.shortId})`,
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
