const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const booking = await db.bookingRequest.findUnique({
    where: { id: "602af448-f192-457f-8683-101bdc6ce8d1" },
    include: { event: true }
  });
  console.log(JSON.stringify(booking, null, 2));
}
main().catch(console.error).finally(() => db.$disconnect());
