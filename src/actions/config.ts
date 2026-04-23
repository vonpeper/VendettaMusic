"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function saveTwilioConfigAction(_prev: any, formData: FormData) {
  try {
    const sid = formData.get("sid") as string
    const token = formData.get("token") as string
    const fromNumber = formData.get("fromNumber") as string

    await db.globalConfig.upsert({
      where: { id: "singleton" },
      update: {
        twilioSid: sid,
        twilioToken: token,
        twilioNumber: fromNumber,
      },
      create: {
        id: "singleton",
        twilioSid: sid,
        twilioToken: token,
        twilioNumber: fromNumber,
      }
    })

    revalidatePath("/admin/configuracion")
    return { success: true, message: "Configuración de Twilio guardada" }
  } catch (error) {
    console.error("Error saving Twilio config:", error)
    return { success: false, message: "Error al guardar la configuración" }
  }
}

export async function saveGoogleCredentialsAction(_prev: any, formData: FormData) {
  try {
    const clientId = formData.get("clientId") as string
    const clientSecret = formData.get("clientSecret") as string
    const calendarId = formData.get("calendarId") as string

    await db.globalConfig.upsert({
      where: { id: "singleton" },
      update: {
        googleClientId: clientId,
        googleClientSecret: clientSecret,
        googleCalendarId: calendarId,
      },
      create: {
        id: "singleton",
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
  try {
    // Detectar si fue llamado con (formData) o (prevState, formData)
    const formData = arg1 instanceof FormData ? arg1 : (arg2 instanceof FormData ? arg2 : null);

    if (!formData) {
      return { success: false, message: "Error: No se recibieron datos del formulario" };
    }

    const url = formData.get("url") as string
    const apiKey = formData.get("apiKey") as string
    const instance = formData.get("instance") as string

    const existing = await db.globalConfig.findUnique({ where: { id: "singleton" } })
    
    // Si el valor llega vacío, lo guardamos como null o vacío
    // Si llega con asteriscos, mantenemos el valor anterior
    let finalApiKey = apiKey?.trim() || ""
    if (finalApiKey === "********") {
      finalApiKey = existing?.evolutionApiKey || ""
    }

    await db.globalConfig.upsert({
      where: { id: "singleton" },
      update: {
        evolutionUrl: url,
        evolutionApiKey: finalApiKey,
        evolutionInstance: instance,
      },
      create: {
        id: "singleton",
        evolutionUrl: url,
        evolutionApiKey: finalApiKey,
        evolutionInstance: instance,
      }
    })

    revalidatePath("/admin/configuracion")
    return { success: true, message: "Configuración de Evolution API guardada" }
  } catch (error: any) {
    console.error("Error saving Evolution config:", error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

