import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
  const br = await prisma.bookingRequest.findFirst({
    where: { clientName: { contains: "Bruma" } },
    include: { event: { include: { location: true, package: true } } }
  });
  console.log("BR1:", br);
  
  const ev = await prisma.event.findFirst({
    where: { OR: [ { customName: { contains: "Bruma" } } ] },
    include: { location: true, package: true, client: true, bookingRequest: true }
  });
  console.log("EV1:", ev);
}
run();
