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
  // Fallback dev: SQLite relative to cwd. Use a relative URL (libsql resolves it).
  return "file:./prisma/dev.db"
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaLibSql({ url: resolveDbUrl() }),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
