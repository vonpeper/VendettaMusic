import { db } from '../lib/db'

async function main() {
  console.log('Iniciando migración de Locations...')

  const bookings = await db.bookingRequest.findMany({
    where: { eventId: { not: null } }
  })

  let locationsCreated = 0
  let bookingsUpdated = 0

  for (const b of bookings) {
    let addressStr = b.address
    if (!addressStr || addressStr === "") {
        addressStr = [b.calle, b.numero, b.colonia].filter(Boolean).join(" ")
    }
    
    if (!addressStr || addressStr.trim() === "") {
      // Si no hay dirección real, no creamos ubicación
      continue;
    }

    const locationName = b.venueType || "Ubicación del evento"

    const location = await db.location.create({
      data: {
        name: locationName,
        address: addressStr || "Dirección no especificada",
        city: b.city || b.municipio || null,
        state: b.state || null,
        mapsLink: b.mapsLink || null,
      }
    })
    locationsCreated++

    // No locationId on BookingRequest, we only update Event
    bookingsUpdated++
    
    // Si tiene un evento, también le actualizamos el locationId
    if (b.eventId) {
      await db.event.update({
        where: { id: b.eventId },
        data: { locationId: location.id }
      }).catch(() => {})
    }
  }

  console.log(`✅ Se crearon ${locationsCreated} Locations basadas en BookingRequests.`)
  console.log(`✅ Se actualizaron ${bookingsUpdated} BookingRequests con locationId.`)

  console.log('🚀 Migración de Locations completada exitosamente.')
}

main().catch(console.error).finally(() => process.exit(0))
