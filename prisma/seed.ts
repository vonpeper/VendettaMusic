import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import "dotenv/config"
import crypto from "crypto"

// SEGURIDAD: Prevenir ejecución accidental en producción
if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEV_SEED !== "true") {
  console.error("🛑 [SEGURIDAD] El seed de base de datos está estrictamente bloqueado.")
  console.error("Para ejecutar en desarrollo local debe definir:")
  console.error("  ALLOW_DEV_SEED=true npx prisma db seed")
  process.exit(1)
}

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("file:")) {
  console.error("🛑 [SEGURIDAD] El seed solo puede ejecutarse contra una base de datos local SQLite (file:...).")
  process.exit(1)
}

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Iniciando seed de desarrollo local seguro...")

  const devAdminPass = process.env.DEV_SEED_ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex")
  const passwordHash = await hash(devAdminPass, 12)

  // 1. Crear usuario Admin de desarrollo
  const admin = await prisma.user.upsert({
    where: { email: "admin@vendetta.local" },
    update: {},
    create: {
      name: "Admin Dev",
      email: "admin@vendetta.local",
      password: passwordHash,
      role: "ADMIN"
    }
  })
  console.log("Usuario de desarrollo creado: admin@vendetta.local")

  // 2. Crear configuración inicial
  await prisma.globalConfig.upsert({
    where: { id: "vendetta_config" },
    update: {},
    create: {
      id: "vendetta_config",
      autoFollowUpEnabled: true,
      logInboundActive: false
    }
  })

  // 3. Crear catálogo de paquetes base
  const countPkgs = await prisma.package.count()
  if (countPkgs === 0) {
    await prisma.package.create({
      data: {
        name: "Vendetta Essential",
        baseCostPerHour: 5000,
        minDuration: 3,
        description: "Paquete base para eventos sociales.",
        includes: "Quinteto base, audio estándar, staff básico.",
      }
    })
    await prisma.package.create({
      data: {
        name: "Vendetta Premium",
        baseCostPerHour: 8000,
        minDuration: 5,
        description: "Producción completa para bodas y corporativos.",
        includes: "Septeto con metales, escenario, iluminación robótica, ingeniero de sala.",
      }
    })
  }

  console.log("Seed de desarrollo completado exitosamente.")
}

main()
  .catch((e) => {
    console.error("Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
