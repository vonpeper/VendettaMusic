const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const brs = await prisma.bookingRequest.findMany({
    where: { OR: [ { clientName: { contains: "Bruma" } }, { address: { contains: "Bruma" } }, { packageName: { contains: "Bruma" } }, { venueType: { contains: "Bruma" } } ] },
    include: { event: { include: { location: true, package: true } } }
  });
  console.log("BookingRequests:", JSON.stringify(brs, null, 2));

  const events = await prisma.event.findMany({
    where: { customName: { contains: "Bruma" } },
    include: { location: true, package: true }
  });
  console.log("Events:", JSON.stringify(events, null, 2));

  const locations = await prisma.location.findMany({
    where: { name: { contains: "Bruma" } }
  });
  console.log("Locations:", JSON.stringify(locations, null, 2));
}
run();
