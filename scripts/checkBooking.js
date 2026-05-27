const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const id = process.argv[2];
(async () => {
  try {
    const booking = await prisma.bookingRequest.findUnique({ where: { id } });
    console.log('Booking:', booking);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
