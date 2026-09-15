"use server"

import { db } from "@/lib/db"
import { createUnifiedQuote } from "@/lib/quote-service"
import { calculateShowBasePrice } from "@/lib/pricing"
import { sendWhatsApp } from "@/lib/notifications/whatsapp"

export interface SubmitPublicQuoteInput {
  nombre: string
  telefono: string
  tipoEvento: string
  fecha: string // YYYY-MM-DD
  horaInicio: string
  horaFin: string
  invitados: number
  produccionAdicional: string[]
  estado: string
  municipio: string
  lugarEvento?: string
  mapsLink?: string
  viaticos: {
    amount: number
    distanceKm: number
    isOutsideZone: boolean
    description?: string
  } | null
  paquete?: string
  notas?: string
}

export type SubmitPublicQuoteResult = {
  success: boolean
  mode: "auto_quote" | "needs_review"
  shortId?: string
  bookingId?: string
  inquiryId?: string
  proposalUrl?: string
  error?: string
}

function formatFechaEspanol(fechaStr: string): string {
  if (!fechaStr) return ""
  try {
    const [year, month, day] = fechaStr.split("-").map(Number)
    if (!year || !month || !day) return fechaStr
    const fechaObj = new Date(year, month - 1, day, 12, 0, 0)
    const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(fechaObj)
    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)
  } catch {
    return fechaStr
  }
}

function buildClientWhatsAppMessage(params: {
  nombre: string
  tipoEvento: string
  fecha: string
  horaInicio: string
  horaFin: string
  invitados: number
  municipio: string
  estado: string
  lugarEvento?: string
  mapsLink?: string
  viaticosAmount: number
  produccionAdicional: string[]
  paquete?: string
  proposalUrl?: string
  notas?: string
}): string {
  const fechaFormateada = formatFechaEspanol(params.fecha) || params.fecha
  const horario = `${params.horaInicio} a ${params.horaFin}`
  const ubicacion = `${params.municipio}, ${params.estado}${params.lugarEvento?.trim() ? ` (${params.lugarEvento.trim()})` : ""}`

  let textoViaticos = "Zona local (sin costo adicional de viáticos)"
  if (params.viaticosAmount > 0) {
    textoViaticos = `$${params.viaticosAmount.toLocaleString("es-MX")} MXN (Incluye casetas ida y vuelta y gasto de gasolina para 2 camionetas y el transporte de 5 personas)`
  }

  const lines = [
    `¡Hola ${params.nombre.trim()}! 👋🎸`,
    "Recibimos con éxito tu formulario para personalizar la propuesta de tu evento con Vendetta Live Music:",
    "",
    "📋 *RESUMEN DE TU SOLICITUD*",
    ...(params.paquete ? [`• *Paquete:* ${params.paquete}`] : []),
    `• *Tipo de Evento:* ${params.tipoEvento}`,
    `• *Fecha:* ${fechaFormateada}`,
    `• *Horario:* ${horario}`,
    `• *Invitados estimados:* ${params.invitados} personas`,
    `• *Ubicación:* ${ubicacion}`,
    ...(params.mapsLink?.trim() ? [`• *Google Maps:* ${params.mapsLink.trim()}`] : []),
    ...(params.produccionAdicional.length > 0 ? [
      "",
      "• *Producción solicitada:*",
      ...params.produccionAdicional.map((p) => `  - ${p}`)
    ] : []),
    "",
    "🚗 *LOGÍSTICA Y VIÁTICOS*",
    `• *Viáticos estimados:* ${textoViaticos}`,
    "• *Condiciones:* No incluye planta de luz. Viáticos para 2 camionetas (gasolina y casetas únicamente). No incluye alimentos.",
    ...(params.notas?.trim() ? [`\n📝 *Notas adicionales:* ${params.notas.trim()}`] : []),
  ]

  if (params.proposalUrl) {
    lines.push(
      "",
      "🔗 *Puedes consultar tu propuesta interactiva en línea aquí:*",
      params.proposalUrl
    )
  }

  lines.push(
    "",
    "En breve estaré asistiéndole personalmente por este medio para verificar la disponibilidad de tu fecha y afinar cualquier detalle. ¡Muchas gracias por tu interés en Vendetta!",
    "Vendetta Live Music ⚡"
  )

  return lines.join("\n")
}

