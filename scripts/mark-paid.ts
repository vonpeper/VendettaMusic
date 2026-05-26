import { db } from "../src/lib/db"
async function main() {
  const targetDate = new Date("2026-05-22T00:00:00.000Z")
  
  // Buscar todas las BookingRequests completadas antes de esa fecha
  const bookings = await db.bookingRequest.findMany({
    where: {
      status: "completado",
      requestedDate: {
        lt: targetDate
      }
    },
    include: {
      event: {
        include: {
          payments: true
        }
      }
    }
  })

  console.log(`Encontrados ${bookings.length} eventos completados antes del 22 de mayo de 2026.`)

  let updatedCount = 0

  for (const booking of bookings) {
    const total = Number(booking.baseAmount) + Number(booking.viaticosAmount || 0) - Number(booking.discountAmount || 0)
    let paid = 0
    if (booking.event && booking.event.payments) {
      paid = booking.event.payments
        .filter(p => p.status === 'completed' || p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0)
    }

    const balance = total - paid

    let needsUpdate = false

    if (booking.paymentStatus !== "paid") {
      needsUpdate = true
    }

    if (balance > 0 && booking.event) {
      needsUpdate = true
    }

    if (needsUpdate) {
      console.log(`Actualizando booking ${booking.shortId} | Total: ${total} | Pagado: ${paid} | Saldo: ${balance}`)
      
      // Actualizar booking a paid
      if (booking.paymentStatus !== "paid") {
        await db.bookingRequest.update({
          where: { id: booking.id },
          data: { paymentStatus: "paid" }
        })
      }

      // Si hay saldo pendiente y tiene evento, crear pago
      if (balance > 0 && booking.event) {
        await db.payment.create({
          data: {
            eventId: booking.eventId!,
            bookingRequestId: booking.id,
            amount: balance,
            method: "MANUAL",
            status: "completed",
            reference: "Liquidación automática (Migración de estado)"
          }
        })

        await db.event.update({
          where: { id: booking.eventId! },
          data: { balance: 0 }
        })
      }
      
      updatedCount++
    }
  }

  console.log(`Proceso terminado. Se actualizaron ${updatedCount} registros a pagado.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
