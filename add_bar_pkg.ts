import { db } from './src/lib/db'

async function main() {
  const barPkg = await db.package.upsert({
    where: { id: 'bar' },
    update: {
      name: 'Bar',
      description: 'Show de 2 turnos de 45 mins. Diseñado específicamente para Bares/Restaurants.',
      baseCostPerHour: 4000,
      minDuration: 2,
      includes: '🔊 Audio EV,🎸 Backline completo,👥 4 Integrantes + Ing. en audio + Staff,⏱️ 2 turnos de 45 mins',
      isCustom: false,
    },
    create: {
      id: 'bar',
      name: 'Bar',
      description: 'Show de 2 turnos de 45 mins. Diseñado específicamente para Bares/Restaurants.',
      baseCostPerHour: 4000,
      minDuration: 2,
      includes: '🔊 Audio EV,🎸 Backline completo,👥 4 Integrantes + Ing. en audio + Staff,⏱️ 2 turnos de 45 mins',
      isCustom: false,
    }
  })
  console.log("Upserted bar package:", barPkg)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
