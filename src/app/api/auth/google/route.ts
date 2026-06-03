import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
    if (!config?.googleClientId || !config?.googleClientSecret) {
      return new NextResponse("Error: Client ID o Client Secret de Google no configurado en los ajustes.", { status: 400 })
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "vendetta.mx"
    const protocol = req.headers.get("x-forwarded-proto") || "https"
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
    const redirectUri = `${baseUrl}/api/auth/google/callback`

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
      client_id: config.googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar",
      access_type: "offline",
      prompt: "consent select_account"
    }).toString()

    return NextResponse.redirect(googleAuthUrl)
  } catch (error) {
    console.error("Error redirecting to Google OAuth:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
