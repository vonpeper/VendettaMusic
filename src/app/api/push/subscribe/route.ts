import { NextRequest, NextResponse } from "next/server"
import { saveWebPushSubscription, sendWebPush } from "@/lib/webpush"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    const userAgent = req.headers.get("user-agent") || undefined
    const res = await saveWebPushSubscription(subscription, userAgent)

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 500 })
    }

    // Send immediate confirmation push notification
    await sendWebPush(subscription, {
      title: "⚡ VENDETTA MUSIC",
      body: "🔔 ¡Recordatorios activados! Te avisaremos el día de cada show con tus horarios y locación.",
      url: "/agenda",
      data: { type: "welcome" }
    })

    return NextResponse.json({ success: true, message: "Notificaciones activadas exitosamente" })
  } catch (err: any) {
    console.error("Error in /api/push/subscribe:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
