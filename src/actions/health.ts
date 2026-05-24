"use server"

import { db } from "@/lib/db"

export async function checkEvolutionHealth() {
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    const baseUrl = config?.evolutionUrl || process.env.EVOLUTION_BASE_URL || ""
    const apiKey = config?.evolutionApiKey || process.env.EVOLUTION_API_KEY
    const instanceName = config?.evolutionInstance || "vendetta_admin"

    if (!baseUrl || !apiKey) {
      return { status: "offline", reason: "API URL or Key missing" }
    }

    const cleanBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`
    
    const res = await fetch(`${cleanBaseUrl.replace(/\/$/, "")}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: { "apikey": apiKey },
      // Don't hang forever
      signal: AbortSignal.timeout(5000)
    })

    if (!res.ok) {
      return { status: "error", reason: `HTTP ${res.status}` }
    }

    const data = await res.json()
    // Evolution API returns state inside instance
    const state = data?.instance?.state || data?.state
    
    if (state === "open") {
      return { status: "online", state }
    } else {
      return { status: "disconnected", state: state || "unknown" }
    }
  } catch (error: any) {
    return { status: "offline", reason: error.message }
  }
}
