import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  
  for (const n of notifs) {
    console.log(`[${n.createdAt}] ${n.type} -> ${n.recipient} | Status: ${n.status} | Err: ${n.errorDetails}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
