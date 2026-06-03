import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getMobileUser } from "@/lib/mobile-auth"

export async function POST(req: Request) {
  try {
    const user = await getMobileUser(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { token } = await req.json()
    if (!token || typeof token !== "string" || !token.startsWith("ExponentPushToken")) {
      return NextResponse.json({ error: "Token de notificación inválido." }, { status: 400 })
    }

    // Upsert the token to link it with the user
    await db.pushToken.upsert({
      where: { token },
      create: {
        token,
        userId: user.userId
      },
      update: {
        userId: user.userId
      }
    })

    return NextResponse.json({ success: true, message: "Token registrado con éxito." })
  } catch (error: any) {
    console.error("POST mobile push-token error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getMobileUser(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: "Token requerido." }, { status: 400 })
    }

    // Delete token
    await db.pushToken.deleteMany({
      where: {
        token,
        userId: user.userId
      }
    })

    return NextResponse.json({ success: true, message: "Token eliminado con éxito." })
  } catch (error: any) {
    console.error("DELETE mobile push-token error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
