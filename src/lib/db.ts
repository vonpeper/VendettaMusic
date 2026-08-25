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
    if (!bookingColNames.includes("haspantalla")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN hasPantalla BOOLEAN DEFAULT 0`)
      console.log("🤖 [Self-Healing] Added column hasPantalla to BookingRequest")
    }
    if (!bookingColNames.includes("quoteversion")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE BookingRequest ADD COLUMN quoteVersion INTEGER DEFAULT 1`)
      console.log("🤖 [Self-Healing] Added column quoteVersion to BookingRequest")
    }

    // 1.5 Columnas de ClientProfile
    const clientColumns = await prisma.$queryRaw<any[]>`PRAGMA table_info(ClientProfile)`
    const clientColNames = clientColumns.map(c => c.name.toLowerCase())
    if (!clientColNames.includes("fiscaladdress")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE ClientProfile ADD COLUMN fiscalAddress TEXT`)
      console.log("🤖 [Self-Healing] Added column fiscalAddress to ClientProfile")
    }
    if (!clientColNames.includes("legalrepname")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE ClientProfile ADD COLUMN legalRepName TEXT`)
      console.log("🤖 [Self-Healing] Added column legalRepName to ClientProfile")
    }
    if (!clientColNames.includes("legalreprole")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE ClientProfile ADD COLUMN legalRepRole TEXT`)
      console.log("🤖 [Self-Healing] Added column legalRepRole to ClientProfile")
    }
    if (!clientColNames.includes("legalreppower")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE ClientProfile ADD COLUMN legalRepPower TEXT`)
      console.log("🤖 [Self-Healing] Added column legalRepPower to ClientProfile")
    }
    if (!clientColNames.includes("notificationaddress")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE ClientProfile ADD COLUMN notificationAddress TEXT`)
      console.log("🤖 [Self-Healing] Added column notificationAddress to ClientProfile")
    }
    if (!clientColNames.includes("billingdata")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE ClientProfile ADD COLUMN billingData TEXT`)
      console.log("🤖 [Self-Healing] Added column billingData to ClientProfile")
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

    // 5. Crear la cotización especial para el Colegio si no existe
    try {
      const exists = await prisma.bookingRequest.findFirst({
        where: {
          OR: [
            { shortId: "VND-COLEGIO" },
            { clientName: "Colegio Mexicano de Anestesiología A.C." }
          ]
        }
      })

      if (!exists) {
        // Crear un usuario ficticio para el cliente si no existe
        let clientUser = await prisma.user.findFirst({
          where: { email: "colegio@anestesiologia.mx" }
        })

        if (!clientUser) {
          clientUser = await prisma.user.create({
            data: {
              name: "Colegio Mexicano de Anestesiología A.C.",
              email: "colegio@anestesiologia.mx",
              role: "CLIENT"
            }
          })
        }

        let clientProfile = await prisma.clientProfile.findUnique({
          where: { userId: clientUser.id }
        })

        if (!clientProfile) {
          clientProfile = await prisma.clientProfile.create({
            data: {
              userId: clientUser.id,
              company: "Colegio Mexicano de Anestesiología A.C.",
              type: "corporate"
            }
          })
        }

        await prisma.bookingRequest.create({
          data: {
            shortId: "VND-COLEGIO",
            clientId: clientProfile.id,
            clientName: "Colegio Mexicano de Anestesiología A.C.",
            clientEmail: "colegio@anestesiologia.mx",
            clientPhone: "5555555555",
            packageName: "Presentación musical + Producción técnica + Opcionales",
            requestedDate: new Date("2026-08-20T12:00:00Z"),
            startTime: "20:00",
            endTime: "22:30",
            baseAmount: 133410,
            depositAmount: 77377.80,
            paymentMethod: "transfer",
            status: "pendiente",
            address: "World Trade Center, Ciudad de México (Salón Tolteca)",
            city: "CDMX",
            state: "Ciudad de México",
            venueType: "salon",
            guestCount: 800,
            hasPantalla: true,
            hasTemplete: true,
            quoteVersion: 1
          }
        })
        console.log("🤖 [Self-Healing] Created special booking request VND-COLEGIO")
      }
    } catch (seedErr) {
      console.error("🤖 [Self-Healing] Error seeding special booking VND-COLEGIO:", seedErr)
    }

    // 6. Asegurar que el usuario admin@vendetta.mx tenga la contraseña configurada
    try {
      const { hash } = await import("bcryptjs")
      const adminPassHash = await hash("Pp55202104#", 12)
      
      const adminUser = await prisma.user.findFirst({
        where: { email: "admin@vendetta.mx" }
      })

      if (!adminUser) {
        await prisma.user.create({
          data: {
            name: "Admin Vendetta",
            email: "admin@vendetta.mx",
            password: adminPassHash,
            role: "ADMIN"
          }
        })
        console.log("🤖 [Self-Healing] Created Admin user admin@vendetta.mx")
      } else {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: {
            password: adminPassHash,
            role: "ADMIN"
          }
        })
        console.log("🤖 [Self-Healing] Updated Admin user admin@vendetta.mx password")
      }
    } catch (adminErr) {
      console.error("🤖 [Self-Healing] Error ensuring admin user:", adminErr)
    }

  } catch (err) {
    console.error("❌ [Self-Healing] Error auto-applying missing schema columns:", err)
  }
}

// Fire and forget: self-heal database columns in background (evitar en fase de build)
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-export"
if (!isBuildPhase) {
  ensureSchemaUpToDate(db).catch(e => console.error("Error running ensureSchemaUpToDate:", e))
}
