import { db } from "../src/lib/db"
import { syncEventToGoogleCalendar } from "../src/lib/google-calendar"

async function main() {
  console.log("🔄 Iniciando sincronización de todos los eventos agendados...")
  const events = await db.event.findMany({
    where: {
      status: {
        in: ["agendado", "confirmed", "completado"]
      }
    }
  })

  console.log(`📅 Encontrados ${events.length} eventos confirmados. Sincronizando...`)

  for (const event of events) {
    try {
      console.log(`⏳ Sincronizando evento: ${event.id} - Fecha: ${event.date.toISOString().split('T')[0]}`)
      await syncEventToGoogleCalendar(event.id)
      console.log(`✅ Sincronizado: ${event.id}`)
    } catch (err) {
      console.error(`❌ Error sincronizando evento ${event.id}:`, err)
    }
  }

  console.log("🏁 Sincronización completa.")
}

main().catch(console.error).finally(() => db.$disconnect())
