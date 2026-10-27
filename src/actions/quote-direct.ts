"use server"

import { db } from "@/lib/db"
import { createUnifiedQuote } from "@/lib/quote-service"
import { calculateShowBasePrice, calculateEventHours, calculateShowPackageBasePrice, getShowPackageHourlyRate } from "@/lib/pricing"
import { sendWhatsApp } from "@/lib/notifications/whatsapp"

export interface SubmitPublicQuoteInput {
  nombre: string
  telefono: string
  tipoEvento: string
  fecha: string // YYYY-MM-DD
  horaInicio: string
  horaFin: string
  horasShow?: number
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
  inquiryId?: string
}

export interface SaveQuoteDraftInput {
  nombre: string
  telefono: string
  fecha?: string
  municipio?: string
  estado?: string
  invitados?: number
  tipoEvento?: string
  inquiryId?: string
}

export type SaveQuoteDraftResult = {
  success: boolean
  inquiryId?: string
  error?: string
}

export async function saveQuoteDraftAction(
  input: SaveQuoteDraftInput
): Promise<SaveQuoteDraftResult> {
  try {
    const nombre = (input.nombre || "").trim()
    const telefono = (input.telefono || "").trim()
    const cleanPhone = telefono.replace(/\D/g, "")

    if (!nombre) {
      return { success: false, error: "El nombre completo es obligatorio." }
    }
    if (cleanPhone.length < 10) {
      return { success: false, error: "El número de WhatsApp debe contener al menos 10 dígitos." }
    }

    let parsedDate: Date | null = null
    if (input.fecha) {
      const d = new Date(`${input.fecha}T12:00:00`)
      if (!isNaN(d.getTime())) {
        parsedDate = d
      }
    }

    const aforo = Number(input.invitados) || 100
    const municipio = (input.municipio || "").trim()
    const estado = (input.estado || "Estado de México").trim()
    const tipoEvento = input.tipoEvento || "Evento Privado"
    const message = `[Borrador Cotizador] Aforo: ${aforo} pax | Ubicación: ${municipio || "Pendiente"}, ${estado}`

    if (input.inquiryId) {
      const existing = await db.contactInquiry.findUnique({ where: { id: input.inquiryId } })
      if (existing) {
        const updated = await db.contactInquiry.update({
          where: { id: input.inquiryId },
          data: {
            name: nombre,
            phone: telefono,
            requestedDate: parsedDate ?? existing.requestedDate,
            eventType: `${tipoEvento} (Borrador)`,
            message: message,
            status: existing.status === "converted" ? "converted" : "prospecto_cotizando"
          }
        })
        return { success: true, inquiryId: updated.id }
      }
    }

    const fallbackEmail = `cliente_${cleanPhone.slice(-10)}@prospectos.vendetta.mx`
    const inquiry = await db.contactInquiry.create({
      data: {
        name: nombre,
        phone: telefono,
        email: fallbackEmail,
        requestedDate: parsedDate,
        eventType: `${tipoEvento} (Borrador)`,
        message: message,
        status: "prospecto_cotizando"
      }
    })

    return { success: true, inquiryId: inquiry.id }
  } catch (err: any) {
    console.error("Error al registrar borrador de prospecto:", err)
    return { success: false, error: "Error interno al registrar borrador." }
  }
}

