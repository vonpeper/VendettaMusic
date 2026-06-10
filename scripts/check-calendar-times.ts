// scripts/check-calendar-times.ts
import { db } from "@/lib/db";
import { getAccessToken } from "@/lib/google-calendar";
import fetch from "node-fetch";

/**
 * Busca eventos cuyo horario en Google Calendar difiere del registro local.
 * Imprime una tabla con id del evento, horarios locales y horarios en Calendar.
 */
async function main() {
  const events = await db.event.findMany({
    where: { googleCalendarId: { not: null } },
    select: {
      id: true,
      date: true,
      performanceStart: true,
      performanceEnd: true,
      startTime: true,
      googleCalendarId: true,
    },
  });

  const config = await db.globalConfig.findUnique({ where: { id: "vendetta_config" } });
  if (!config?.googleCalendarId || !config.googleRefreshToken) {
    console.error("Google Calendar no está configurado.");
    process.exit(1);
  }
  const accessToken = await getAccessToken();
  const calendarId = config.googleCalendarId;

  console.log("\nRevisando eventos...");
  console.log("ID\tLocal Start\tLocal End\tCalendar Start\tCalendar End");

  for (const ev of events) {
    const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${ev.googleCalendarId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) continue; // si falta el evento, lo ignoramos
    const data: any = await resp.json(); // cast to any to avoid TS18046
    const calStart = data.start?.dateTime?.split("T")[1]?.slice(0,5) ?? "-";
    const calEnd = data.end?.dateTime?.split("T")[1]?.slice(0,5) ?? "-";
    const localStart = ev.performanceStart ?? ev.startTime ?? "21:00";
    const localEnd = ev.performanceEnd ?? ev.performanceStart ?? "23:00";
    if (calStart !== localStart || calEnd !== localEnd) {
      console.log(`${ev.id}\t${localStart}\t${localEnd}\t${calStart}\t${calEnd}`);
    }
  }
}

main().catch((e) => console.error(e));
