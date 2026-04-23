const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function run() {
  try {
    await db.package.updateMany({
      where: { name: 'Essential' },
      data: { 
        baseCostPerHour: 3800, 
        minDuration: 2, 
        includes: 'Audio Electro-Voice, Backline, Iluminación RGB, 4 integrantes, Staff, 2 sets' 
      }
    });

    await db.package.updateMany({
      where: { name: 'Experience' },
      data: { 
        baseCostPerHour: 7750, 
        minDuration: 2, 
        includes: 'Todo lo de Essential + Audio profesional (100-300 pers)' 
      }
    });

    await db.package.updateMany({
      where: { name: 'Festival Premium' },
      data: { 
        baseCostPerHour: 12750, 
        minDuration: 2, 
        includes: 'Todo lo de Experience + Templete, Pantalla LED 3x2, Iluminación Robótica' 
      }
    });

    console.log('✅ Base de datos actualizada con nuevos costos y servicios.');
  } catch (e) {
    console.error('❌ Error updating DB:', e);
  } finally {
    await db.$disconnect();
  }
}

run();