export type SubmitPublicQuoteResult = {
  success: boolean
  mode: "auto_quote" | "needs_review" | "lead_captured"
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

function buildClientLargeAudienceMessage(params: {
  nombre: string
  tipoEvento: string
  fecha: string
  horaInicio: string
  horaFin: string
  horasShow?: number
  invitados: number
  municipio: string
  estado: string
  lugarEvento?: string
  mapsLink?: string
  produccionAdicional: string[]
  paquete?: string
  notas?: string
}): string {
  const fechaFormateada = formatFechaEspanol(params.fecha) || params.fecha
  const horario = `${params.horaInicio} a ${params.horaFin}`
  const duracionText = params.horasShow ? ` (${params.horasShow} Horas de Música en Vivo)` : ""
  const ubicacion = `${params.municipio}, ${params.estado}${params.lugarEvento?.trim() ? ` (${params.lugarEvento.trim()})` : ""}`

  const lines = [
    `¡Hola ${params.nombre.trim()}! 👋🎸`,
    "Recibimos con éxito tu solicitud para tu evento con Vendetta Live Music:",
    "",
    "📋 *DETALLES DEL EVENTO*",
    `• *Tipo de Evento:* ${params.tipoEvento}`,
    `• *Fecha:* ${fechaFormateada}`,
    `• *Horario:* ${horario}${duracionText}`,
    `• *Aforo estimado:* ${params.invitados} personas`,
    `• *Ubicación:* ${ubicacion}`,
    ...(params.mapsLink?.trim() ? [`• *Google Maps:* ${params.mapsLink.trim()}`] : []),
    ...(params.produccionAdicional.length > 0 ? [
      "",
      "• *Requerimientos de producción:*",
      ...params.produccionAdicional.map((p) => `  - ${p}`)
    ] : []),
    ...(params.notas?.trim() ? [`\n📝 *Notas adicionales:* ${params.notas.trim()}`] : []),
    "",
    "📌 *PRODUCCIÓN TÉCNICA PERSONALIZADA*",
    "Tu evento supera los 100 invitados y requiere diseño técnico y de producción personalizado (templete, pantalla LED, iluminación y cobertura de audio según el recinto).",
    "",
    "📞 *PRÓXIMO PASO: LLAMADA TÉCNICA*",
    "En breve, un productor de Vendetta te escribirá por este chat de WhatsApp para agendar una breve llamada, validar los requerimientos del recinto y presentarte una propuesta integral a la medida.",
    "",
    "¡Muchas gracias por tu interés en Vendetta!",
    "Vendetta Live Music ⚡"
  ]

  return lines.join("\n")
}

function buildClientWhatsAppMessage(params: {
  shortId?: string
  nombre: string
  tipoEvento: string
  fecha: string
  horaInicio: string
  horaFin: string
  horasShow?: number
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
  const duracionText = params.horasShow ? ` (${params.horasShow} Horas de Música en Vivo)` : ""
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
    ...(params.shortId ? [`• *Folio de Cotización:* ${params.shortId}`] : []),
    ...(params.paquete ? [`• *Paquete:* ${params.paquete}`] : []),
    `• *Tipo de Evento:* ${params.tipoEvento}`,
    `• *Fecha:* ${fechaFormateada}`,
    `• *Horario:* ${horario}${duracionText}`,
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
    "• *Producción:* Incluye el equipamiento de audio profesional e ingeniería de sonido que Vendetta requiere para garantizar la fidelidad y calidad de ejecución en tu evento (en festivales operamos con rider técnico homologado). No incluye planta de luz. Viáticos para 2 camionetas (gasolina y casetas únicamente). No incluye alimentos.",
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

    const calculatedHours = calculateEventHours(input.horaInicio, input.horaFin)
    const horasShow = typeof input.horasShow === "number" && input.horasShow >= 2
      ? input.horasShow
      : calculatedHours

    if (horasShow < 2) {
      return {
        success: false,
        mode: "needs_review",
        error: "La duración mínima de contratación para Vendetta Live Music es de 2 horas de show."
      }
    }

    const tieneExtras = Array.isArray(input.produccionAdicional) && input.produccionAdicional.length > 0
    const aforo = Number(input.invitados) || 50

    // ──────────────────────────────────────────────────────────────────────────
    // RAMA 1: Aforo > 100 personas (Producción Especial - Sin Precios en Pantalla)
    // ──────────────────────────────────────────────────────────────────────────
    if (aforo > 100) {
      const extrasDetalle = input.produccionAdicional.join(", ")
      const reasonText = `Aforo superior a 100 invitados (${aforo} personas)${extrasDetalle ? ` | Producción: ${extrasDetalle}` : ""}`
      const pkgLabel = "Producción Especial (>100 pax)"

      // 1. Guardar o actualizar en ContactInquiry (Prospectos Web) con status "requiere_llamada"
      let inquiryId = input.inquiryId
      const inqMsg = `Aforo: ${aforo} invitados | Horario: ${input.horaInicio} a ${input.horaFin} (${horasShow} Horas) | Ubicación: ${input.municipio}, ${input.estado}${input.lugarEvento?.trim() ? ` (${input.lugarEvento.trim()})` : ""}${input.mapsLink?.trim() ? ` | Maps: ${input.mapsLink.trim()}` : ""}${input.produccionAdicional.length > 0 ? ` | Producción: ${extrasDetalle}` : ""}${input.notas?.trim() ? ` | Notas: ${input.notas.trim()}` : ""} | Motivo: Aforo > 100 pax requiere diseño técnico y de producción personalizado (templete, pantalla LED, iluminación y cobertura de audio según el recinto).`
      
      if (inquiryId) {
        try {
          const updated = await db.contactInquiry.update({
            where: { id: inquiryId },
            data: {
              name: input.nombre.trim(),
              phone: input.telefono.trim(),
              requestedDate: new Date(`${input.fecha}T12:00:00`),
              eventType: `${input.tipoEvento} (${pkgLabel})`,
              message: inqMsg,
              status: "requiere_llamada"
            }
          })
          inquiryId = updated.id
        } catch {
          const created = await db.contactInquiry.create({
            data: {
              name: input.nombre.trim(),
              phone: input.telefono.trim(),
              email: `cliente_${input.telefono.replace(/\D/g, "") || Date.now()}@prospectos.vendetta.mx`,
              requestedDate: new Date(`${input.fecha}T12:00:00`),
              eventType: `${input.tipoEvento} (${pkgLabel})`,
              message: inqMsg,
              status: "requiere_llamada"
            }
          })
          inquiryId = created.id
        }
      } else {
        const created = await db.contactInquiry.create({
          data: {
            name: input.nombre.trim(),
            phone: input.telefono.trim(),
            email: `cliente_${input.telefono.replace(/\D/g, "") || Date.now()}@prospectos.vendetta.mx`,
            requestedDate: new Date(`${input.fecha}T12:00:00`),
            eventType: `${input.tipoEvento} (${pkgLabel})`,
            message: inqMsg,
            status: "requiere_llamada"
          }
        })
        inquiryId = created.id
      }

      // 1b. Crear o actualizar BookingRequest con status "requiere_llamada" para que aparezca en el Centro de Ventas
      const { generateUniqueShortId } = await import("@/lib/folios")
      let bookingRecord = await db.bookingRequest.findFirst({
        where: { sourceInquiryId: inquiryId }
      })

      const cleanDate = new Date(`${input.fecha}T12:00:00`)
      const shortId = bookingRecord?.shortId || (await generateUniqueShortId(db))

      if (bookingRecord) {
        bookingRecord = await db.bookingRequest.update({
          where: { id: bookingRecord.id },
          data: {
            clientName: input.nombre.trim(),
            clientPhone: input.telefono.trim(),
            packageName: pkgLabel,
            guestCount: aforo,
            venueType: input.tipoEvento || "salon",
            requestedDate: cleanDate,
            startTime: input.horaInicio || "21:00",
            endTime: input.horaFin || "23:00",
            bandHours: horasShow,
            city: input.municipio,
            state: input.estado || "Estado de México",
            address: input.lugarEvento?.trim() || input.municipio,
            mapsLink: input.mapsLink?.trim() || null,
            adminNote: `🚨 Requiere llamada técnica de producción (>100 pax: ${aforo} personas)${extrasDetalle ? ` | Producción: ${extrasDetalle}` : ""}${input.notas?.trim() ? ` | Notas: ${input.notas.trim()}` : ""}`,
            status: "requiere_llamada",
            source: "cotizador_web"
          }
        })
      } else {
        bookingRecord = await db.bookingRequest.create({
          data: {
            shortId,
            sourceInquiryId: inquiryId,
            clientName: input.nombre.trim(),
            clientPhone: input.telefono.trim(),
            clientEmail: `cliente_${input.telefono.replace(/\D/g, "") || Date.now()}@prospectos.vendetta.mx`,
            packageName: pkgLabel,
            guestCount: aforo,
            venueType: input.tipoEvento || "salon",
            requestedDate: cleanDate,
            startTime: input.horaInicio || "21:00",
            endTime: input.horaFin || "23:00",
            bandHours: horasShow,
            city: input.municipio,
            state: input.estado || "Estado de México",
            address: input.lugarEvento?.trim() || input.municipio,
            mapsLink: input.mapsLink?.trim() || null,
            baseAmount: 0,
            depositAmount: 0,
            paymentMethod: "transfer",
            paymentStatus: "pending",
            adminNote: `🚨 Requiere llamada técnica de producción (>100 pax: ${aforo} personas)${extrasDetalle ? ` | Producción: ${extrasDetalle}` : ""}${input.notas?.trim() ? ` | Notas: ${input.notas.trim()}` : ""}`,
            status: "requiere_llamada",
            source: "cotizador_web"
          }
        })
      }

      // 2. WhatsApp informativo de estatus al CLIENTE (sin precios ni propuesta prematura)
      try {
        const clientMsg = buildClientLargeAudienceMessage({
          nombre: input.nombre,
          tipoEvento: input.tipoEvento,
          fecha: input.fecha,
          horaInicio: input.horaInicio,
          horaFin: input.horaFin,
          horasShow: horasShow,
          invitados: aforo,
          municipio: input.municipio,
          estado: input.estado,
          lugarEvento: input.lugarEvento,
          mapsLink: input.mapsLink,
          produccionAdicional: input.produccionAdicional,
          paquete: "Producción Especial",
          notas: input.notas
        })
        await sendWhatsApp(input.telefono.trim(), clientMsg, `Lead Producción +100 pax - ${input.nombre.trim()}`).catch(
          (err) => console.warn("Aviso WhatsApp cliente (+100 pax) no enviado:", err)
        )
      } catch (clientWaErr) {
        console.warn("Error al enviar WhatsApp a cliente (+100 pax):", clientWaErr)
      }

      // 3. WhatsApp de alerta prioritaria al ADMIN
      try {
        const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
        const adminPhone =
          config?.adminWhatsapp ||
          process.env.ADMIN_WHATSAPP_NUMBER ||
          process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
          "5217222880045"

        const fechaFormateada = formatFechaEspanol(input.fecha) || input.fecha

        const avisoAdmin = 
`🚨 *NUEVO LEAD DE PRODUCCIÓN (>100 PAX)* 🚨
👤 Cliente: ${input.nombre.trim()}
📱 WhatsApp: ${input.telefono.trim()}
📅 Fecha: ${fechaFormateada}
📍 Lugar: ${input.municipio}, ${input.estado}${input.lugarEvento?.trim() ? ` (${input.lugarEvento.trim()})` : ""}
👥 Aforo: ${aforo} personas
⚠️ *Acción:* Requiere llamada técnica de producción.
👉 Ver en Ventas: https://vendetta.mx/admin/ventas/${bookingRecord.id}`

        await sendWhatsApp(adminPhone, avisoAdmin, `🚨 Lead Producción +100 pax ${input.nombre.trim()}`).catch(
          (err) => console.warn("Aviso WhatsApp admin (+100 pax) no enviado:", err)
        )
      } catch (adminWaErr) {
        console.warn("Error al enviar alerta a WhatsApp admin (+100 pax):", adminWaErr)
      }

      return {
        success: true,
        mode: "lead_captured",
        inquiryId: inquiryId,
        bookingId: bookingRecord.id,
        shortId: bookingRecord.shortId || undefined
      }
    }

    // Auto-Landing para aforo <= 100 personas (Paquete Essential - Cotización Directa)
    const isAutoQuote = aforo <= 100 && !tieneExtras && horasShow <= 5

    const packageName = "Essential"
    const baseLocalPrice = calculateShowPackageBasePrice(packageName, horasShow)
    const isOutside = input.viaticos?.isOutsideZone ?? false
    const showBasePrice = calculateShowBasePrice(baseLocalPrice, isOutside)
    const viaticosAmount = input.viaticos?.amount || 0

    const dynamicPackageName = `Show Vendetta - Paquete Essential (${horasShow} Horas)`

    // ──────────────────────────────────────────────────────────────────────────
    // RAMA 2: Auto-Landing (≤ 100 personas, Paquete Essential directo)
    // ──────────────────────────────────────────────────────────────────────────
    if (isAutoQuote) {
      const result = await db.$transaction(async (tx) => {
        return await createUnifiedQuote(tx, {
          source: "web",
          originInquiryId: input.inquiryId || null,
          clientName: input.nombre.trim(),
          clientPhone: input.telefono.trim(),
          clientCity: input.municipio.trim(),
          customName: `${input.tipoEvento} - ${input.nombre.trim()} (Essential)`,
          ceremonyType: input.tipoEvento,
          eventDate: input.fecha,
          startTime: input.horaInicio,
          endTime: input.horaFin,
          bandHours: horasShow,
          guestCount: aforo,
          status: "pendiente",
          venueName: input.lugarEvento?.trim() || `${input.municipio.trim()}, ${input.estado.trim()}`,
          venueAddress: input.lugarEvento?.trim() || `${input.municipio.trim()}, ${input.estado.trim()}`,
          venueCity: input.municipio.trim(),
          venueState: input.estado.trim(),
          mapsLink: input.mapsLink?.trim() || null,
          packageId: "61a5477c-de10-4788-a8bd-1dfa8b57d256", // Essential
          packageName: dynamicPackageName,
          basePrice: showBasePrice,
          viaticosAmount: viaticosAmount,
          depositAmount: Math.round((showBasePrice + viaticosAmount) * 0.3), // 30% anticipo
          paymentMethod: "transferencia",
          adminNote: `Cotización web automática Essential para ${aforo} invitados (Show ${horasShow} Horas).`,
          musicianNotes: `Cotización web para ${aforo} invitados en ${input.municipio}, ${input.estado}. Horario: ${input.horaInicio} a ${input.horaFin} (${horasShow} Horas de Show).${input.notas?.trim() ? ` Notas: ${input.notas.trim()}` : ""}`
        })
      })

      if (input.inquiryId) {
        await db.contactInquiry.update({
          where: { id: input.inquiryId },
          data: { status: "converted" }
        }).catch(() => {})
      }

      const proposalFullUrl = `https://vendetta.mx/propuesta/${result.shortId}`

      // 1. WhatsApp automático al CLIENTE con el resumen y enlace a su propuesta
      try {
        const clientMsg = buildClientWhatsAppMessage({
          shortId: result.shortId,
          nombre: input.nombre,
          tipoEvento: input.tipoEvento,
          fecha: input.fecha,
          horaInicio: input.horaInicio,
          horaFin: input.horaFin,
          horasShow: horasShow,
          invitados: aforo,
          municipio: input.municipio,
          estado: input.estado,
          lugarEvento: input.lugarEvento,
          mapsLink: input.mapsLink,
          viaticosAmount: viaticosAmount,
          produccionAdicional: input.produccionAdicional,
          paquete: dynamicPackageName,
          proposalUrl: proposalFullUrl,
          notas: input.notas
        })
        await sendWhatsApp(input.telefono.trim(), clientMsg, `Confirmación Cliente - ${input.nombre.trim()}`).catch(
          (err) => console.warn("Aviso WhatsApp cliente (auto-quote) no enviado:", err)
        )
      } catch (clientWaErr) {
        console.warn("Error al enviar WhatsApp a cliente (auto-quote):", clientWaErr)
      }

      // 2. WhatsApp automático al ADMINISTRADOR (Status: NUEVA_COTIZACION_ESSENTIAL)
      try {
        const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
        const adminPhone =
          config?.adminWhatsapp ||
          process.env.ADMIN_WHATSAPP_NUMBER ||
          process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
          "5217222880045"

        const fechaFormateada = formatFechaEspanol(input.fecha) || input.fecha
        const totalEstimado = showBasePrice + viaticosAmount

        const avisoAdmin = 
`⚡ *NUEVA_COTIZACION_ESSENTIAL (≤100 PAX)*
• Cliente: ${input.nombre.trim()}
• WhatsApp: ${input.telefono.trim()}
• Fecha: ${fechaFormateada}
• Horario: ${input.horaInicio} a ${input.horaFin} (${horasShow} Horas de Show)
• Aforo: ${aforo} personas
• Ubicación: ${input.municipio}, ${input.estado}${input.lugarEvento?.trim() ? ` (${input.lugarEvento.trim()})` : ""}
${input.mapsLink?.trim() ? `• Maps: ${input.mapsLink.trim()}\n` : ""}• Total Show: $${showBasePrice.toLocaleString("es-MX")} MXN
• Viáticos: $${viaticosAmount.toLocaleString("es-MX")} MXN
• Total Estimado: $${totalEstimado.toLocaleString("es-MX")} MXN
• Propuesta interactiva: ${proposalFullUrl}

👉 Ver en panel administrativo:
https://vendetta.mx/admin/ventas/${result.bookingId}`

        await sendWhatsApp(adminPhone, avisoAdmin, `Aviso Admin - NUEVA_COTIZACION_ESSENTIAL ${input.nombre.trim()}`).catch(
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
    // RAMA 3: Requiere Revisión por Administrador (≤ 120 personas con extras o >5 horas)
    // ──────────────────────────────────────────────────────────────────────────
    const extrasDetalle = input.produccionAdicional.join(", ")
    const reasonParts: string[] = []
    if (tieneExtras) reasonParts.push(`Producción: ${extrasDetalle}`)
    if (horasShow > 5) reasonParts.push(`Duración extendida: ${horasShow} Horas`)
    const reasonText = reasonParts.join(" | ") || "Revisión de producción especial"

    // 1. Guardar o actualizar el lead como ContactInquiry
    const pkgLabel = input.paquete ? `Paquete: ${input.paquete}` : "Producción especial"
    const inqReviewMsg = `${input.paquete ? `[${input.paquete}] ` : ""}Horario: ${input.horaInicio} a ${input.horaFin} (${horasShow} Horas) | Invitados: ${aforo} | Ubicación: ${input.municipio}, ${input.estado}${input.lugarEvento?.trim() ? ` (${input.lugarEvento.trim()})` : ""}${input.mapsLink?.trim() ? ` | Maps: ${input.mapsLink.trim()}` : ""} | Motivo revisión: ${reasonText} | Viáticos: $${viaticosAmount} MXN${input.notas?.trim() ? ` | Notas: ${input.notas.trim()}` : ""}`
    let finalInquiryId = input.inquiryId

    if (finalInquiryId) {
      try {
        const updated = await db.contactInquiry.update({
          where: { id: finalInquiryId },
          data: {
            name: input.nombre.trim(),
            phone: input.telefono.trim(),
            requestedDate: new Date(`${input.fecha}T12:00:00`),
            eventType: `${input.tipoEvento} (${pkgLabel})`,
            message: inqReviewMsg,
            status: "new"
          }
        })
        finalInquiryId = updated.id
      } catch {
        const inq = await db.contactInquiry.create({
          data: {
            name: input.nombre.trim(),
            phone: input.telefono.trim(),
            email: `cliente_${input.telefono.replace(/\D/g, "") || Date.now()}@cotizacion.vendetta.mx`,
            requestedDate: new Date(`${input.fecha}T12:00:00`),
            eventType: `${input.tipoEvento} (${pkgLabel})`,
            message: inqReviewMsg,
            status: "new"
          }
        })
        finalInquiryId = inq.id
      }
    } else {
      const inq = await db.contactInquiry.create({
        data: {
          name: input.nombre.trim(),
          phone: input.telefono.trim(),
          email: `cliente_${input.telefono.replace(/\D/g, "") || Date.now()}@cotizacion.vendetta.mx`,
          requestedDate: new Date(`${input.fecha}T12:00:00`),
          eventType: `${input.tipoEvento} (${pkgLabel})`,
          message: inqReviewMsg,
          status: "new"
        }
      })
      finalInquiryId = inq.id
    }

    // 2. Crear la cotización en BookingRequest etiquetada como POR REVISAR
    const adminNoteText = `⚠️ POR REVISAR POR ADMINISTRADOR: ${input.paquete ? `[Paquete ${input.paquete}] ` : ""}${reasonText}. Aforo: ${aforo} invitados.`

    const result = await db.$transaction(async (tx) => {
      return await createUnifiedQuote(tx, {
        source: "web",
        originInquiryId: finalInquiryId,
        clientName: input.nombre.trim(),
        clientPhone: input.telefono.trim(),
        clientCity: input.municipio.trim(),
        customName: `${input.tipoEvento} - ${input.nombre.trim()} (${input.paquete || "Requiere Producción"})`,
        ceremonyType: input.tipoEvento,
        eventDate: input.fecha,
        startTime: input.horaInicio,
        endTime: input.horaFin,
        bandHours: horasShow,
        guestCount: aforo,
        status: "pendiente",
        venueName: input.lugarEvento?.trim() || `${input.municipio.trim()}, ${input.estado.trim()}`,
        venueAddress: input.lugarEvento?.trim() || `${input.municipio.trim()}, ${input.estado.trim()}`,
        venueCity: input.municipio.trim(),
        venueState: input.estado.trim(),
        mapsLink: input.mapsLink?.trim() || null,
        packageName: input.paquete ? `Show Vendetta - ${input.paquete} (${horasShow} Horas - Por revisar)` : `Show Vendetta con Producción Especial (${horasShow} Horas - Por revisar)`,
        basePrice: showBasePrice,
        viaticosAmount: viaticosAmount,
        depositAmount: 0,
        paymentMethod: "transferencia",
        adminNote: adminNoteText,
        musicianNotes: `Solicitud con producción especial${input.paquete ? ` (${input.paquete})` : ""}: ${reasonText}.${input.notas?.trim() ? ` Notas: ${input.notas.trim()}` : ""}`
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
      const proposalFullUrl = `https://vendetta.mx/propuesta/${result.shortId}`
      const clientMsg = buildClientWhatsAppMessage({
        shortId: result.shortId,
        nombre: input.nombre,
        tipoEvento: input.tipoEvento,
        fecha: input.fecha,
        horaInicio: input.horaInicio,
        horaFin: input.horaFin,
        horasShow: horasShow,
        invitados: aforo,
        municipio: input.municipio,
        estado: input.estado,
        lugarEvento: input.lugarEvento,
        mapsLink: input.mapsLink,
        viaticosAmount: viaticosAmount,
        produccionAdicional: input.produccionAdicional,
        paquete: dynamicPackageName,
        proposalUrl: proposalFullUrl,
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
• *Paquete:* ${dynamicPackageName}
• *Evento:* ${input.tipoEvento}
• *Fecha:* ${input.fecha}
• *Horario:* ${input.horaInicio} a ${input.horaFin} (${horasShow} Horas de Show)
• *Invitados:* ${aforo} personas
• *Ubicación:* ${input.municipio}, ${input.estado}${input.lugarEvento?.trim() ? ` (${input.lugarEvento.trim()})` : ""}
${input.mapsLink?.trim() ? `• *Maps:* ${input.mapsLink.trim()}\n` : ""}
*MOTIVO DE REVISIÓN:*
• ${reasonText}
${input.produccionAdicional.length > 0 ? `\n*PRODUCCIÓN SOLICITADA:*\n${input.produccionAdicional.map((p) => `• ${p}`).join("\n")}` : ""}
• *Estimado Base Show:* $${showBasePrice.toLocaleString("es-MX")} MXN
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
      inquiryId: finalInquiryId,
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
