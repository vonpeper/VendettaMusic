/**
 * Script de Purga de Mensajes Huérfanos en InboxItem
 * 
 * Uso:
 *   npx tsx scripts/purge-orphan-inbox.ts
 *
 * Elimina todos los registros de InboxItem que no tengan correspondencia
 * con BookingRequest, ContactInquiry o ClientProfile válidos en la base de datos comercial.
 */

import { purgeOrphanInboxItems } from "../src/lib/commercial-contacts"

async function main() {
  console.log("==================================================")
  console.log("🧹 INICIANDO PURGA DE MENSAJES HUÉRFANOS (INBOX)")
  console.log("==================================================")

  const startTime = Date.now()
  const result = await purgeOrphanInboxItems()
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log(`📊 Total de registros escaneados:   ${result.totalScanned}`)
  console.log(`🗑️  Mensajes huérfanos eliminados:    ${result.deletedCount}`)
  console.log(`✅ Mensajes válidos conservados:     ${result.remainingCount}`)
  console.log(`⏱️  Tiempo de ejecución:             ${duration}s`)
  console.log("==================================================")
  console.log("✨ Purga completada exitosamente.")
}

main()
  .catch((err) => {
    console.error("❌ Error durante la purga de mensajes huérfanos:", err)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
