import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    if (!config) {
      return NextResponse.json({ error: "No config found" })
    }

    let baseUrl = config.evolutionUrl || ""
    if (baseUrl && !baseUrl.startsWith("http")) {
      baseUrl = `https://${baseUrl}`
    }
    baseUrl = baseUrl.replace(/\/$/, "")

    const apiKey = config.evolutionApiKey || ""
    const instanceName = config.evolutionInstance || "vendetta"

    const results: Record<string, any> = {
      instanceName,
      deleteResponse: null,
      logoutResponse: null
    }

    // 1. Intentar logout
    try {
      const logoutUrl = `${baseUrl}/instance/logout/${instanceName}`
      const resp = await fetch(logoutUrl, {
        method: "POST",
        headers: { 
          "apikey": apiKey,
          "Content-Type": "application/json"
        }
      })
      const text = await resp.text()
      results.logoutResponse = {
        status: resp.status,
        body: text.substring(0, 1000)
      }
    } catch (e: any) {
      results.logoutResponse = { error: e.message }
    }

    // 2. Intentar delete
    try {
      const deleteUrl = `${baseUrl}/instance/delete/${instanceName}`
      const resp = await fetch(deleteUrl, {
        method: "DELETE",
        headers: { 
          "apikey": apiKey 
        }
      })
      const text = await resp.text()
      results.deleteResponse = {
        status: resp.status,
        body: text.substring(0, 1000)
      }
    } catch (e: any) {
      results.deleteResponse = { error: e.message }
    }

    return NextResponse.json(results)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
