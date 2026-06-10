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

    // 2. Columnas de GlobalConfig
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
  } catch (err) {
    console.error("❌ [Self-Healing] Error auto-applying missing schema columns:", err)
  }
}

// Fire and forget: self-heal database columns in background
ensureSchemaUpToDate(db).catch(e => console.error("Error running ensureSchemaUpToDate:", e))
