import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  
  if (token !== "vendetta_db_fix_2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const results: string[] = []
  
  try {
    console.log("⚙️ Ejecutando migración SQL raw para GlobalConfig...")

    // 1. Agregar columna msgTodayReminderActive
    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE "GlobalConfig" ADD COLUMN "msgTodayReminderActive" BOOLEAN NOT NULL DEFAULT 1`
      )
      results.push("Columna msgTodayReminderActive agregada con éxito.")
    } catch (e: any) {
      results.push(`msgTodayReminderActive: ${e.message}`)
    }
    
    // 2. Agregar columna msgTemplateTodayReminder
    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE "GlobalConfig" ADD COLUMN "msgTemplateTodayReminder" TEXT`
      )
      results.push("Columna msgTemplateTodayReminder agregada con éxito.")
    } catch (e: any) {
      results.push(`msgTemplateTodayReminder: ${e.message}`)
    }
    
    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    console.error("Error in raw SQL migration:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
