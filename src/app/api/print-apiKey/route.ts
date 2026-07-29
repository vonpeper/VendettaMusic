import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    if (!config) {
      return NextResponse.json({ error: "No config found" })
    }
    return NextResponse.json({
      evolutionUrl: config.evolutionUrl,
      evolutionInstance: config.evolutionInstance,
      evolutionApiKey: config.evolutionApiKey,
      webhookSecret: config.evolutionWebhookSecret
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
