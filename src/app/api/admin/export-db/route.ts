import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.AUTH_SECRET || "fallback_secret_vendetta_music_app_2026"
    // Generamos un token esperado de seguridad para autorizar la descarga
    const expectedToken = crypto.createHmac("sha256", secret).update("db-export-secure").digest("hex")
    const token = req.nextUrl.searchParams.get("token")
    
    if (!token || token !== expectedToken) {
      console.warn("[DB Export API] Unauthorized download attempt blocked.")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const dbPath = path.join(process.cwd(), "prisma", "prod.db")
    if (!fs.existsSync(dbPath)) {
      console.error(`[DB Export API] Database file not found at path: ${dbPath}`)
      return NextResponse.json({ error: "Database file not found" }, { status: 404 })
    }
    
    console.log("[DB Export API] Securely sending SQLite database file to client...")
    const fileBuffer = fs.readFileSync(dbPath)
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="prod.db"',
      },
    })
  } catch (error: any) {
    console.error("[DB Export API] Error exporting database:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
