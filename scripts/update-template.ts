import * as dotenv from "dotenv"
import path from "path"
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

import { db } from "../src/lib/db"

async function update() {
  const quoteTemplate = `🎸 *VENDETTA LIVE MUSIC* | Propuesta Oficial

Hola, *{{fullName}}*. Es un gusto saludarte.

Preparamos tu propuesta personalizada para tu evento en *{{location}}*:

📅 *Fecha:* {{eventDate}}
⏱️ *Duración:* {{durationHours}} horas de show en vivo
👥 *Aforo estimado:* {{guestCount}} personas
✨ *Formato:* 100% Pop Rock en vivo

Puedes consultar el desglose de tu show y confirmar tu fecha directamente en nuestro portal digital:
👉 {{proposalLink}}

_Nota: La fecha se cierra con el anticipo verificado y la firma de contrato para seguridad de nuestros clientes._

Cualquier duda o ajuste especial, estamos a tu disposición por este medio.
*Vendetta Management*`

  const eventCloseTemplate = `¡Felicidades {{clientName}}! 🎉

Hemos recibido tu anticipo y tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

✍️ Entra y firma tu contrato en el siguiente enlace:
{{bookingLink}}

¡Gracias por confiar en *Vendetta* para este día tan especial! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`

  const barCloseTemplate = `¡Hola {{clientName}}! 🎉

Tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

✍️ Entra y firma tu contrato en el siguiente enlace:
{{bookingLink}}

¡Gracias por confiar en *Vendetta*! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`

  const followUpTemplate = `Hola {{clientName}}, te escribo de *Vendetta Music* 🎸 para dar seguimiento a tu cotización. ¿Pudiste revisarla?

👉 Consulta tu propuesta formal y confirma tu fecha aquí:
https://vendetta.mx/propuesta/{{shortId}}

Seguimos a tus órdenes.`

  const thanksTemplate = `¡Hola {{clientName}}! 🎉 Todavía seguimos emocionados por lo de ayer.
      
Fue un honor ser parte de tu evento. Nos encantaría que nos regales una reseña aquí para que más personas conozcan la experiencia Vendetta:
👉 https://vendetta.mx/#testimoniales

¡Gracias totales por confiar en Vendetta! 🤘🎸`

  await db.globalConfig.upsert({
    where: { id: "vendetta_config" },
    update: {
      msgTemplateQuote: quoteTemplate,
      msgTemplateEventClose: eventCloseTemplate,
      msgTemplateBarClose: barCloseTemplate,
      msgTemplateFollowUp: followUpTemplate,
      msgTemplateThanks: thanksTemplate,
    },
    create: {
      id: "vendetta_config",
      msgTemplateQuote: quoteTemplate,
      msgTemplateEventClose: eventCloseTemplate,
      msgTemplateBarClose: barCloseTemplate,
      msgTemplateFollowUp: followUpTemplate,
      msgTemplateThanks: thanksTemplate,
    }
  })
  console.log("✅ Templates in GlobalConfig updated successfully")
}

update().finally(() => db.$disconnect())
