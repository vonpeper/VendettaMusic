const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
