import { db } from './src/lib/db';
async function run() {
  const ts = await db.bookingRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { event: { include: { location: true } } }
  });
  ts.forEach(t => {
    console.log(`booking: ${t.shortId} | clientName: ${t.clientName} | venueName: ${t.venueType} | isBar: ${t.packageId === 'bar'} | event: ${!!t.event}`);
    if (t.event) console.log(`  location: ${t.event.location?.name}`);
  });
}
run();
