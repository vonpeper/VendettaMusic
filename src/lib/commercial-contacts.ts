import { db } from "@/lib/db"

/**
 * Extrae los últimos 10 dígitos numéricos de cualquier formato telefónico o JID de WhatsApp.
 * Retorna null si no contiene al menos 10 dígitos.
 */
export function extractLast10(phoneOrJid?: string | null): string | null {
  if (!phoneOrJid) return null
  const bare = phoneOrJid.split("@")[0] || ""
  const digits = bare.replace(/\D/g, "")
  if (digits.length < 10) return null
  return digits.slice(-10)
}

/**
 * Genera variaciones comunes de espaciado y formato para un número de 10 dígitos,
 * permitiendo cruzar con números guardados con espacios o guiones en la base de datos.
 */
export function getPhoneSearchVariants(last10: string): string[] {
  if (!last10 || last10.length !== 10) return last10 ? [last10] : []

  const d3_3_4 = `${last10.slice(0, 3)} ${last10.slice(3, 6)} ${last10.slice(6)}` // 722 634 2452
  const d2_4_4 = `${last10.slice(0, 2)} ${last10.slice(2, 6)} ${last10.slice(6)}` // 55 1234 5678
  const d3_3_4_dash = `${last10.slice(0, 3)}-${last10.slice(3, 6)}-${last10.slice(6)}` // 722-634-2452
  const d2_4_4_dash = `${last10.slice(0, 2)}-${last10.slice(2, 6)}-${last10.slice(6)}` // 55-1234-5678
  const d3_3_2_2 = `${last10.slice(0, 3)} ${last10.slice(3, 6)} ${last10.slice(6, 8)} ${last10.slice(8)}` // 722 634 24 52
  const d2_2_2_2_2 = `${last10.slice(0, 2)} ${last10.slice(2, 4)} ${last10.slice(4, 6)} ${last10.slice(6, 8)} ${last10.slice(8)}`
  const paren3 = `(${last10.slice(0, 3)}) ${last10.slice(3, 6)} ${last10.slice(6)}`
  const paren3_dash = `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`
  const paren2 = `(${last10.slice(0, 2)}) ${last10.slice(2, 6)} ${last10.slice(6)}`
  const paren2_dash = `(${last10.slice(0, 2)}) ${last10.slice(2, 6)}-${last10.slice(6)}`

  return Array.from(new Set([
    last10,
    d3_3_4,
    d2_4_4,
    d3_3_4_dash,
    d2_4_4_dash,
    d3_3_2_2,
    d2_2_2_2_2,
    paren3,
    paren3_dash,
    paren2,
    paren2_dash
  ]))
}

export interface CommercialContactResult {
  isCommercial: boolean
  last10: string | null
  client: {
    id: string
    whatsapp: string | null
    user?: { name: string | null } | null
  } | null
  booking: {
    id: string
    clientName: string
    clientPhone: string
    clientId: string | null
  } | null
  inquiry: {
    id: string
    name: string
    phone: string | null
    matchedClientId: string | null
    convertedBooking: {
      id: string
      clientName: string
      clientId: string | null
    } | null
  } | null
}

/**
 * Valida si los últimos 10 dígitos del remitente existen en BookingRequest,
 * ContactInquiry o ClientProfile.
 */
export async function findCommercialContact(phoneOrJid?: string | null): Promise<CommercialContactResult> {
  const emptyResult: CommercialContactResult = {
    isCommercial: false,
    last10: null,
    client: null,
    booking: null,
    inquiry: null,
  }

  if (!phoneOrJid) return emptyResult

  // Descartar grupos o broadcasts inmediatamente
  if (phoneOrJid.includes("@g.us") || phoneOrJid.includes("@broadcast")) {
    return emptyResult
  }

  const last10 = extractLast10(phoneOrJid)
  if (!last10) {
    return emptyResult
  }

  const variants = getPhoneSearchVariants(last10)

  const [client, booking, inquiry] = await Promise.all([
    db.clientProfile.findFirst({
      where: {
        OR: variants.map((v) => ({ whatsapp: { contains: v } })),
      },
      include: {
        user: { select: { name: true } },
      },
    }),
    db.bookingRequest.findFirst({
      where: {
        OR: variants.map((v) => ({ clientPhone: { contains: v } })),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clientName: true,
        clientPhone: true,
        clientId: true,
      },
    }),
    db.contactInquiry.findFirst({
      where: {
        OR: variants.map((v) => ({ phone: { contains: v } })),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        matchedClientId: true,
        convertedBooking: {
          select: {
            id: true,
            clientName: true,
            clientId: true,
          },
        },
      },
    }),
  ])

  const isCommercial = Boolean(client || booking || inquiry)

  return {
    isCommercial,
    last10,
    client,
    booking,
    inquiry,
  }
}

/**
 * Purga de la tabla InboxItem todos los registros huérfanos que no tienen relación
 * con un BookingRequest, ContactInquiry o ClientProfile válido.
 */
export async function purgeOrphanInboxItems(): Promise<{
  totalScanned: number
  deletedCount: number
  remainingCount: number
}> {
  const allItems = await db.inboxItem.findMany({
    select: {
      id: true,
      phoneNumber: true,
      clientId: true,
      bookingRequestId: true,
    },
  })

  const orphanIds: string[] = []

  // Cache en memoria para no repetir consultas en teléfonos duplicados
  const commercialPhoneCache = new Map<string, boolean>()

  for (const item of allItems) {
    // 1. Si tiene bookingRequestId, verificar que la cotización siga existiendo
    if (item.bookingRequestId) {
      const bookingExists = await db.bookingRequest.findUnique({
        where: { id: item.bookingRequestId },
        select: { id: true },
      })
      if (bookingExists) {
        continue // Es un mensaje válido vinculado a un booking
      }
    }

    // 2. Si tiene clientId, verificar que el perfil siga existiendo
    if (item.clientId) {
      const clientExists = await db.clientProfile.findUnique({
        where: { id: item.clientId },
        select: { id: true },
      })
      if (clientExists) {
        continue // Es un mensaje válido vinculado a un cliente
      }
    }

    // 3. Si no tiene FKs válidas, verificar por número telefónico
    const last10 = extractLast10(item.phoneNumber)
    if (!last10) {
      // Teléfono inválido o de grupo -> Huérfano
      orphanIds.push(item.id)
      continue
    }

    let isCommercial = commercialPhoneCache.get(last10)
    if (isCommercial === undefined) {
      const match = await findCommercialContact(last10)
      isCommercial = match.isCommercial
      commercialPhoneCache.set(last10, isCommercial)
    }

    if (!isCommercial) {
      orphanIds.push(item.id)
    }
  }

  let deletedCount = 0
  if (orphanIds.length > 0) {
    // Eliminar en lotes de 100 para evitar límites de parámetros SQL
    const chunkSize = 100
    for (let i = 0; i < orphanIds.length; i += chunkSize) {
      const chunk = orphanIds.slice(i, i + chunkSize)
      const res = await db.inboxItem.deleteMany({
        where: { id: { in: chunk } },
      })
      deletedCount += res.count
    }
  }

  const remainingCount = allItems.length - deletedCount

  return {
    totalScanned: allItems.length,
    deletedCount,
    remainingCount,
  }
}
