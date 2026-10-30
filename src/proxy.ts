import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextRequest, NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const authRoutes = ["/auth/login", "/auth/registro"]

// Bots de buscadores y previews que NO debemos geo-bloquear
// (de lo contrario destruimos SEO y previews de WhatsApp/Twitter/Slack/etc.)
const BOT_UA_RE = /(googlebot|bingbot|duckduckbot|slurp|baiduspider|yandex|applebot|facebookexternalhit|twitterbot|linkedinbot|telegrambot|whatsapp|discordbot|slackbot|embedly|preview)/i

const authHandler = auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role as string | undefined

  const isAuthRoute = authRoutes.includes(nextUrl.pathname)

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === "ADMIN" || role === "AGENTE") return NextResponse.redirect(new URL("/admin", nextUrl))
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

  // Rutas protegidas Músico
  if (nextUrl.pathname.startsWith("/musico")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/auth/login", nextUrl))
    if (role !== "MUSICIAN" && role !== "ADMIN") return NextResponse.redirect(new URL("/", nextUrl))
  }

  return NextResponse.next()
})

export default async function proxy(req: NextRequest, ctx: any) {
  const { nextUrl, headers } = req

  // -- 🌍 GEO-BLOCKING: Solo permitir tráfico de México --
  const country = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country")
  const ua = headers.get("user-agent") || ""
  const isBot = BOT_UA_RE.test(ua)

  if (country && country !== "MX" && !isBot) {
    return new NextResponse("Access Denied: This service is only available in Mexico.", { status: 403 })
  }

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  if (isApiAuthRoute) return NextResponse.next()

  const isAuthRoute = authRoutes.includes(nextUrl.pathname)
  const isAdminRoute = nextUrl.pathname.startsWith("/admin")
  const isMusicianRoute = nextUrl.pathname.startsWith("/musico")

  // Solo ejecutar NextAuth en rutas que requieran sesión activa o login/registro.
  // Las rutas públicas (/, /cotizar, /status/*, etc.) pasan limpias, sin generar
  // cookies __Host-authjs.csrf-token ni forzar cache-control: no-store.
  if (isAdminRoute || isMusicianRoute || isAuthRoute) {
    return (authHandler as any)(req, ctx)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|assets|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
}
