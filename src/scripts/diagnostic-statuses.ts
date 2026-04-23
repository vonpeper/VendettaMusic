import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const bookingStatuses = await prisma.bookingRequest.groupBy({
    by: ['status'],
    _count: true
  })
  
  const eventStatuses = await prisma.event.groupBy({
    by: ['status'],
    _count: true
  })

  console.log('--- BookingRequest Statuses ---')
  console.log(JSON.stringify(bookingStatuses, null, 2))
  
  console.log('--- Event Statuses ---')
  console.log(JSON.stringify(eventStatuses, null, 2))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
