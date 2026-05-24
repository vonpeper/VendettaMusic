const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const br = await prisma.bookingRequest.findFirst({
    where: { shortId: "VND-BBEB" },
    include: { event: { include: { location: true, package: true } } }
  });
  console.log(JSON.stringify(br, null, 2));
}
run();
