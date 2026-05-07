/**
 * Utilidades de gestión de músicos para eventos.
 */

const STAFF_INSTRUMENTS = ["Ingeniero de Audio", "Técnico", "Staff", "Proveedor"]

/**
 * Asigna automáticamente todos los músicos titulares activos al evento indicado.
 * Se considera "titular" cualquier músico activo que NO sea Ingeniero, Técnico, Staff o Proveedor.
 * Usa upsert para ser idempotente (seguro llamar múltiples veces).
 */
export async function assignDefaultMusicians(eventId: string, db: any): Promise<void> {
  try {
    const titulares = await db.musicianProfile.findMany({
      where: {
        status: "active",
        NOT: {
          instrument: { in: STAFF_INSTRUMENTS }
        }
      },
      select: { id: true, instrument: true }
    })

    if (titulares.length === 0) {
      console.warn(`⚠️ assignDefaultMusicians: No se encontraron músicos titulares activos.`)
      return
    }

    for (const m of titulares) {
      await db.eventMusician.upsert({
        where: { id: `${eventId}-${m.id}` },
        create: {
          id: `${eventId}-${m.id}`,
          eventId,
          musicianId: m.id,
          status: "pending"
        },
        update: {} // Si ya existe, no cambiar nada
      })
    }

    console.log(`✅ assignDefaultMusicians: ${titulares.length} titulares asignados al evento ${eventId}`)
  } catch (error: any) {
    console.error(`❌ assignDefaultMusicians error:`, error?.message)
  }
}
