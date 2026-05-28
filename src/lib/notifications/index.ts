export * from "./types"
export * from "./whatsapp"
export * from "./templates"
export * from "./admin"
export * from "./dispatcher"
export * from "./musicians"

// Google Calendar no está implementado; no-op usado al borrar eventos con googleCalendarId.
export async function deleteFromGoogleCalendar(calendarEventId: string): Promise<boolean> {
  console.log("📅 [Calendar Stub] Borrando evento:", calendarEventId)
  return true
}
