import { NextRequest, NextResponse } from "next/server"
import { sendTodayShowReminderAction, testPushBroadcastAction } from "@/actions/push"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isTest = searchParams.get("test") === "true"

    if (isTest) {
      const res = await testPushBroadcastAction()
      return NextResponse.json(res)
    }

    const res = await sendTodayShowReminderAction()
    return NextResponse.json(res)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const isTest = body.test === true

    if (isTest) {
      const res = await testPushBroadcastAction()
      return NextResponse.json(res)
    }

    const res = await sendTodayShowReminderAction()
    return NextResponse.json(res)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
