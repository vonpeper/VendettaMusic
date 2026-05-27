import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Ensure we have a DB URL; PrismaClient needs a non‑empty datasource config.
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: DATABASE_URL is not defined in .env');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl },
  },
});

const eventId = process.argv[2];
if (!eventId) {
  console.error('Se necesita el ID del evento como argumento.');
  process.exit(1);
}

(async () => {
  try {
    await prisma.event.delete({ where: { id: eventId } });
    console.log(`Evento con ID ${eventId} eliminado exitosamente.`);
  } catch (err) {
    console.error('Error al eliminar el evento:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
