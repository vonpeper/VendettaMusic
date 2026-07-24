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

    const results: Record<string, any> = {
      evolutionUrl: baseUrl,
      evolutionInstance: config.evolutionInstance,
      hasApiKey: !!config.evolutionApiKey,
      fetchInstances: null,
      connectInstance: null,
      createInstance: null
    }

    const apiKey = config.evolutionApiKey || ""

    // 1. Test fetchInstances
    try {
      const fetchUrl = `${baseUrl}/instance/fetchInstances`
      const resp = await fetch(fetchUrl, {
        method: "GET",
        headers: { apikey: apiKey }
      })
      const text = await resp.text()
      results.fetchInstances = {
        status: resp.status,
        body: text.substring(0, 1000)
      }
    } catch (e: any) {
      results.fetchInstances = { error: e.message }
    }

    // 2. Test connect
    try {
      const connectUrl = `${baseUrl}/instance/connect/${config.evolutionInstance || 'vendetta'}`
      const resp = await fetch(connectUrl, {
        method: "GET",
        headers: { apikey: apiKey }
      })
      const text = await resp.text()
      results.connectInstance = {
        status: resp.status,
        body: text.substring(0, 1000)
      }
    } catch (e: any) {
      results.connectInstance = { error: e.message }
    }

    return NextResponse.json(results)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
