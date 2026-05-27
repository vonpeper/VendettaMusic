import { db } from '@/lib/db';

async function main() {
  const id = 'e3df92c5-9c50-42bf-820a-54d1b6bc8656';
  const booking = await db.bookingRequest.findUnique({ where: { id } });
  console.log('Booking exists:', !!booking);
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
