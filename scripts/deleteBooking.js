require('ts-node/register');
const { db } = require('../src/lib/db');

(async () => {
  const id = 'e3df92c5-9c50-42bf-820a-54d1b6bc8656';
  try {
    await db.bookingRequest.delete({ where: { id } });
    console.log('✅ Booking eliminado');
  } catch (e) {
    console.error('⚠️ Error al eliminar booking:', e);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
})();
