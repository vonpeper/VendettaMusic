import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const bookings = await prisma.bookingRequest.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' }
  })
  const tests = bookings.filter(b => b.clientName.toLowerCase().includes('test') || b.clientName.toLowerCase().includes('prueba'))
  console.log("Test Bookings:", tests.map(b => ({ id: b.id, name: b.clientName, phone: b.clientPhone })))
}
main().finally(() => prisma.$disconnect())
