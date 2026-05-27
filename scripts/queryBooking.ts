import { db } from "@/lib/db";

async function checkBooking(id: string) {
  const booking = await db.bookingRequest.findUnique({
    where: { id },
    include: { event: true, client: true }
  });
  console.log(JSON.stringify(booking, null, 2));
}

const [,, id] = process.argv;
if (!id) {
  console.error("Usage: node queryBooking.ts <bookingId>");
  process.exit(1);
}

checkBooking(id).finally(() => process.exit());
