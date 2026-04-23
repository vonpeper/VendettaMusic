import { db } from "../lib/db";

async function main() {
  const events = await db.event.findMany();
  console.log(`Checking ${events.length} events...`);

  for (const event of events) {
    const isoString = event.date.toISOString();
    if (isoString.includes("T00:00:00")) {
      const newDateStr = isoString.split('T')[0] + "T12:00:00";
      console.log(`Fixing event ${event.id}: ${isoString} -> ${newDateStr}`);
      await db.event.update({
        where: { id: event.id },
        data: { date: new Date(newDateStr) }
      });
    }
  }
  console.log("Done!");
}

main().catch(console.error);
