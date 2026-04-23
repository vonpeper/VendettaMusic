import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const publicRoutes = ["/", "/nosotros", "/servicios", "/paquetes", "/repertorio", "/contacto"]
const authRoutes = ["/auth/login", "/auth/registro"]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role as string | undefined

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
  const isAuthRoute = authRoutes.includes(nextUrl.pathname)

  if (isApiAuthRoute) return NextResponse.next()

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", nextUrl))
      if (role === "CLIENT") return NextResponse.redirect(new URL("/cliente", nextUrl))
      if (role === "MUSICIAN") return NextResponse.redirect(new URL("/musico", nextUrl))
      return NextResponse.redirect(new URL("/", nextUrl))
    }
    return NextResponse.next()
  }

  // Rutas protegidas Admin
  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/auth/login", nextUrl))
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/", nextUrl))
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
