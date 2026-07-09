"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAdminMsg as requireAdmin } from "@/lib/auth-guards"
import { clearViaticosCache } from "@/lib/viaticos/googleMaps"

export async function saveBankConfigAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null)
    if (!formData) return { success: false, message: "Error: No se recibieron datos" }
    const bankName        = (formData.get("bankName") as string)        || ""
    const bankAccount     = (formData.get("bankAccount") as string)     || ""
    const bankClabe       = (formData.get("bankClabe") as string)       || ""
    const bankBeneficiary = (formData.get("bankBeneficiary") as string) || ""
    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: { bankName, bankAccount, bankClabe, bankBeneficiary },
      create: { id: "vendetta_config", bankName, bankAccount, bankClabe, bankBeneficiary },
    })
    revalidatePath("/admin/configuracion")
    revalidatePath("/admin/notificaciones")
    return { success: true, message: "Datos bancarios guardados" }
  } catch (error: any) {
    console.error("Error saving bank config:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

export async function saveEvolutionWebhookSecretAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null)
    if (!formData) return { success: false, message: "Error: No se recibieron datos" }
    const incoming = (formData.get("evolutionWebhookSecret") as string) || ""
    if (incoming === "********") {
      return { success: true, message: "Webhook secret sin cambios" }
    }
    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: { evolutionWebhookSecret: incoming || null },
      create: { id: "vendetta_config", evolutionWebhookSecret: incoming || null },
    })
    revalidatePath("/admin/configuracion")
    return { success: true, message: "Webhook secret guardado" }
  } catch (error: any) {
    console.error("Error saving evolution webhook secret:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

export async function saveGoogleCredentialsAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null);
    if (!formData) return { success: false, message: "Error: No se recibieron datos" };

    const clientId = formData.get("clientId") as string
    const clientSecret = formData.get("clientSecret") as string
    const calendarId = formData.get("calendarId") as string

    const existing = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    let finalClientSecret = clientSecret?.trim() || ""
    if (finalClientSecret === "********") {
      finalClientSecret = existing?.googleClientSecret || ""
    }

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: {
        googleClientId: clientId,
        googleClientSecret: finalClientSecret,
        googleCalendarId: calendarId,
      },
      create: {
        id: "vendetta_config",
        googleClientId: clientId,
        googleClientSecret: finalClientSecret,
        googleCalendarId: calendarId,
      }
    })

    revalidatePath("/admin/configuracion")
    return { success: true, message: "Credenciales de Google guardadas" }
  } catch (error) {
    console.error("Error saving Google credentials:", error)
    return { success: false, message: "Error al guardar las credenciales" }
  }
}

export async function saveEvolutionConfigAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    // Detectar si fue llamado con (formData) o (prevState, formData)
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null);

    if (!formData) {
      return { success: false, message: "Error: No se recibieron datos del formulario" };
    }

    const url = formData.get("url") as string
    const apiKey = formData.get("apiKey") as string
    const instance = formData.get("instance") as string
    const adminWhatsapp = (formData.get("adminWhatsapp") as string || "").replace(/\D/g, "") || null
    const isSandbox = formData.get("isSandbox") === "on"
    const logInboundActive = formData.get("logInboundActive") === "on"

    const existing = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })

    // Si el valor llega vacío, lo guardamos como null o vacío
    // Si llega con asteriscos, mantenemos el valor anterior
    let finalApiKey = apiKey?.trim() || ""
    if (finalApiKey === "********") {
      finalApiKey = existing?.evolutionApiKey || ""
    }

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: {
        evolutionUrl: url,
        evolutionApiKey: finalApiKey,
        evolutionInstance: instance,
        adminWhatsapp,
        isSandbox,
        logInboundActive,
      },
      create: {
        id: "vendetta_config",
        evolutionUrl: url,
        evolutionApiKey: finalApiKey,
        evolutionInstance: instance,
        adminWhatsapp,
        isSandbox,
        logInboundActive,
      }
    })

    revalidatePath("/admin/configuracion")
    return { success: true, message: "Configuración de Evolution API guardada" }
  } catch (error: any) {
    console.error("Error saving Evolution config:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

export async function saveViaticosConfigAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null);
    if (!formData) return { success: false, message: "Error: No se recibieron datos" };

    const zona2Rate = parseFloat(formData.get("zona2Rate") as string) || 1500
    const zona3Rate = parseFloat(formData.get("zona3Rate") as string) || 3000
    const zona2Cities = (formData.get("zona2Cities") as string || "").trim()
    const zona3Cities = (formData.get("zona3Cities") as string || "").trim()
    const radiusInput = formData.get("viaticosLocalRadius") as string
    const parsedRadius = radiusInput ? parseFloat(radiusInput) : 50.0
    const viaticosLocalRadius = isNaN(parsedRadius) ? 50.0 : parsedRadius

    const vehicleCountInput = formData.get("viaticosVehicleCount") as string
    const parsedVehicleCount = vehicleCountInput ? parseInt(vehicleCountInput, 10) : 2
    const viaticosVehicleCount = isNaN(parsedVehicleCount) ? 2 : parsedVehicleCount

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: {
        zona2Rate,
        zona3Rate,
        zona2Cities,
        zona3Cities,
        viaticosLocalRadius,
        viaticosVehicleCount,
      },
      create: {
        id: "vendetta_config",
        zona2Rate,
        zona3Rate,
        zona2Cities,
        zona3Cities,
        viaticosLocalRadius,
        viaticosVehicleCount,
      }
    })

    revalidatePath("/admin/configuracion")
    try {
      clearViaticosCache()
    } catch (e) {
      console.error("Error clearing viaticos cache:", e)
    }
    return { success: true, message: "Tarifas y zonas de viáticos actualizadas" }
  } catch (error) {
    console.error("Error saving viaticos config:", error)
    return { success: false, message: "Error al guardar la configuración de viáticos" }
  }
}

