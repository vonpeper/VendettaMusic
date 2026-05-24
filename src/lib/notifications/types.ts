export type NotificationType = 
  | "ADMIN_NEW_BOOKING"   // Aviso al jefe de nueva venta web
  | "CLIENT_QUOTE"       // Envío de cotización inicial
  | "CLIENT_FOLLOWUP"    // Seguimiento de venta pendiente
  | "CLIENT_REMINDER"    // Recordatorio de evento próximo
  | "CLIENT_CONFIRMED"   // Aviso de fecha bloqueada (agendado)
  | "CLIENT_THANKS"      // Mensaje post-evento (Agradecimiento)
  | "MUSICIAN_GIG"       // Convocatoria a músicos
  | "MUSICIAN_REHEARSAL" // Aviso de ensayo
  | "EVENT_CANCELLED"    // Aviso de cancelación de evento
