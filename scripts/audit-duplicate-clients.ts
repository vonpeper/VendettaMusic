import { db } from "../src/lib/db"

async function main() {
  console.log("=== VENDETTA MUSIC: AUDITORÍA DE CLIENTES (SOLO LECTURA) ===\n")

  const [clients, users, bookings] = await Promise.all([
    db.clientProfile.findMany({ include: { user: true } }),
    db.user.findMany({ where: { role: "CLIENT" } }),
    db.bookingRequest.findMany({ select: { id: true, clientId: true, clientName: true, clientPhone: true, clientEmail: true } })
  ])

  console.log("Total ClientProfiles: " + clients.length)
  console.log("Total Users (CLIENT): " + users.length)
  console.log("Total BookingRequests: " + bookings.length + "\n")

  const phoneGroups = new Map<string, string[]>()
  for (const c of clients) {
    if (c.whatsapp) {
      const last10 = c.whatsapp.replace(/\D/g, "").slice(-10)
      if (last10.length === 10 && last10 !== "0000000000" && last10 !== "5500000000") {
        const list = phoneGroups.get(last10) || []
        list.push(c.id)
        phoneGroups.set(last10, list)
      }
    }
  }

  const dupPhones = Array.from(phoneGroups.entries()).filter(([_, ids]) => ids.length > 1)
  console.log("Perfiles con teléfono coincidente (candidatos a unificación): " + dupPhones.length)
  dupPhones.forEach(([mask, ids], idx) => {
    console.log("  [" + (idx + 1) + "] Teléfono terminación ***" + mask.slice(-4) + " -> " + ids.length + " perfiles: " + ids.join(", "))
  })

  const emailGroups = new Map<string, string[]>()
  for (const u of users) {
    if (u.email) {
      const em = u.email.trim().toLowerCase()
      const list = emailGroups.get(em) || []
      list.push(u.id)
      emailGroups.set(em, list)
    }
  }

  const dupEmails = Array.from(emailGroups.entries()).filter(([_, ids]) => ids.length > 1)
  console.log("\nUsuarios con email coincidente: " + dupEmails.length)
  dupEmails.forEach(([_, ids], idx) => {
    console.log("  [" + (idx + 1) + "] Email duplicado -> " + ids.length + " usuarios: " + ids.join(", "))
  })

  const unlinkedBookings = bookings.filter(b => !b.clientId)
  console.log("\nBookingRequests sin ClientProfile vinculado: " + unlinkedBookings.length)
  console.log("\n=== FIN DEL REPORTE DE AUDITORÍA DE CLIENTES ===")
}

main()
  .catch((e) => {
    console.error("Error en auditoría:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