export async function saveSocialConfigAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null);
    if (!formData) return { success: false, message: "Error: No se recibieron datos" };

    const facebookUrl = formData.get("facebookUrl") as string
    const instagramUrl = formData.get("instagramUrl") as string
    const tiktokUrl = formData.get("tiktokUrl") as string
    const whatsappUrl = formData.get("whatsappUrl") as string

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: {
        facebookUrl,
        instagramUrl,
        tiktokUrl,
        whatsappUrl,
      },
      create: {
        id: "vendetta_config",
        facebookUrl,
        instagramUrl,
        tiktokUrl,
        whatsappUrl,
      }
    })

    revalidatePath("/admin/configuracion")
    revalidatePath("/") // To update the public footer
    return { success: true, message: "Redes sociales guardadas exitosamente" }
  } catch (error) {
    console.error("Error saving social config:", error)
    return { success: false, message: "Error al guardar las redes sociales" }
  }
}

export async function saveMessageTemplatesAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null);
    if (!formData) return { success: false, message: "Error: No se recibieron datos" };

    const msgTemplateGig = formData.get("msgTemplateGig") as string
    const msgTemplateQuote = formData.get("msgTemplateQuote") as string
    const msgTemplateEventClose = formData.get("msgTemplateEventClose") as string
    const msgTemplateBarClose = formData.get("msgTemplateBarClose") as string
    const msgTemplateFollowUp = formData.get("msgTemplateFollowUp") as string
    const msgTemplateExpiring = formData.get("msgTemplateExpiring") as string
    const msgTemplateReminder = formData.get("msgTemplateReminder") as string
    const msgTemplateThanks = formData.get("msgTemplateThanks") as string

    const msgTemplateTodayReminder = formData.get("msgTemplateTodayReminder") as string

    const msgExpiringActive = formData.get("msgExpiringActive") === "on"
    const msgReminderActive = formData.get("msgReminderActive") === "on"
    const msgThanksActive = formData.get("msgThanksActive") === "on"
    const autoFollowUpEnabled = formData.get("autoFollowUpEnabled") === "on"
    const autoThanksEnabled = formData.get("autoThanksEnabled") === "on"
    const msgTodayReminderActive = formData.get("msgTodayReminderActive") === "on"

    console.log("💾 Guardando plantillas...", {
      msgExpiringActive,
      msgReminderActive,
      msgThanksActive,
      autoFollowUpEnabled,
      autoThanksEnabled
    })

    const result = await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: {
        msgTemplateGig,
        msgTemplateQuote,
        msgTemplateEventClose,
        msgTemplateBarClose,
        msgTemplateFollowUp,
        msgTemplateExpiring,
        msgExpiringActive,
        msgTemplateReminder,
        msgReminderActive,
        msgTemplateThanks,
        msgThanksActive,
        autoFollowUpEnabled,
        autoThanksEnabled,
        msgTemplateTodayReminder,
        msgTodayReminderActive,
      },
      create: {
        id: "vendetta_config",
        msgTemplateGig,
        msgTemplateQuote,
        msgTemplateEventClose,
        msgTemplateBarClose,
        msgTemplateFollowUp,
        msgTemplateExpiring,
        msgExpiringActive,
        msgTemplateReminder,
        msgReminderActive,
        msgTemplateThanks,
        msgThanksActive,
        autoFollowUpEnabled,
        autoThanksEnabled,
        msgTemplateTodayReminder,
        msgTodayReminderActive,
      }
    })

    console.log("✅ Plantillas guardadas con éxito:", result.id)
    revalidatePath("/admin/notificaciones")
    revalidatePath("/admin/configuracion")
    return { success: true, message: "Plantillas actualizadas correctamente" }
  } catch (error: any) {
    console.error("❌ Error en saveMessageTemplatesAction:", error)
    return { success: false, message: `Error al guardar: ${error.message || "Error desconocido"}` }
  }
}

