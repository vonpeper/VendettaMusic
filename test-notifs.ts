import { db } from './src/lib/db';
async function run() {
  const t609 = await db.bookingRequest.findFirst({
    where: { clientName: 'Terraza 609' },
    orderBy: { createdAt: 'desc' },
    include: { event: { include: { musicians: { include: { musician: { include: { user: true } } } } } } }
  });
  if (!t609) { console.log('no Terraza 609 found'); return; }
  console.log(`Booking: ${t609.id} - ${t609.shortId}`);
  const notifs = await db.notification.findMany({ where: { bookingRequestId: t609.id } });
  console.log(`Notifications:`, notifs.map(n => ({ type: n.type, status: n.status, error: n.errorDetails, recipient: n.recipient })));
  console.log(`Musicians:`, t609.event?.musicians.map(m => m.musician.user.name));
}
run();
