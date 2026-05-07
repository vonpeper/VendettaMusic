
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const quoteTemplate = `Hola {{clientName}}, somos *Vendetta Live Music* 🎸.

Es un gusto saludarte. Te compartimos adjunta la propuesta exclusiva para tu evento el próximo *{{date}}*.

Revisamos cada detalle para asegurar que la música sea inolvidable. Quedamos a tus órdenes para agendar una breve llamada y pulir los detalles.

¡Rock on! 🤘`;

  const confirmedTemplate = `¡Felicidades {{clientName}}! 🎉

Hemos recibido tu anticipo y tu fecha para el *{{date}}* ha quedado oficialmente bloqueada en nuestra agenda.

*Folio:* {{shortId}}

Puedes consultar el estatus de tu evento y descargar tu contrato firmado aquí:
{{bookingLink}}

¡Gracias por confiar en *Vendetta* para este día tan especial! 🎸`;

  await prisma.globalConfig.upsert({
    where: { id: 'vendetta_config' },
    update: { 
      msgTemplateQuote: quoteTemplate,
      msgTemplateEventClose: confirmedTemplate
    },
    create: { 
      id: 'vendetta_config',
      msgTemplateQuote: quoteTemplate,
      msgTemplateEventClose: confirmedTemplate
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
