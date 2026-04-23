import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const profileIds = ["6517a02c-569d-4720-a63e-7c595679fe85"] // ID of 'Cliente Final Prueba' if I can find it
  
  // Let's find the actual ID first
  const profiles = await db.clientProfile.findMany({
    where: {
      user: {
        name: { contains: "Prueba" }
      }
    },
    select: { id: true, userId: true, user: { name: true } }
  })

  console.log("Profiles found:", profiles)

  if (profiles.length === 0) {
    console.log("No profiles found to delete.")
    return
  }

  const ids = profiles.map(p => p.id)
  const userIds = profiles.map(p => p.userId)

  console.log("Attempting deletion for ids:", ids)

  try {
    await db.$transaction(async (tx) => {
      console.log("Deleting Bookings...")
      const b = await tx.bookingRequest.deleteMany({ where: { clientId: { in: ids } } })
      console.log("Bookings deleted:", b.count)

      console.log("Deleting Events...")
      const e = await tx.event.deleteMany({ where: { clientId: { in: ids } } })
      console.log("Events deleted:", e.count)

      console.log("Deleting Quotes...")
      const q = await tx.quote.deleteMany({ where: { clientId: { in: ids } } })
      console.log("Quotes deleted:", q.count)

      console.log("Deleting Users...")
      const u = await tx.user.deleteMany({ where: { id: { in: userIds } } })
      console.log("Users deleted:", u.count)
    }, {
      timeout: 10000 // 10 seconds
    })
    console.log("Transaction completed successfully.")
  } catch (err) {
    console.error("Transaction failed:", err)
  } finally {
    await db.$disconnect()
  }
}

main()
