const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");

// Initialize Prisma Client with PrismaLibSql adapter
const url = process.env.DATABASE_URL || "file:/app/prisma/prod.db";
console.log(`🔌 Conectando a base de datos usando: ${url}`);
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

async function getAccessToken(config) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      refresh_token: config.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to refresh access token: ${err}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function main() {
  const eventId = "4ed4ca86-1024-4982-82eb-ebf81548c3de";
  console.log(`🔍 Buscando evento ${eventId} en la base de datos...`);
  
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      location: true,
      client: { include: { user: true } },
      bookingRequest: true,
    }
  });

  if (!event) {
    console.error("❌ Evento no encontrado en la base de datos.");
    return;
  }

  console.log(`✅ Evento encontrado: ${event.customName || event.bookingRequest?.clientName || "Sin nombre"}`);
  console.log(`🕒 Horario de Show: ${event.performanceStart || "No definido"} - ${event.performanceEnd || "No definido"}`);

  const config = await prisma.globalConfig.findUnique({ where: { id: "vendetta_config" } });
  if (!config || !config.googleCalendarId || !config.googleRefreshToken) {
    console.error("❌ Integración de Google Calendar no configurada en globalConfig.");
    return;
  }

  console.log("🔑 Refrescando token de acceso de Google...");
  const accessToken = await getAccessToken(config);
  const calendarId = config.googleCalendarId;

  const clientName = event.customName || event.client?.user?.name || event.bookingRequest?.clientName || "Sin nombre";
  const locationAddress = event.location?.address || event.bookingRequest?.address || "Dirección no especificada";
  const locationGps = event.location?.mapsLink || event.mapsLink || event.bookingRequest?.mapsLink || "";

  const summary = `Vendetta: ${clientName} - ${event.ceremonyType || "Show"}`;
  const startTime = event.performanceStart || event.startTime || "21:00";
  const endTime = event.performanceEnd || event.performanceStart || "23:00";

  const descriptionParts = [
    `🎸 EVENTO VENDETTA`,
    `---------------------------------------`,
    `👤 Cliente: ${clientName}`,
    `📞 Teléfono: ${event.bookingRequest?.clientPhone || event.client?.whatsapp || "No especificado"}`,
    `📧 Email: ${event.bookingRequest?.clientEmail || event.client?.user?.email || "No especificado"}`,
    `🎉 Tipo: ${event.ceremonyType || "Show"}`,
    `📍 Dirección: ${locationAddress}`,
    locationGps ? `🗺️ Google Maps: ${locationGps}` : "",
    `---------------------------------------`,
    event.musicianNotes ? `📝 Notas: ${event.musicianNotes}` : ""
  ].filter(Boolean);

  const description = descriptionParts.join("\n");

  const eventDate = new Date(event.date);
  const y = eventDate.getUTCFullYear();
  const m = String(eventDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(eventDate.getUTCDate()).padStart(2, "0");

  const startDateTime = `${y}-${m}-${d}T${startTime}:00`;
  const endDateTime = `${y}-${m}-${d}T${endTime}:00`;

  const body = {
    summary,
    location: locationAddress,
    description,
    start: {
      dateTime: startDateTime,
      timeZone: "America/Mexico_City"
    },
    end: {
      dateTime: endDateTime,
      timeZone: "America/Mexico_City"
    }
  };

  console.log("📤 Enviando carga útil a Google Calendar:", JSON.stringify(body, null, 2));

  let response;
  if (event.googleCalendarId) {
    console.log(`🔄 Actualizando evento existente en Google Calendar con ID: ${event.googleCalendarId}...`);
    response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${event.googleCalendarId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } else {
    console.log("🆕 Creando nuevo evento en Google Calendar...");
    response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  }

  const resText = await response.text();
  console.log("Response status:", response.status);

  if (response.ok) {
    const resData = JSON.parse(resText);
    if (!event.googleCalendarId) {
      await prisma.event.update({
        where: { id: event.id },
        data: { googleCalendarId: resData.id }
      });
      console.log("💾 ID de Google Calendar guardado en la base de datos:", resData.id);
    }
    console.log("🎉 Sincronización exitosa.");
  } else {
    console.error("❌ Falló la sincronización con Google Calendar:", resText);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
