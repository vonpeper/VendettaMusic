import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const brenda = await prisma.user.findFirst({
    where: { name: { contains: "Brenda" } },
    include: { musicianProfile: true }
  })
  if (brenda) {
    console.log("Found Brenda:", brenda)
  } else {
    console.log("Brenda not found")
  }
}
main()
