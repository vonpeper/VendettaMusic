// scripts/deleteEventAndCleanup.ts
import { db } from '@/lib/db';

/**
 * Elimina un Evento y limpia los vínculos del pipeline.
 * - Desasocia el BookingRequest (eventId -> null).
 * - Gracias a `onDelete: Cascade` en el modelo Prisma, los
 *   registros dependientes (EventMusician, Notification, Payment, Contract)
 *   se eliminan automáticamente.
 */
async function deleteEventAndCleanup(eventId: string) {
  if (!eventId) {
    console.error('Se requiere el ID del evento.');
    process.exit(1);
  }

  try {
    // Verificar si el evento existe
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) {
      console.warn(`⚠️ Evento ${eventId} no encontrado. No hay nada que borrar.`);
      process.exit(0);
    }

    // Iniciar transacción para asegurar consistencia
    await db.$transaction([
      // Desvincular el BookingRequest (si existe)
      db.bookingRequest.updateMany({
        where: { eventId },
        data: { eventId: null },
      }),
      // Borrar el evento (cascada elimina dependientes)
      db.event.delete({ where: { id: eventId } }),
    ]);

    console.log(`✅ Evento ${eventId} eliminado y referencias limpiadas.`);
  } catch (err) {
    console.error('❌ Error al eliminar el evento:', err);
    process.exit(1);
  }
}

const [, , eventId] = process.argv;
deleteEventAndCleanup(eventId).finally(() => process.exit());
