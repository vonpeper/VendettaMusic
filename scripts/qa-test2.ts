function parseTemplate(template, data) {
  let result = template;
  const extendedData = {
    fullName:    data.fullName || data.clientName || data.eventName || "",
    clientName:  data.clientName || (data.fullName ? data.fullName.split(" ")[0] : "") || data.eventName || "",
    eventName:   data.eventName || data.fullName || data.clientName || "Evento Vendetta",
    shortId:     data.shortId || data.folio || "",
    folio:       data.folio || data.shortId || "",
    time:        data.time || data.startTime || data.setupTime || data.performanceStart || "Por confirmar",
    location:    data.location || data.locationName || "Por confirmar",
    statusLink:  data.statusLink || data.bookingLink || "",
    bookingLink: data.bookingLink || data.statusLink || "",
    notes:       data.notes || data.musicianNotes || "Ninguna",
    ...data
  };
  for (const [key, value] of Object.entries(extendedData)) {
    const val = value === null || value === undefined ? "" : String(value);
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, val);
  }
  return result.replace(/\\n/g, "\n");
}

const eventName = "QA Test Client";
const gigDetails = {
  clientName: "QA Test Client",
  date: "2026-12-31",
  ceremonyType: "boda",
  locationName: "Test Location",
  mapsLink: "https://maps.google.com/test",
  performanceStart: "21:00",
  arrivalTime: "19:00",
  setupTime: "18:00",
  dressCode: "Formal",
  musicianNotes: "QA Testing Notes",
  packageName: "Paquete Boda Premium"
};

const template = `🎸 *NUEVA CONVOCATORIA: {{eventName}}*
  
📅 *Fecha:* {{date}}
🎉 *Tipo:* {{ceremony}}
📍 *Lugar:* {{location}}
🗺️ *Maps:* {{mapsLink}}
⏱️ *Montaje:* {{setupTime}}
🚗 *Llegada músicos:* {{arrivalTime}}
👔 *Vestimenta:* {{dressCode}}
📝 *Notas:* {{notes}}

🔗 *Confirma tu asistencia aquí:*
{{confirmLink}}`;

const templateData = {
  eventName,
  date: gigDetails.date,
  ceremony: "💒 Boda",
  location: gigDetails.locationName || gigDetails.address || "Por confirmar",
  mapsLink: gigDetails.mapsLink ? gigDetails.mapsLink : "(no registrado)",
  setupTime: gigDetails.setupTime || gigDetails.performanceStart || "Por definir",
  arrivalTime: gigDetails.arrivalTime || gigDetails.performanceStart || "Por definir",
  dressCode: "🎩 Formal",
  notes: gigDetails.musicianNotes || "Ninguna",
  confirmLink: "http://localhost:3000/confirmar/qa-other-123/test-event-qa-123",
  fullName: eventName,
  time: gigDetails.performanceStart || gigDetails.setupTime || "Por definir"
};

const message = parseTemplate(template, templateData);
console.log("=== GENERATED MUSICIAN GIG MESSAGE ===");
console.log(message);
