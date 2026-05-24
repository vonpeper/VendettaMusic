const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const bookingId = "602af448-f192-457f-8683-101bdc6ce8d1";
  
  const booking = await db.bookingRequest.findUnique({
    where: { id: bookingId },
    include: { 
      event: { 
        include: { 
          location: true,
          package: true
        } 
      } 
    }
  });

  console.log("Booking found:", booking ? "Yes" : "No");
  if (booking) {
    console.log("Event found inside booking:", booking.event ? "Yes" : "No");
  } else {
    // maybe it's an event ID?
    const event = await db.event.findUnique({
      where: { id: bookingId },
      include: { bookingRequest: true }
    });
    console.log("Is it an event ID?", event ? "Yes" : "No");
    if (event) {
        console.log("Event linked bookingId:", event.bookingRequest?.id);
    }
  }
}
main().catch(console.error).finally(() => db.$disconnect());
