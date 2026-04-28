import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { id, type } = await req.json()

    if (type === "booking") {
      await db.bookingRequest.update({
        where: { id },
        data: { followUpCount: { increment: 1 } }
      })
    } else if (type === "quote") {
      await db.quote.update({
        where: { id },
        data: { followUpCount: { increment: 1 } }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Follow-up increment error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
