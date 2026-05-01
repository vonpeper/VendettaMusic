import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const ADMIN_ROLES = new Set(["ADMIN", "AGENTE"])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.has(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
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
