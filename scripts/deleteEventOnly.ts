import { db } from "@/lib/db";

async function deleteEventOnly(bookingId: string) {
  const booking = await db.bookingRequest.findUnique({
    where: { id: bookingId },
    select: { eventId: true },
  });
  if (!booking) {
    console.error(`Booking with id ${bookingId} not found.`);
    return;
  }
  if (!booking.eventId) {
    console.log(`Booking ${bookingId} has no associated event.`);
    return;
  }
  try {
    await db.event.delete({ where: { id: booking.eventId } });
    console.log(`Event ${booking.eventId} deleted successfully for booking ${bookingId}.`);
  } catch (err) {
    console.error(`Error deleting event ${booking.eventId}:`, err);
  }
}

const [,, bookingId] = process.argv;
if (!bookingId) {
  console.error("Usage: node deleteEventOnly.ts <bookingId>");
  process.exit(1);
}

deleteEventOnly(bookingId).finally(() => process.exit());