export async function updateSandboxModeAction(isActive: boolean) {
  const u = await requireAdmin(); 
  if (u) {
    console.warn("⚠️ Intento no autorizado de cambiar modo Sandbox")
    return u
  }

  try {
    console.log(`🧪 [CONFIG] Cambiando modo Sandbox a: ${isActive}`)
    
    // Bypass total: SQL directo para evitar validación de Prisma Client stale
    const val = isActive ? 1 : 0
    await db.$executeRaw`UPDATE GlobalConfig SET isSandbox = ${val} WHERE id = 'vendetta_config'`;

    revalidatePath("/admin/configuracion")
    return { 
      success: true, 
      message: isActive ? "Modo Sandbox Activado 🧪" : "Modo Sandbox Desactivado 🚀" 
    }
  } catch (error: any) {
    console.error("❌ ERROR actualizando modo Sandbox:", error)
    return { success: false, message: `Error de base de datos: ${error.message || 'Desconocido'}` }
  }
}

export async function updateLogInboundActiveAction(isActive: boolean) {
  const u = await requireAdmin(); 
  if (u) return u

  try {
    const val = isActive ? 1 : 0
    await db.$executeRaw`UPDATE GlobalConfig SET logInboundActive = ${val} WHERE id = 'vendetta_config'`;

    revalidatePath("/admin/configuracion")
    return { 
      success: true, 
      message: isActive ? "Registro de mensajes activado ✅" : "Registro de mensajes desactivado 🛑" 
    }
  } catch (error: any) {
    console.error("❌ ERROR actualizando logInboundActive:", error)
    return { success: false, message: `Error de base de datos: ${error.message || 'Desconocido'}` }
  }
}

