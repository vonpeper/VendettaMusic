import { db } from '../lib/db'

async function main() {
  console.log('Iniciando migración de normalización de datos...')

  // Migration logic disabled since phone columns were deleted from database
  // in previous migrations.

  console.log('🚀 Migración completada exitosamente.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    // await db.$disconnect()
  })
