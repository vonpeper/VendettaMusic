const { PrismaClient } = require('@prisma/client')
const { PrismaLibSql } = require('@prisma/adapter-libsql')
const { createClient } = require('@libsql/client')
require('dotenv').config()

async function test() {
  console.log("🔍 Testing DB Connection...")
  try {
    const client = createClient({
      url: process.env.DATABASE_URL || 'file:./dev.db',
    })
    const adapter = new PrismaLibSql(client)
    const prisma = new PrismaClient({ adapter })

    console.log("📡 Querying locations via SQL...")
    const locations = await prisma.$queryRawUnsafe('SELECT * FROM Location LIMIT 1')
    console.log("✅ SQL Success:", locations)

    console.log("📡 Querying locations via Prisma Client...")
    const locs = await prisma.location.findMany({ take: 1 })
    console.log("✅ Prisma Success:", locs)

  } catch (err) {
    console.error("❌ DB TEST FAILED:", err)
  }
}

test()
