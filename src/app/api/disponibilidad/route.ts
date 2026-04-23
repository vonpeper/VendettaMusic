import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date")
  const startTime = req.nextUrl.searchParams.get("startTime") // HH:MM
  const endTime = req.nextUrl.searchParams.get("endTime") // HH:MM
  
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 })

  // Normalizar fecha para evitar problemas de zona horaria (CDMX UTC-6)
  // Al usar split y crear con unidades locales, nos aseguramos que 2024-05-10 siempre sea ese día.
  const [y, m, d] = date.split('-').map(Number)
  const dayStart = new Date(y, m - 1, d, 0, 0, 0)
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999)

  console.log(`[Disponibilidad] Checking ${date} -> Range: ${dayStart.toISOString()} - ${dayEnd.toISOString()}`)

  const [events, bookings] = await Promise.all([
    db.event.findMany({
      where: {
        date: { gte: dayStart, lt: dayEnd },
        status: { in: ["agendado", "completado"] }
      },
      select: { id: true, startTime: true, performanceEnd: true, status: true, customName: true }
    }),
    db.bookingRequest.findMany({
      where: {
        requestedDate: { gte: dayStart, lt: dayEnd },
        status: { in: ["pendiente", "agendado"] }
      },
      select: { id: true, startTime: true, endTime: true, status: true, clientName: true }
    })
  ])

  // Lógica de Conflicto Logístico (1.5h gap = 90 mins)
  const GAP_MINUTES = 90
  let logisticalConflict = false

  const allExistingSlots = [
    ...events.map(e => ({ start: e.startTime || "00:00", end: e.performanceEnd || e.startTime || "00:00", type: "event", status: e.status })),
    ...bookings.map(b => ({ start: b.startTime || "00:00", end: b.endTime || b.startTime || "00:00", type: "booking", status: b.status }))
  ]

  // Si el cliente ya eligió horario, validamos contra lo existente
  if (startTime && endTime) {
    const requestedStart = timeToMinutes(startTime)
    const requestedEnd = timeToMinutes(endTime)

    for (const slot of allExistingSlots) {
      const slotStart = timeToMinutes(slot.start)
      const slotEnd = timeToMinutes(slot.end)

      // Verificar solapamiento directo
      if (requestedStart < slotEnd && requestedEnd > slotStart) {
        logisticalConflict = true
        break
      }

      // Verificar Gap de 1.5h
      const gapToBefore = requestedStart - slotEnd
      const gapToAfter = slotStart - requestedEnd

      // Si el evento está antes, el gap debe ser >= 90
      // Nota: Si el gap es negativo, significa que se solapan (ya cubierto arriba)
      if (gapToBefore >= 0 && gapToBefore < GAP_MINUTES) {
        logisticalConflict = true
        break
      }
      // Si el evento está después, el gap debe ser >= 90
      if (gapToAfter >= 0 && gapToAfter < GAP_MINUTES) {
        logisticalConflict = true
        break
      }
    }
  }

  const isConfirmed  = events.some(e => e.status === "agendado") ||
                       bookings.some(b => b.status === "agendado")
  const hasPending   = bookings.some(b => b.status === "pendiente")

  return NextResponse.json({
    available:    !isConfirmed && !logisticalConflict,
    isPending:    hasPending && !isConfirmed,
    logisticalConflict,
    slots: allExistingSlots
  })
}

function timeToMinutes(time: string): number {
  if (!time) return 0
  const parts = time.split(":")
  if (parts.length < 2) return 0
  const h = Number(parts[0])
  const m = Number(parts[1])
  
  // Manejo básico de horario nocturno (ej. 01:00 es después de 23:00)
  let total = h * 60 + m
  if (h < 6) total += 24 * 60 // Asumimos que shows de madrugada son del final del día
  return total
}
