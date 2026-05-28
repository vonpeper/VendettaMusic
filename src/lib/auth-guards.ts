import { NextResponse } from "next/server"
import { auth } from "./auth"

export const ADMIN_ROLES = new Set(["ADMIN", "AGENTE"])

export async function isAdminOrAgent(): Promise<boolean> {
  const session = await auth()
  return !!session?.user && ADMIN_ROLES.has(session.user.role as string)
}

// Guard para route handlers: devuelve una Response 401 si no autorizado, o null.
export async function requireAdminApi(): Promise<NextResponse | null> {
  if (await isAdminOrAgent()) return null
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// Guard para server actions que reportan el error en `message`.
export async function requireAdminMsg() {
  if (await isAdminOrAgent()) return null
  return { success: false as const, message: "No autorizado" }
}

// Guard para server actions que reportan el error en `error`.
export async function requireAdminErr() {
  if (await isAdminOrAgent()) return null
  return { success: false as const, error: "No autorizado" }
}
