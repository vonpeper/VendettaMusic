"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAdminMsg as requireAdmin } from "@/lib/auth-guards"

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

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: {
        googleClientId: clientId,
        googleClientSecret: clientSecret,
        googleCalendarId: calendarId,
      },
      create: {
        id: "vendetta_config",
        googleClientId: clientId,
        googleClientSecret: clientSecret,
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

    await db.globalConfig.upsert({
      where: { id: "vendetta_config" },
      update: {
        zona2Rate,
        zona3Rate,
        zona2Cities,
        zona3Cities,
      },
      create: {
        id: "vendetta_config",
        zona2Rate,
        zona3Rate,
        zona2Cities,
        zona3Cities,
      }
    })

    revalidatePath("/admin/configuracion")
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

    const msgExpiringActive = formData.get("msgExpiringActive") === "on"
    const msgReminderActive = formData.get("msgReminderActive") === "on"
    const msgThanksActive = formData.get("msgThanksActive") === "on"
    const autoFollowUpEnabled = formData.get("autoFollowUpEnabled") === "on"
    const autoThanksEnabled = formData.get("autoThanksEnabled") === "on"

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

    const url = `${baseUrl}/instance/connectionState/${config.evolutionInstance || "vendetta_admin"}`
    
    console.log(`📡 [TEST] Conectando a: ${url}`)
    
    const resp = await fetch(url, {
      method: "GET",
      headers: { "apikey": config.evolutionApiKey },
      // Timeout corto para no colgar el servidor
      signal: AbortSignal.timeout(5000)
    })

    if (!resp.ok) {
      const err = await resp.text()
      return { success: false, message: `Error de API (${resp.status}): ${err.substring(0, 50)}` }
    }

    const data = await resp.json()
    const state = data.instance?.state || "unknown"

    return { 
      success: true, 
      message: `Conexión exitosa. Estado: ${state}`,
      state 
    }
  } catch (error: any) {
    console.error("❌ Error en testEvolutionConnectionAction:", error)
    return { success: false, message: `Error de red/servidor: ${error.message}` }
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
