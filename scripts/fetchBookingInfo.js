require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const id = '04d7f6a4-09d5-45dc-85d8-fb669d8349dd';
  const booking = await prisma.bookingRequest.findUnique({
    where: { id },
    include: {
      client: { include: { user: true, clientProfile: true } },
    },
  });
  console.log('BookingRequest:', JSON.stringify(booking, null, 2));
  await prisma.$disconnect();
})();
