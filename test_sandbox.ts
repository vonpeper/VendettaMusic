import { db } from "./src/lib/db"
import { notifyMusicians } from "./src/lib/notifications"

async function test() {
  console.log("=== INICIANDO PRUEBA SANDBOX ===")
  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } })
  console.log("Sandbox activado:", config?.isSandbox)
  console.log("Admin Whatsapp:", config?.adminWhatsapp || "No definido (usando fallback 7222417045)")

  // Create a fake event for testing
  const fakeEventId = "sandbox-test-123"
  
  // Create or update a fake event
  await db.event.upsert({
    where: { id: fakeEventId },
    create: {
      id: fakeEventId,
      date: new Date(),
      status: "agendado",
      customName: "Evento de Prueba Sandbox",
      amount: 0,
      deposit: 0,
      balance: 0,
    },
    update: {}
  })

  // Create two fake musicians for Edgar and Kevin to simulate
  const edgarId = "musician-edgar-test"
  const kevinId = "musician-kevin-test"
  
  await db.musicianProfile.upsert({
    where: { id: edgarId },
    create: { id: edgarId, whatsapp: "5551112222", instrument: "Bateria", status: "active", user: { create: { id: "user-edgar", name: "Edgar Prueba" } } },
    update: { whatsapp: "5551112222" }
  })
  
  await db.musicianProfile.upsert({
    where: { id: kevinId },
    create: { id: kevinId, whatsapp: "5553334444", instrument: "Bajo", status: "active", user: { create: { id: "user-kevin", name: "Kevin Prueba" } } },
    update: { whatsapp: "5553334444" }
  })

  await db.eventMusician.deleteMany({ where: { eventId: fakeEventId } })
  await db.eventMusician.create({ data: { id: "em-1", eventId: fakeEventId, musicianId: edgarId, status: "pending" } })
  await db.eventMusician.create({ data: { id: "em-2", eventId: fakeEventId, musicianId: kevinId, status: "pending" } })

  console.log("Musicos falsos asignados. Llamando notifyMusicians...")

  const gigDetails = {
    clientName: "Prueba Sistema",
    date: new Date(),
    ceremonyType: "show",
    locationName: "Test Venue",
    address: "Test Address",
    performanceStart: "20:00",
    performanceEnd: "22:00",
    arrivalTime: "18:00",
    setupTime: "18:30",
    dressCode: "formal",
    musicianNotes: "Prueba desde script Sandbox",
    isPublic: false,
    packageName: "Paquete Base"
  }

  const result = await notifyMusicians(fakeEventId, gigDetails, db, [edgarId, kevinId], true)
  
  console.log("Resultado notifyMusicians:", result)
  
  console.log("\nRegistros en Notification:")
  const logs = await db.notification.findMany({
    where: { eventId: fakeEventId },
    orderBy: { createdAt: "desc" },
    take: 5
  })
  
  for (const log of logs) {
    console.log(`[${log.status}] -> ${log.recipient}: ${log.message?.substring(0, 50)}...`)
  }
}

test().catch(e => console.error("Error:", e)).finally(() => process.exit(0))
