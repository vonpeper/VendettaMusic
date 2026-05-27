import { db } from "@/lib/db";

async function deleteEventById(eventId: string) {
  if (!eventId) {
    console.error("Se necesita el ID del evento.");
    process.exit(1);
  }
  try {
    await db.event.delete({ where: { id: eventId } });
    console.log(`Evento ${eventId} eliminado exitosamente.`);
  } catch (err) {
    console.error(`Error al eliminar el evento ${eventId}:`, err);
    process.exit(1);
  }
}

const [,, eventId] = process.argv;
deleteEventById(eventId).finally(() => process.exit());
