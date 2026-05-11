import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const config = await db.globalConfig.findUnique({
      where: { id: "vendetta_config" }
    })
    
    return NextResponse.json({
      exists: !!config,
      hasSignature: !!config?.adminSignature,
      signatureLength: config?.adminSignature?.length || 0,
      signaturePrefix: config?.adminSignature?.slice(0, 50) || "none",
      updatedAt: config?.updatedAt
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
