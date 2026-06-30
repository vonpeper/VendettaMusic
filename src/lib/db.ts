import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

function resolveDbUrl(): string {
  const env = process.env.DATABASE_URL?.trim()
  if (env) {
    if (env.startsWith("file:") || env.startsWith("libsql:") || env.startsWith("http")) {
      return env
    }
    return `file:${env}`
  }
  return "file:./prisma/dev.db"
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// In Prisma 7, PrismaLibSql is a factory that can be passed as the adapter
const adapter = new PrismaLibSql({ 
  url: resolveDbUrl() 
})

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    // @ts-ignore - Prisma 7 adapter factory
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

// Self-healing: Ensure missing SQLite schema columns are added dynamically at runtime
async function ensureSchemaUpToDate(prisma: PrismaClient) {
  try {
    // 1. Columnas de BookingRequest
    const bookingColumns = await prisma.$queryRaw<any[]>`PRAGMA table_info(BookingRequest)`
    const bookingColNames = bookingColumns.map(c => c.name.toLowerCase())

    if (!bookingColNames.includes("distancekm")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN distanceKm REAL`)
      console.log("🤖 [Self-Healing] Added column distanceKm to BookingRequest")
    }
    if (!bookingColNames.includes("durationsec")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN durationSec INTEGER`)
      console.log("🤖 [Self-Healing] Added column durationSec to BookingRequest")
    }
    if (!bookingColNames.includes("tollcost")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN tollCost REAL`)
      console.log("🤖 [Self-Healing] Added column tollCost to BookingRequest")
    }
    if (!bookingColNames.includes("fuelcost")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN fuelCost REAL`)
      console.log("🤖 [Self-Healing] Added column fuelCost to BookingRequest")
    }
    if (!bookingColNames.includes("requiresmanualquote")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN requiresManualQuote BOOLEAN DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column requiresManualQuote to BookingRequest")
    }
    if (!bookingColNames.includes("bandhours")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN bandHours INTEGER DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column bandHours to BookingRequest")
    }
    if (!bookingColNames.includes("djhours")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN djHours INTEGER DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column djHours to BookingRequest")
    }
    if (!bookingColNames.includes("isdjwithtvs")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN isDjWithTvs BOOLEAN DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column isDjWithTvs to BookingRequest")
    }
    if (!bookingColNames.includes("hastemplete")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN hasTemplete BOOLEAN DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column hasTemplete to BookingRequest")
    }
    if (!bookingColNames.includes("haspista")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN hasPista BOOLEAN DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column hasPista to BookingRequest")
    }
    if (!bookingColNames.includes("hasrobot")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN hasRobot BOOLEAN DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column hasRobot to BookingRequest")
    }
    if (!bookingColNames.includes("discountamount")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN discountAmount REAL DEFAULT 0.0`)
      console.log("🤖 [Self-Healing] Added column discountAmount to BookingRequest")
    }
    if (!bookingColNames.includes("originalprice")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN originalPrice REAL DEFAULT 0.0`)
      console.log("🤖 [Self-Healing] Added column originalPrice to BookingRequest")
    }
    if (!bookingColNames.includes("invoice")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN invoice BOOLEAN DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column invoice to BookingRequest")
    }
    if (!bookingColNames.includes("customname")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN customName TEXT`)
      console.log("🤖 [Self-Healing] Added column customName to BookingRequest")
    }
    if (!bookingColNames.includes("ceremonytype")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN ceremonyType TEXT`)
      console.log("🤖 [Self-Healing] Added column ceremonyType to BookingRequest")
    }
    if (!bookingColNames.includes("arrivaltime")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN arrivalTime TEXT`)
      console.log("🤖 [Self-Healing] Added column arrivalTime to BookingRequest")
    }
    if (!bookingColNames.includes("setuptime")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN setupTime TEXT`)
      console.log("🤖 [Self-Healing] Added column setupTime to BookingRequest")
    }
    if (!bookingColNames.includes("dresscode")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN dressCode TEXT`)
      console.log("🤖 [Self-Healing] Added column dressCode to BookingRequest")
    }
    if (!bookingColNames.includes("musiciannotes")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN musicianNotes TEXT`)
      console.log("🤖 [Self-Healing] Added column musicianNotes to BookingRequest")
    }

    // 2. Columnas de Event
    const eventColumns = await prisma.$queryRaw<any[]>`PRAGMA table_info(Event)`
    const eventColNames = eventColumns.map(c => c.name.toLowerCase())

    if (!eventColNames.includes("bitacora")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Event ADD COLUMN bitacora TEXT`)
      console.log("🤖 [Self-Healing] Added column bitacora to Event")
    }
    if (!eventColNames.includes("audioengineer")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Event ADD COLUMN audioEngineer TEXT`)
      console.log("🤖 [Self-Healing] Added column audioEngineer to Event")
    }
    if (!eventColNames.includes("customname")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Event ADD COLUMN customName TEXT`)
      console.log("🤖 [Self-Healing] Added column customName to Event")
    }
    if (!eventColNames.includes("mapslink")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Event ADD COLUMN mapsLink TEXT`)
      console.log("🤖 [Self-Healing] Added column mapsLink to Event")
    }
    if (!eventColNames.includes("venuetype")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Event ADD COLUMN venueType TEXT`)
      console.log("🤖 [Self-Healing] Added column venueType to Event")
    }
    if (!eventColNames.includes("ispublic")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Event ADD COLUMN isPublic BOOLEAN DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column isPublic to Event")
    }
    if (!eventColNames.includes("clientprovidesaudio")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Event ADD COLUMN clientProvidesAudio BOOLEAN DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column clientProvidesAudio to Event")
    }
    if (!eventColNames.includes("source")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE Event ADD COLUMN source TEXT DEFAULT 'manual'`)
      console.log("🤖 [Self-Healing] Added column source to Event")
    }

    // 3. Columnas de GlobalConfig
    const configColumns = await prisma.$queryRaw<any[]>`PRAGMA table_info(GlobalConfig)`
    const configColNames = configColumns.map(c => c.name.toLowerCase())

    if (!configColNames.includes("googlemapsapikey")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE GlobalConfig ADD COLUMN googleMapsApiKey TEXT`)
      console.log("🤖 [Self-Healing] Added column googleMapsApiKey to GlobalConfig")
    }
    if (!configColNames.includes("viaticoslocalradius")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE GlobalConfig ADD COLUMN viaticosLocalRadius REAL DEFAULT 50.0`)
      console.log("🤖 [Self-Healing] Added column viaticosLocalRadius to GlobalConfig")
    }
    if (!configColNames.includes("viaticosvehiclecount")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE GlobalConfig ADD COLUMN viaticosVehicleCount INTEGER DEFAULT 2`)
      console.log("🤖 [Self-Healing] Added column viaticosVehicleCount to GlobalConfig")
    }
    if (!configColNames.includes("msgtodayreminderactive")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE GlobalConfig ADD COLUMN msgTodayReminderActive BOOLEAN DEFAULT 1`)
      console.log("🤖 [Self-Healing] Added column msgTodayReminderActive to GlobalConfig")
    }
    if (!configColNames.includes("msgtemplatetodayreminder")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE GlobalConfig ADD COLUMN msgTemplateTodayReminder TEXT`)
      console.log("🤖 [Self-Healing] Added column msgTemplateTodayReminder to GlobalConfig")
    }

    // 4. Renombrar marcadores de posición de ubicaciones históricos (ej. "Essential") a "Show - [Nombre]" para ocultarlos del catálogo
    await prisma.$executeRawUnsafe(`
      UPDATE Location 
      SET name = 'Show - ' || name 
      WHERE (
        lower(name) = 'essential' OR 
        lower(name) = 'festival premium' OR 
        lower(name) = 'experience' OR 
        lower(name) = 'premium' OR 
        lower(name) = 'show' OR 
        lower(name) = 'sin nombre' OR 
        lower(name) = 'por definir' OR 
        lower(name) = 'no especificada' OR 
        lower(name) = 'no especificado'
      ) AND name NOT LIKE 'Show - %'
    `).catch(err => console.error("🤖 [Self-Healing] Error renaming location placeholders:", err))
  } catch (err) {
    console.error("❌ [Self-Healing] Error auto-applying missing schema columns:", err)
  }
}

// Fire and forget: self-heal database columns in background (evitar en fase de build)
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-export"
if (!isBuildPhase) {
  ensureSchemaUpToDate(db).catch(e => console.error("Error running ensureSchemaUpToDate:", e))
}
