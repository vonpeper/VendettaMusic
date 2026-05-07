
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const client = createClient({ url: 'file:./prisma/dev.db' })
const adapter = new PrismaLibSql(client)
const prisma = new PrismaClient({ adapter })

async function main() {
  const bookings = await prisma.bookingRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  console.log(JSON.stringify(bookings, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