export async function testEvolutionConnectionAction() {
  const u = await requireAdmin(); if (u) return u
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    if (!config?.evolutionUrl || !config?.evolutionApiKey) {
      return { success: false, message: "API no configurada en la base de datos" }
    }

    let baseUrl = config.evolutionUrl
    if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`
    baseUrl = baseUrl.replace(/\/$/, "")

    const instanceName = config.evolutionInstance || "vendetta_admin"
    const url = `${baseUrl}/instance/fetchInstances`
    
    console.log(`📡 [TEST] Listando instancias en: ${url} para buscar '${instanceName}'`)
    
    const resp = await fetch(url, {
      method: "GET",
      headers: { "apikey": config.evolutionApiKey },
      signal: AbortSignal.timeout(5000)
    })

    if (!resp.ok) {
      const err = await resp.text()
      return { success: false, message: `Error de API (${resp.status}): ${err.substring(0, 50)}` }
    }

    const instances = await resp.json()
    if (!Array.isArray(instances)) {
      return { success: false, message: "La respuesta de la API no es un arreglo válido" }
    }

    const targetInstance = instances.find((inst: any) => inst.name === instanceName)
    if (!targetInstance) {
      return { success: false, message: `Instancia '${instanceName}' no encontrada en la API`, state: "close" }
    }

    const connectionStatus = targetInstance.connectionStatus || targetInstance.state || "close"
    const hasDisconnectionError = !!targetInstance.disconnectionReasonCode

    if (hasDisconnectionError || connectionStatus !== "open") {
      const reason = targetInstance.disconnectionReasonCode 
        ? `Código de desconexión ${targetInstance.disconnectionReasonCode} (${targetInstance.disconnectionReasonCode === 401 ? "Dispositivo Removido / Conflicto" : "Cerrado"})`
        : "Sesión cerrada"
      return {
        success: false,
        message: `Instancia desvinculada: ${reason}. Por favor abre el Evolution Manager y vuelve a escanear el QR.`,
        state: "close"
      }
    }

    return { 
      success: true, 
      message: `Conexión exitosa. WhatsApp conectado y en línea.`,
      state: "open"
    }
  } catch (error: any) {
    console.error("❌ Error en testEvolutionConnectionAction:", error)
    return { success: false, message: `Error de red/servidor: ${error.message}` }
  }
}

export async function getEvolutionQrCodeAction() {
  const u = await requireAdmin(); if (u) return u
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    if (!config?.evolutionUrl || !config?.evolutionApiKey) {
      return { success: false, message: "API no configurada en la base de datos" }
    }

    let baseUrl = config.evolutionUrl
    if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`
    baseUrl = baseUrl.replace(/\/$/, "")

    const instanceName = config.evolutionInstance || "vendetta_admin"
    const instanceToken = "5320D339-59B7-4D57-A4CF-8E2AE8B4AF0E"
    const webhookSecret = config.evolutionWebhookSecret || "7wLNzmaKAxz5drNNx2coEmgFn4C3jbLbDenALrBv"

    console.log(`📡 [RESET] Forzando eliminación de la instancia stuck: ${instanceName}`)
    
    // 1. Eliminamos la instancia vieja
    try {
      const deleteUrl = `${baseUrl}/instance/delete/${instanceName}`
      await fetch(deleteUrl, {
        method: "DELETE",
        headers: { "apikey": config.evolutionApiKey },
        signal: AbortSignal.timeout(5000)
      })
      console.log(`📡 [RESET] Instancia eliminada. Esperando 1s...`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (e) {
      console.log("Error o instancia no existía al intentar borrarla")
    }

    // 2. Creamos la instancia nuevamente
    const createUrl = `${baseUrl}/instance/create`
    console.log(`📡 [RESET] Recreando instancia: ${createUrl}`)
    const createResp = await fetch(createUrl, {
      method: "POST",
      headers: { 
        "apikey": config.evolutionApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        instanceName,
        token: instanceToken,
        qrcode: true
      }),
      signal: AbortSignal.timeout(10000)
    })

    if (!createResp.ok) {
      const err = await createResp.text()
      return { success: false, message: `Error al crear instancia (${createResp.status}): ${err.substring(0, 50)}` }
    }

    const createData = await createResp.json()

    // 3. Configuramos los Webhooks en la nueva instancia
    try {
      const webhookUrl = `${baseUrl}/webhook/set/${instanceName}`
      console.log(`📡 [RESET] Configurando Webhook: ${webhookUrl}`)
      await fetch(webhookUrl, {
        method: "POST",
        headers: { 
          "apikey": config.evolutionApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: "https://vendetta.mx/api/webhooks/evolution",
            webhookByEvents: false,
            events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE", "CONNECTION_UPDATE"],
            headers: {
              apikey: webhookSecret
            }
          }
        }),
        signal: AbortSignal.timeout(5000)
      })
    } catch (e: any) {
      console.error("Error al re-configurar el webhook:", e.message)
    }

    // 4. Devolvemos el código QR obtenido en la creación
    const qrCode = createData.qrcode?.base64 || createData.code?.base64 || createData.base64

    if (qrCode) {
      return { success: true, qr: qrCode }
    } else {
      // Intento alternativo por si no venía en la creación
      console.log("QR no disponible en creación, intentando connect...")
      const connectUrl = `${baseUrl}/instance/connect/${instanceName}`
      const connectResp = await fetch(connectUrl, {
        method: "GET",
        headers: { "apikey": config.evolutionApiKey },
        signal: AbortSignal.timeout(8000)
      })
      if (connectResp.ok) {
        const connectData = await connectResp.json()
        const qr = connectData.base64 || connectData.code?.base64 || connectData.qrcode?.base64
        if (qr) return { success: true, qr }
      }
      return { success: false, message: "La API creó la instancia pero no retornó una imagen QR base64" }
    }
  } catch (error: any) {
    console.error("❌ Error en getEvolutionQrCodeAction:", error)
    return { success: false, message: `Error de red: ${error.message}` }
  }
}

