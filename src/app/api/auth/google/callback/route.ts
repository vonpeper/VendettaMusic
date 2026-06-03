import { db } from "@/lib/db"
import { exchangeCodeForTokens } from "@/lib/google-calendar"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const error = req.nextUrl.searchParams.get("error")

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "vendetta.mx"
  const protocol = req.headers.get("x-forwarded-proto") || "https"
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`

  if (error) {
    console.error("Google OAuth error:", error)
    return NextResponse.redirect(`${baseUrl}/admin/configuracion?tab=integraciones&error=Google auth cancelled: ${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/admin/configuracion?tab=integraciones&error=No authorization code returned`)
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/google/callback`
    await exchangeCodeForTokens(code, redirectUri)

    return NextResponse.redirect(`${baseUrl}/admin/configuracion?tab=integraciones&success=Google Calendar vinculado con éxito`)
  } catch (err: any) {
    console.error("Error exchanging code for tokens:", err)
    return NextResponse.redirect(`${baseUrl}/admin/configuracion?tab=integraciones&error=${encodeURIComponent(err.message || "Error al vincular con Google")}`)
  }
}
