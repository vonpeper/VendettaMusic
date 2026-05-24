export * from "./types"
export * from "./whatsapp"
export * from "./templates"
export * from "./admin"
export * from "./dispatcher"
export * from "./musicians"

/**
 * Google Calendar Sync (Stub)
 */
export async function syncToGoogleCalendar(event: any): Promise<string | null> {
  // Implementación pendiente de credenciales finales
  return null
}

/**
 * Google Calendar Delete (Stub)
 */
export async function deleteFromGoogleCalendar(calendarEventId: string): Promise<boolean> {
  console.log("📅 [Calendar Stub] Borrando evento:", calendarEventId);
  return true;
}
