import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

const id = process.argv[2];
if (!id) {
  console.error('Provide booking ID');
  process.exit(1);
}

(async () => {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id },
      include: { client: true, event: true },
    });
    console.log('Booking:', JSON.stringify(booking, null, 2));
    if (booking?.eventId) {
      const event = await prisma.event.findUnique({ where: { id: booking.eventId } });
      console.log('Related Event:', JSON.stringify(event, null, 2));
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
