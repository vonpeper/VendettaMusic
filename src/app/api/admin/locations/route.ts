import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi as requireAdmin } from "@/lib/auth-guards"
import { z } from "zod"

export const dynamic = "force-dynamic"

const locationCreateSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  address: z.string().optional().default("No especificada"),
  mapsLink: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().default("México"),
})

const locationUpdateSchema = locationCreateSchema.extend({
  id: z.string().min(1, "El ID es obligatorio"),
})

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const locations = await db.location.findMany({
      where: { active: true },
      orderBy: { name: "asc" }
    })

    return NextResponse.json(locations)
  } catch (error: any) {
    console.error("GET /api/admin/locations error:", error?.message || error)
    return NextResponse.json({ error: "Error al consultar ubicaciones" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const rawData = await req.json()
    const validated = locationCreateSchema.parse(rawData)

    const newLoc = await db.location.create({
      data: {
        name: validated.name.trim(),
        address: validated.address.trim(),
        mapsLink: validated.mapsLink?.trim() || null,
        phone: validated.phone?.trim() || null,
        city: validated.city?.trim() || null,
        state: validated.state?.trim() || "México",
        active: true
      }
    })

    return NextResponse.json({ success: true, location: newLoc })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.flatten() }, { status: 400 })
    }
    console.error("POST /api/admin/locations error:", error?.message || error)
    return NextResponse.json({ error: "Error al crear ubicación" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const rawData = await req.json()
    const validated = locationUpdateSchema.parse(rawData)

    const updated = await db.location.update({
      where: { id: validated.id },
      data: {
        name: validated.name.trim(),
        address: validated.address.trim(),
        mapsLink: validated.mapsLink?.trim() || null,
        phone: validated.phone?.trim() || null,
        city: validated.city?.trim() || null,
        state: validated.state?.trim() || "México"
      }
    })

    return NextResponse.json({ success: true, location: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.flatten() }, { status: 400 })
    }
    console.error("PUT /api/admin/locations error:", error?.message || error)
    return NextResponse.json({ error: "Error al actualizar ubicación" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    await db.location.update({
      where: { id },
      data: { active: false }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("DELETE /api/admin/locations error:", error?.message || error)
    return NextResponse.json({ error: "Error al desactivar ubicación" }, { status: 500 })
  }
}
