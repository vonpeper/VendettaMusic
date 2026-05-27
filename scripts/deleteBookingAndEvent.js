import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Clean up the DATABASE_URL (remove any surrounding quotes)
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: DATABASE_URL is not defined in .env');
  process.exit(1);
}
// Remove surrounding quotes if present
dbUrl = dbUrl.replace(/^['"]|['"]$/g, '');

// Prisma will read the env var internally, so we just instantiate normally.
const prisma = new PrismaClient();

const bookingId = process.argv[2];
if (!bookingId) {
  console.error('Provide a booking ID as argument');
  process.exit(1);
}

(async () => {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });
    if (!booking) {
      console.log('Booking not found:', bookingId);
      process.exit(0);
    }
    // Delete linked event first if exists
    if (booking.eventId) {
      await prisma.event.delete({ where: { id: booking.eventId } });
      console.log('Deleted linked event:', booking.eventId);
    }
    // Delete the booking request
    await prisma.bookingRequest.delete({ where: { id: bookingId } });
    console.log('Deleted booking request:', bookingId);
  } catch (e) {
    console.error('Error during deletion:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
