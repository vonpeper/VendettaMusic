
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { customName: { contains: 'Casino' } },
        { customName: { contains: 'Codere' } }
      ]
    },
    select: {
      id: true,
      customName: true,
      arrivalTime: true,
      setupTime: true,
      dressCode: true,
      musicianNotes: true
    }
  })
  
  console.log(JSON.stringify(events, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
