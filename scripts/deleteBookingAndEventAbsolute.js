import { resolve } from 'path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load .env from the project root regardless of where the script is executed
config({ path: resolve(__dirname, '..', '.env') });

// Clean up the DATABASE_URL (remove surrounding quotes if present)
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: DATABASE_URL is not defined in .env');
  process.exit(1);
}
// Strip quotes that sometimes appear in the .env file
dbUrl = dbUrl.replace(/^['"]|['"]$/g, '');
process.env.DATABASE_URL = dbUrl; // Ensure Prisma reads the cleaned value

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

    // Delete linked event first if it exists
    if (booking.eventId) {
      await prisma.event.delete({ where: { id: booking.eventId } });
      console.log('Deleted linked event:', booking.eventId);
    }

    // Delete the booking request itself
    await prisma.bookingRequest.delete({ where: { id: bookingId } });
    console.log('Deleted booking request:', bookingId);
  } catch (e) {
    console.error('Error during deletion:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
