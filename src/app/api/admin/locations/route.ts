import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

const ADMIN_ROLES = new Set(["ADMIN", "AGENTE"])

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || !ADMIN_ROLES.has(session.user.role as string)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  return null
}

const DEBUG_FILE = path.join(process.cwd(), "debug_crash.log")

function logError(context: string, error: any) {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] ERROR in ${context}:\n${error instanceof Error ? error.stack : String(error)}\n\n`
  try {
    fs.appendFileSync(DEBUG_FILE, message)
  } catch (e) {
    console.error("Failed to write to debug log:", e)
  }
}

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const locations = await db.$queryRawUnsafe(`SELECT * FROM Location WHERE active = 1 ORDER BY name ASC`)

    return new Response(JSON.stringify(Array.isArray(locations) ? locations : []), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    })
  } catch (error) {
    logError("GET /api/admin/locations (RAW SQL)", error)
    return new Response(JSON.stringify({ 
      error: "Error crítico en base de datos (SQL Fallback)",
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const data = await req.json()
    
    // Using Raw SQL for creation to avoid Prisma client validation
    await db.$executeRawUnsafe(
      `INSERT INTO Location (id, name, address, mapsLink, phone, city, state, active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      data.name,
      data.address,
      data.mapsLink || null,
      data.phone || null,
      data.city || null,
      data.state || "México",
      1 // active = true
    )

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    logError("POST /api/admin/locations (RAW SQL)", error)
    return new Response(JSON.stringify({ 
      error: "No se pudo crear el lugar (SQL Fallback)",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const data = await req.json()
    const { id, name, address, mapsLink, phone, city, state } = data

    await db.$executeRawUnsafe(
      `UPDATE Location SET name = ?, address = ?, mapsLink = ?, phone = ?, city = ?, state = ? WHERE id = ?`,
      name, address, mapsLink || null, phone || null, city || null, state || "México", id
    )

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    logError("PUT /api/admin/locations (RAW SQL)", error)
    return new Response(JSON.stringify({ 
      error: "No se pudo actualizar el lugar (SQL Fallback)",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return new Response(JSON.stringify({ error: "ID requerido" }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    await db.$executeRawUnsafe(`UPDATE Location SET active = 0 WHERE id = ?`, id)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    logError("DELETE /api/admin/locations (RAW SQL)", error)
    return new Response(JSON.stringify({ 
      error: "No se pudo eliminar el lugar (SQL Fallback)",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}


