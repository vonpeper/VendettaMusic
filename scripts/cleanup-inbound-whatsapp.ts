import { db } from "../src/lib/db"

async function main() {
  const isExecute = process.argv.includes("--execute")
  const confirmation = process.env.CONFIRM_CLEANUP_INBOUND?.trim()

  console.log("=== VENDETTA MUSIC: LIMPIEZA DE MENSAJES ENTRANTES (INBOUND) ===")
  console.log("Modo: " + (isExecute ? "EJECUCIÓN REAL (--execute)" : "SIMULACIÓN / DRY-RUN (Solo lectura)"))

  const [inboundNotifsCount, inboxItemsCount] = await Promise.all([
    db.notification.count({ where: { type: "inbound" } }),
    db.inboxItem.count()
  ])

  console.log("\nRegistros encontrados para saneamiento:")
  console.log("  - Notificaciones entrantes (inbound): " + inboundNotifsCount)
  console.log("  - Elementos de bandeja InboxItem:     " + inboxItemsCount)

  if (!isExecute) {
    console.log("\n[SIMULACIÓN COMPLETA] No se modificó ningún registro.")
    console.log("Para proceder con la eliminación en el VPS ejecute:")
    console.log("  CONFIRM_CLEANUP_INBOUND=\"ELIMINAR_WHATSAPP_INBOUND_VENDETTA\" npx tsx scripts/cleanup-inbound-whatsapp.ts --execute\n")
    return
  }

  if (confirmation !== "ELIMINAR_WHATSAPP_INBOUND_VENDETTA") {
    console.error("\n[ERROR] Confirmación inválida. Debe definir:")
    console.error("  CONFIRM_CLEANUP_INBOUND=\"ELIMINAR_WHATSAPP_INBOUND_VENDETTA\"\n")
    process.exit(1)
  }

  console.log("\nProcediendo con la eliminación de registros inbound...")

  const [deletedNotifs, deletedInbox] = await db.$transaction([
    db.notification.deleteMany({ where: { type: "inbound" } }),
    db.inboxItem.deleteMany()
  ])

  console.log("\n[ÉXITO] Saneamiento completado:")
  console.log("  - Notificaciones inbound eliminadas: " + deletedNotifs.count)
  console.log("  - Elementos InboxItem eliminados:     " + deletedInbox.count)
  console.log("  - Registros de mensajes técnicos salientes preservados al 100%.\n")
}

main()
  .catch((e) => {
    console.error("Error durante el saneamiento:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
