import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"
import { signJWT } from "@/lib/jwt"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son obligatorios." },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { musicianProfile: true }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      )
    }

    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      )
    }

    // Allow USER, ADMIN, or AGENTE roles to access the mobile app
    if (user.role !== "USER" && user.role !== "ADMIN" && user.role !== "AGENTE") {
      return NextResponse.json(
        { error: "Acceso no autorizado para este rol." },
        { status: 403 }
      )
    }

    const token = await signJWT({
      userId: user.id,
      email: user.email || "",
      name: user.name || "",
      role: user.role,
      musicianProfileId: user.musicianProfile?.id || undefined
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        musicianProfileId: user.musicianProfile?.id || null
      }
    })
  } catch (error: any) {
    console.error("Login mobile error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
