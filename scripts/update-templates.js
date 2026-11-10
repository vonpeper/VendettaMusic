
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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
*Vendetta Management*`;

  const confirmedTemplate = `¡Felicidades {{clientName}}! 🎉

Hemos recibido tu anticipo y tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

✍️ Entra y firma tu contrato en el siguiente enlace:
{{bookingLink}}

¡Gracias por confiar en *Vendetta* para este día tan especial! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`;

  const barCloseTemplate = `¡Hola {{clientName}}! 🎉

Tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

✍️ Entra y firma tu contrato en el siguiente enlace:
{{bookingLink}}

¡Gracias por confiar en *Vendetta*! 🎸

—
Visita *vendetta.mx* y consulta nuestro aviso de privacidad en: _vendetta.mx/privacidad_`;

  await prisma.globalConfig.upsert({
    where: { id: 'vendetta_config' },
    update: { 
      msgTemplateQuote: quoteTemplate,
      msgTemplateEventClose: confirmedTemplate,
      msgTemplateBarClose: barCloseTemplate
    },
    create: { 
      id: 'vendetta_config',
      msgTemplateQuote: quoteTemplate,
      msgTemplateEventClose: confirmedTemplate,
      msgTemplateBarClose: barCloseTemplate
    }
  });

  console.log('✅ Plantillas VIP actualizadas con éxito');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
