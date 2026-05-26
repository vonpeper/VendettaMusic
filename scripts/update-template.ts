import * as dotenv from "dotenv"
import path from "path"
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

import { db } from "../src/lib/db"

async function update() {
  await db.globalConfig.update({
    where: { id: "vendetta_config" },
    data: {
      msgTemplateGig: `🎸 *NUEVA CONVOCATORIA: {{eventName}}*
  
👤 *Cliente / Evento:* {{clientName}}
📅 *Fecha:* {{date}}
🎤 *Hora de Show:* {{performanceStart}}
📍 *Ubicación:* {{location}}
🏠 *Dirección:* {{address}}
🗺️ *Maps:* {{mapsLink}}
🚗 *Llegada músicos:* {{arrivalTime}}
⚙️ *Hora de Montaje:* {{setupTime}}
👔 *Vestimenta:* {{dressCode}}
📝 *Notas:* {{notes}}

🔗 *Confirma tu asistencia aquí:*
{{confirmLink}}`
    }
  })
  console.log("Template updated successfully")
}

update().finally(() => db.$disconnect())
