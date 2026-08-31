import { db } from "../src/lib/db"

async function main() {
  console.log("=== VENDETTA MUSIC: AUDITORÍA DE VENUES Y LOCACIONES (SOLO LECTURA) ===\n")

  const [locations, events] = await Promise.all([
    db.location.findMany(),
    db.event.findMany({ select: { id: true, locationId: true, customName: true, date: true } })
  ])

  console.log("Total Locaciones en catálogo: " + locations.length)
  console.log("Total Eventos registrados:    " + events.length + "\n")

  const syntheticLocations = locations.filter(l => l.name.startsWith("Show - ") || l.name.startsWith("Show-"))
  const realLocations = locations.filter(l => !l.name.startsWith("Show - ") && !l.name.startsWith("Show-"))

  console.log("Locaciones reales del catálogo:   " + realLocations.length)
  console.log("Locaciones sintéticas (Show - *): " + syntheticLocations.length)

  const unlinkedEvents = events.filter(e => !e.locationId)
  console.log("Eventos sin locationId vinculado:  " + unlinkedEvents.length)

  const nameMap = new Map<string, string[]>()
  for (const loc of realLocations) {
    const key = loc.name.trim().toLowerCase()
    const list = nameMap.get(key) || []
    list.push(loc.id)
    nameMap.set(key, list)
  }

  const duplicateNames = Array.from(nameMap.entries()).filter(([_, ids]) => ids.length > 1)
  console.log("\nLocaciones con nombres duplicados en catálogo: " + duplicateNames.length)
  duplicateNames.forEach(([name, ids], idx) => {
    console.log("  [" + (idx + 1) + "] \"" + name + "\" (" + ids.length + " registros: " + ids.join(", ") + ")")
  })

  console.log("\n=== FIN DEL REPORTE DE AUDITORÍA DE VENUES ===")
}

main()
  .catch((e) => {
    console.error("Error en auditoría:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
