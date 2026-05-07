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
