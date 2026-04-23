const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function test() {
  try {
    const booking = await prisma.bookingRequest.create({
      data: {
        packageName: "Test",
        venueType: "salon",
        address: "Test",
        city: "Test",
        requestedDate: new Date(),
        startTime: "21:00",
        endTime: "23:00",
        baseAmount: 1000,
        depositAmount: 100,
        paymentMethod: "cash",
        clientName: "Test",
        clientPhone: "123",
        clientEmail: "test@test.com"
      }
    })
    console.log("Success:", booking.id)
  } catch (e) {
    console.error("Error:", e.message)
    if (e.code === 'P2002') console.log("Constraint violation")
    if (e.code === 'P2003') console.log("Foreign key violation")
  } finally {
    await prisma.$disconnect()
  }
}

test()
