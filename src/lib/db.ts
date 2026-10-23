import path from "path"
import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { createClient } from "@libsql/client"

function resolveDbUrl(): string {
  const env = process.env.DATABASE_URL?.trim()
  if (env) {
    if (env.startsWith("file:") || env.startsWith("libsql:") || env.startsWith("http")) {
      return env
    }
    return `file:${env}`
  }
  const defaultPath = path.join(process.cwd(), "prisma", "prod.db")
  return `file:${defaultPath}`
}

const dbUrl = resolveDbUrl()

// Habilitar Write-Ahead Logging y timeout de concurrencia en SQLite
async function configureDatabasePragmas() {
  if (!dbUrl.startsWith("file:")) return
  if (process.env.NEXT_PHASE === "phase-production-build") return
  try {
    const client = createClient({ url: dbUrl })
    await client.execute("PRAGMA journal_mode = WAL;")
    await client.execute("PRAGMA busy_timeout = 5000;")
    await client.execute("PRAGMA synchronous = NORMAL;")
    client.close()
  } catch (err: any) {
    if (err?.code !== "SQLITE_BUSY") {
      console.error("Error al configurar pragmas de SQLite:", err)
    }
  }
}

const globalForPrisma = globalThis as unknown as { 
  prisma?: PrismaClient
  pragmasConfigured?: boolean 
}

if (!globalForPrisma.pragmasConfigured) {
  globalForPrisma.pragmasConfigured = true
  configureDatabasePragmas().catch((err) => {
    console.error("Error al configurar pragmas de SQLite:", err)
  })
}

// In Prisma 7, PrismaLibSql is a factory that can be passed as the adapter
const adapter = new PrismaLibSql({ 
  url: dbUrl 
})

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
