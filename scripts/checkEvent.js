const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

console.log('DATABASE_URL =', process.env.DATABASE_URL);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const eventId = process.argv[2];

(async () => {
  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    console.log('Event:', event);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