export async function submitPublicQuoteAction(
  input: SubmitPublicQuoteInput
): Promise<SubmitPublicQuoteResult> {
  try {
    if (!input.nombre || !input.nombre.trim()) {
      return { success: false, mode: "needs_review", error: "El nombre es obligatorio" }
    }
    if (!input.telefono || !input.telefono.trim()) {
      return { success: false, mode: "needs_review", error: "El teléfono de WhatsApp es obligatorio" }
    }
    if (!input.fecha) {
      return { success: false, mode: "needs_review", error: "La fecha del evento es obligatoria" }
    }
    if (!input.municipio || !input.municipio.trim()) {
      return { success: false, mode: "needs_review", error: "El municipio es obligatorio" }
    }

    const tieneExtras = Array.isArray(input.produccionAdicional) && input.produccionAdicional.length > 0
    const aforo = Number(input.invitados) || 50
    const isAutoQuote = aforo <= 100 && !tieneExtras

    const baseLocalPrice = 8500
    const isOutside = input.viaticos?.isOutsideZone ?? false
    const showBasePrice = calculateShowBasePrice(baseLocalPrice, isOutside)
    const viaticosAmount = input.viaticos?.amount || 0

    // ──────────────────────────────────────────────────────────────────────────
    // RAMA 1: Auto-Landing (≤ 100 personas y sin extras de producción)
    // ──────────────────────────────────────────────────────────────────────────
    if (isAutoQuote) {
      const result = await db.$transaction(async (tx) => {
        return await createUnifiedQuote(tx, {
          clientName: input.nombre.trim(),
          clientPhone: input.telefono.trim(),
          clientCity: input.municipio.trim(),
          customName: `${input.tipoEvento} - ${input.nombre.trim()}`,
          ceremonyType: input.tipoEvento,
          eventDate: input.fecha,
          startTime: input.horaInicio,
          endTime: input.horaFin,
          guestCount: aforo,
          status: "pendiente",
          venueName: input.lugarEvento?.trim() || `${input.municipio.trim()}, ${input.estado.trim()}`,
          venueAddress: input.lugarEvento?.trim() || `${input.municipio.trim()}, ${input.estado.trim()}`,
          venueCity: input.municipio.trim(),
          venueState: input.estado.trim(),
          mapsLink: input.mapsLink?.trim() || null,
          packageId: "61a5477c-de10-4788-a8bd-1dfa8b57d256", // Essential
          packageName: input.paquete ? `Show Vendetta - ${input.paquete}` : "Show Vendetta Versátil (2 Horas)",
          basePrice: showBasePrice,
          viaticosAmount: viaticosAmount,
          depositAmount: Math.round((showBasePrice + viaticosAmount) * 0.5),
          paymentMethod: "transferencia",
          adminNote: `Cotización web automática para ${aforo} invitados (Show estándar).`,
          musicianNotes: `Cotización web para ${aforo} invitados en ${input.municipio}, ${input.estado}. Horario: ${input.horaInicio} a ${input.horaFin}.${input.notas?.trim() ? ` Notas: ${input.notas.trim()}` : ""}`
        })
      })

      const proposalFullUrl = `https://vendetta.mx/propuesta/${result.shortId}`

      // 1. WhatsApp automático al CLIENTE con el resumen y enlace a su propuesta
      try {
        const clientMsg = buildClientWhatsAppMessage({
          nombre: input.nombre,
          tipoEvento: input.tipoEvento,
          fecha: input.fecha,
          horaInicio: input.horaInicio,
          horaFin: input.horaFin,
          invitados: aforo,
          municipio: input.municipio,
          estado: input.estado,
          lugarEvento: input.lugarEvento,
          mapsLink: input.mapsLink,
          viaticosAmount: viaticosAmount,
          produccionAdicional: input.produccionAdicional,
          paquete: input.paquete || "Show Vendetta Versátil (2 Horas)",
          proposalUrl: proposalFullUrl,
          notas: input.notas
        })
        await sendWhatsApp(input.telefono.trim(), clientMsg, `Confirmación Cliente - ${input.nombre.trim()}`).catch(
          (err) => console.warn("Aviso WhatsApp cliente (auto-quote) no enviado:", err)
        )
      } catch (clientWaErr) {
        console.warn("Error al enviar WhatsApp a cliente (auto-quote):", clientWaErr)
      }

      // 2. WhatsApp automático al ADMINISTRADOR
      try {
        const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
        const adminPhone =
          config?.adminWhatsapp ||
          process.env.ADMIN_WHATSAPP_NUMBER ||
          process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
          "5217222880045"

        const avisoAdmin = 
`⚡ *NUEVA COTIZACIÓN WEB (PROPUESTA AUTOMÁTICA)*
Se generó una propuesta interactiva para un cliente:

• *Cliente:* ${input.nombre.trim()}
• *Teléfono:* ${input.telefono.trim()}
${input.paquete ? `• *Paquete:* ${input.paquete}\n` : ""}• *Evento:* ${input.tipoEvento}
• *Fecha:* ${input.fecha}
• *Horario:* ${input.horaInicio} a ${input.horaFin}
• *Invitados:* ${aforo} personas
• *Ubicación:* ${input.municipio}, ${input.estado}${input.lugarEvento?.trim() ? ` (${input.lugarEvento.trim()})` : ""}
${input.mapsLink?.trim() ? `• *Maps:* ${input.mapsLink.trim()}\n` : ""}• *Viáticos:* $${viaticosAmount.toLocaleString("es-MX")} MXN
• *Propuesta en línea:* ${proposalFullUrl}

👉 *Ver en panel administrativo:*
https://vendetta.mx/admin/ventas/${result.bookingId}`

        await sendWhatsApp(adminPhone, avisoAdmin, `Aviso Admin - AutoCotización ${input.nombre.trim()}`).catch(
          (err) => console.warn("Aviso WhatsApp admin no enviado:", err)
        )
      } catch (adminWaErr) {
        console.warn("Error al enviar alerta a WhatsApp admin:", adminWaErr)
      }

      return {
        success: true,
        mode: "auto_quote",
        shortId: result.shortId,
        bookingId: result.bookingId,
        proposalUrl: `/propuesta/${result.shortId}`
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // RAMA 2: Requiere Revisión por Administrador (>100 o con extras solicitados)
    // ──────────────────────────────────────────────────────────────────────────
    const extrasDetalle = input.produccionAdicional.join(", ")

    // 1. Guardar primero el lead como ContactInquiry
    const pkgLabel = input.paquete ? `Paquete: ${input.paquete}` : "Producción especial"
    const inquiry = await db.contactInquiry.create({
      data: {
        name: input.nombre.trim(),
        phone: input.telefono.trim(),
        email: `cliente_${input.telefono.replace(/\D/g, "") || Date.now()}@cotizacion.vendetta.mx`,
        requestedDate: new Date(`${input.fecha}T12:00:00`),
        eventType: `${input.tipoEvento} (${pkgLabel})`,
        message: `${input.paquete ? `[${input.paquete}] ` : ""}Horario: ${input.horaInicio} a ${input.horaFin} | Invitados: ${aforo} | Ubicación: ${input.municipio}, ${input.estado}${input.lugarEvento?.trim() ? ` (${input.lugarEvento.trim()})` : ""}${input.mapsLink?.trim() ? ` | Maps: ${input.mapsLink.trim()}` : ""} | Extras solicitados: ${extrasDetalle || "Aforo > 100"} | Viáticos: $${viaticosAmount} MXN${input.notas?.trim() ? ` | Notas: ${input.notas.trim()}` : ""}`,
        status: "new"
      }
    })

    // 2. Crear la cotización en BookingRequest etiquetada como POR REVISAR
    const adminNoteText = `⚠️ POR REVISAR POR ADMINISTRADOR: ${input.paquete ? `[Paquete ${input.paquete}] ` : ""}El cliente solicitó producción técnica adicional (${extrasDetalle || "Aforo > 100"}). Aforo: ${aforo} invitados.`

    const result = await db.$transaction(async (tx) => {
      return await createUnifiedQuote(tx, {
        originInquiryId: inquiry.id,
        clientName: input.nombre.trim(),
        clientPhone: input.telefono.trim(),
        clientCity: input.municipio.trim(),
        customName: `${input.tipoEvento} - ${input.nombre.trim()} (${input.paquete || "Requiere Producción"})`,
        ceremonyType: input.tipoEvento,
        eventDate: input.fecha,
        startTime: input.horaInicio,
        endTime: input.horaFin,
        guestCount: aforo,
        status: "pendiente",
        venueName: input.lugarEvento?.trim() || `${input.municipio.trim()}, ${input.estado.trim()}`,
        venueAddress: input.lugarEvento?.trim() || `${input.municipio.trim()}, ${input.estado.trim()}`,
        venueCity: input.municipio.trim(),
        venueState: input.estado.trim(),
        mapsLink: input.mapsLink?.trim() || null,
        packageName: input.paquete ? `Show Vendetta - ${input.paquete} (Por revisar)` : "Show Vendetta con Producción Especial (Por revisar)",
        basePrice: showBasePrice,
        viaticosAmount: viaticosAmount,
        depositAmount: 0,
        paymentMethod: "transferencia",
        adminNote: adminNoteText,
        musicianNotes: `Solicitud con producción especial${input.paquete ? ` (${input.paquete})` : ""}: ${extrasDetalle || "Aforo > 100"}.${input.notas?.trim() ? ` Notas: ${input.notas.trim()}` : ""}`
      })
    })

    // 3. Marcar flags de equipo de producción en el BookingRequest
    await db.bookingRequest.update({
      where: { id: result.bookingId },
      data: {
        hasPantalla: input.produccionAdicional.includes("Pantalla LED"),
        hasTemplete: input.produccionAdicional.includes("Templete / Escenario"),
        hasPista: input.produccionAdicional.includes("Pista iluminada"),
        hasRobot: input.produccionAdicional.includes("Iluminación adicional"),
        adminNote: adminNoteText
      }
    })

    // 4. Enviar notificación automática por WhatsApp al CLIENTE
    try {
      const clientMsg = buildClientWhatsAppMessage({
        nombre: input.nombre,
        tipoEvento: input.tipoEvento,
        fecha: input.fecha,
        horaInicio: input.horaInicio,
        horaFin: input.horaFin,
        invitados: aforo,
        municipio: input.municipio,
        estado: input.estado,
        lugarEvento: input.lugarEvento,
        mapsLink: input.mapsLink,
        viaticosAmount: viaticosAmount,
        produccionAdicional: input.produccionAdicional,
        paquete: input.paquete,
        notas: input.notas
      })
      await sendWhatsApp(input.telefono.trim(), clientMsg, `Confirmación Cliente - ${input.nombre.trim()}`).catch(
        (err) => console.warn("Aviso WhatsApp cliente (revisión) no enviado:", err)
      )
    } catch (clientWaErr) {
      console.warn("Error al enviar WhatsApp a cliente (revisión):", clientWaErr)
    }

    // 5. Enviar notificación automática por WhatsApp al administrador
    try {
      const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
      const adminPhone =
        config?.adminWhatsapp ||
        process.env.ADMIN_WHATSAPP_NUMBER ||
        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
        "5217222880045"

      const avisoAdmin = 
`⚠️ *ALERTA: NUEVA COTIZACIÓN POR REVISAR*
Se registró una solicitud con requerimientos especiales de producción:

• *Cliente:* ${input.nombre.trim()}
• *Teléfono:* ${input.telefono.trim()}
${input.paquete ? `• *Paquete:* ${input.paquete}\n` : ""}• *Evento:* ${input.tipoEvento}
• *Fecha:* ${input.fecha}
• *Horario:* ${input.horaInicio} a ${input.horaFin}
• *Invitados:* ${aforo} personas
• *Ubicación:* ${input.municipio}, ${input.estado}${input.lugarEvento?.trim() ? ` (${input.lugarEvento.trim()})` : ""}
${input.mapsLink?.trim() ? `• *Maps:* ${input.mapsLink.trim()}\n` : ""}
*PRODUCCIÓN SOLICITADA:*
${input.produccionAdicional.length > 0 ? input.produccionAdicional.map((p) => `• ${p}`).join("\n") : "• Aforo mayor a 100 invitados"}
• *Viáticos calculados:* $${viaticosAmount.toLocaleString("es-MX")} MXN

👉 *Revisar y definir cotización en el sistema:*
https://vendetta.mx/admin/ventas/${result.bookingId}`

      await sendWhatsApp(adminPhone, avisoAdmin, "Aviso Admin - Cotización por revisar").catch((err) =>
        console.warn("Aviso WhatsApp admin no enviado:", err)
      )
    } catch (waErr) {
      console.warn("Error al enviar alerta a WhatsApp admin:", waErr)
    }

    return {
      success: true,
      mode: "needs_review",
      bookingId: result.bookingId,
      inquiryId: inquiry.id,
      shortId: result.shortId
    }
  } catch (err: unknown) {
    console.error("Error en submitPublicQuoteAction:", err)
    const message = err instanceof Error ? err.message : "Error al procesar la cotización"
    return {
      success: false,
      mode: "needs_review",
      error: message
    }
  }
}
