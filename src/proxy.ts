import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const publicRoutes = ["/", "/nosotros", "/servicios", "/paquetes", "/repertorio", "/contacto"]
const authRoutes = ["/auth/login", "/auth/registro"]

// Bots de buscadores y previews que NO debemos geo-bloquear
// (de lo contrario destruimos SEO y previews de WhatsApp/Twitter/Slack/etc.)
const BOT_UA_RE = /(googlebot|bingbot|duckduckbot|slurp|baiduspider|yandex|applebot|facebookexternalhit|twitterbot|linkedinbot|telegrambot|whatsapp|discordbot|slackbot|embedly|preview)/i

export default auth((req) => {
  const { nextUrl, headers } = req

  // -- 🌍 GEO-BLOCKING: Solo permitir tráfico de México --
  const country = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country")
  const ua = headers.get("user-agent") || ""
  const isBot = BOT_UA_RE.test(ua)

  if (country && country !== "MX" && !isBot) {
    return new NextResponse("Access Denied: This service is only available in Mexico.", { status: 403 })
  }

  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role as string | undefined

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
  const isAuthRoute = authRoutes.includes(nextUrl.pathname)

  if (isApiAuthRoute) return NextResponse.next()

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === "ADMIN" || role === "AGENTE") return NextResponse.redirect(new URL("/admin", nextUrl))
      if (role === "CLIENT") return NextResponse.redirect(new URL("/cliente", nextUrl))
      if (role === "MUSICIAN") return NextResponse.redirect(new URL("/musico", nextUrl))
      return NextResponse.redirect(new URL("/", nextUrl))
    }
    return NextResponse.next()
  }

  // Rutas protegidas Admin (ADMIN y AGENTE)
  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/auth/login", nextUrl))
    if (role !== "ADMIN" && role !== "AGENTE") return NextResponse.redirect(new URL("/", nextUrl))
  }

  // Rutas protegidas Cliente
  if (nextUrl.pathname.startsWith("/cliente")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/auth/login", nextUrl))
    if (role !== "CLIENT" && role !== "ADMIN") return NextResponse.redirect(new URL("/", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
