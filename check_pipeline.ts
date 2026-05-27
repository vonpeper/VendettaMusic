import { db } from '@/lib/db';

async function main() {
  const pending = await db.bookingRequest.findMany({
    where: { status: { in: ['pending', 'pendiente'] } },
    select: { id: true }
  });
  console.log('Pending booking IDs:', pending.map(p => p.id));
}

main().catch(e => {
  console.error('Error querying pending bookings:', e);
  process.exit(1);
});