export async function saveOGConfigAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null)
    if (!formData) return { success: false, message: "Error: No se recibieron datos" }

    const ogTitle = formData.get("ogTitle") as string
    const ogDescription = formData.get("ogDescription") as string
    const ogImage = formData.get("ogImage") as string

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: { ogTitle, ogDescription, ogImage },
      create: { id: "vendetta_config", ogTitle, ogDescription, ogImage },
    })

    revalidatePath("/admin/configuracion")
    revalidatePath("/")
    return { success: true, message: "Configuración OpenGraph guardada" }
  } catch (error: any) {
    console.error("Error saving OG config:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

export async function saveContractConfigAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null)
    if (!formData) return { success: false, message: "Error: No se recibieron datos" }

    const contractLegalText = formData.get("contractLegalText") as string
    const contractBarLegalText = formData.get("contractBarLegalText") as string

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: { contractLegalText, contractBarLegalText },
      create: { id: "vendetta_config", contractLegalText, contractBarLegalText },
    })

    revalidatePath("/admin/configuracion")
    return { success: true, message: "Texto legal del contrato guardado" }
  } catch (error: any) {
    console.error("Error saving contract config:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

export async function savePaymentConfigAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null)
    if (!formData) return { success: false, message: "Error: No se recibieron datos" }

    const payMercadoPagoActive = formData.get("payMercadoPagoActive") === "on"
    const payTransferenciaActive = formData.get("payTransferenciaActive") === "on"
    const payPersonalActive = formData.get("payPersonalActive") === "on"
    const payStripeActive = formData.get("payStripeActive") === "on"

    const stripePublicKey = (formData.get("stripePublicKey") as string) || null
    const stripeSecretKey = (formData.get("stripeSecretKey") as string) || null
    const stripeWebhookSecret = (formData.get("stripeWebhookSecret") as string) || null
    const mercadoPagoAccessToken = (formData.get("mercadoPagoAccessToken") as string) || null
    const mercadoPagoPublicKey = (formData.get("mercadoPagoPublicKey") as string) || null

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: {
        payMercadoPagoActive,
        payTransferenciaActive,
        payPersonalActive,
        payStripeActive,
        stripePublicKey,
        stripeSecretKey,
        stripeWebhookSecret,
        mercadoPagoAccessToken,
        mercadoPagoPublicKey,
      },
      create: {
        id: "vendetta_config",
        payMercadoPagoActive,
        payTransferenciaActive,
        payPersonalActive,
        payStripeActive,
        stripePublicKey,
        stripeSecretKey,
        stripeWebhookSecret,
        mercadoPagoAccessToken,
        mercadoPagoPublicKey,
      },
    })

    revalidatePath("/admin/configuracion")
    return { success: true, message: "Configuración de pagos guardada" }
  } catch (error: any) {
    console.error("Error saving payment config:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

export async function syncAllEventsAction() {
  const u = await requireAdmin(); if (u) return u
  try {
    const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
    const events = await db.event.findMany({
      where: {
        status: {
          in: ["agendado", "confirmed", "completado"]
        }
      }
    })

    let successCount = 0
    let failCount = 0

    for (const event of events) {
      try {
        await syncEventToGoogleCalendar(event.id)
        successCount++
      } catch (err) {
        console.error(`Error syncing event ${event.id}:`, err)
        failCount++
      }
    }

    return { 
      success: true, 
      message: `Sincronización masiva completada: ${successCount} eventos sincronizados con éxito, ${failCount} fallidos.` 
    }
  } catch (error: any) {
    console.error("Error in syncAllEventsAction:", error)
    return { success: false, message: `Error al sincronizar: ${error.message || "Desconocido"}` }
  }
}

export async function saveGoogleMapsApiKeyAction(arg1: any, arg2?: any) {
  const u = await requireAdmin(); if (u) return u
  try {
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null)
    if (!formData) return { success: false, message: "Error: No se recibieron datos" }

    const googleMapsApiKey = formData.get("googleMapsApiKey") as string

    const existing = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    let finalKey = googleMapsApiKey?.trim() || ""
    if (finalKey === "********") {
      finalKey = existing?.googleMapsApiKey || ""
    }

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: {
        googleMapsApiKey: finalKey || null,
      },
      create: {
        id: "vendetta_config",
        googleMapsApiKey: finalKey || null,
      }
    })

    revalidatePath("/admin/configuracion")
    return { success: true, message: "API Key de Google Maps guardada correctamente" }
  } catch (error: any) {
    console.error("Error saving Google Maps API Key:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}


