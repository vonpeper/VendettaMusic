import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { parseInquiryDetails, normalizeTimeTo24h, addMinutesToTime, mapCeremonyType } from "./inquiry-parser"

describe("Parser de Prospectos (inquiry-parser.ts)", () => {
  it("debe normalizar correctamente horas en formato 12h y 24h", () => {
    assert.strictEqual(normalizeTimeTo24h("02:00 PM"), "14:00")
    assert.strictEqual(normalizeTimeTo24h("2:00pm"), "14:00")
    assert.strictEqual(normalizeTimeTo24h("10:30 AM"), "10:30")
    assert.strictEqual(normalizeTimeTo24h("12:00 PM"), "12:00")
    assert.strictEqual(normalizeTimeTo24h("12:00 AM"), "00:00")
    assert.strictEqual(normalizeTimeTo24h("20:00"), "20:00")
    assert.strictEqual(normalizeTimeTo24h("08:15"), "08:15")
  })

  it("debe calcular sumas y restas de tiempo seguras", () => {
    assert.strictEqual(addMinutesToTime("20:00", 120), "22:00")
    assert.strictEqual(addMinutesToTime("20:00", -90), "18:30")
    assert.strictEqual(addMinutesToTime("20:00", -120), "18:00")
    assert.strictEqual(addMinutesToTime("23:30", 90), "01:00")
  })

  it("debe mapear tipos de ceremonia de manera canónica", () => {
    assert.strictEqual(mapCeremonyType("Cumpleaños - Paquete: Essential"), "cumpleanos")
    assert.strictEqual(mapCeremonyType("Boda (Producción especial)"), "boda")
    assert.strictEqual(mapCeremonyType("XV Años"), "xv_anos")
    assert.strictEqual(mapCeremonyType("Corporativo / Fin de Año"), "corporativo")
    assert.strictEqual(mapCeremonyType("Bar / Restaurante"), "bar")
  })

  it("caso real 1: Lead de Karla González (modal de paquete Essential con correo fallback)", () => {
    const parsed = parseInquiryDetails({
      name: "Karla gonzalez",
      phone: "5538908676",
      email: "contacto@vendetta.mx",
      eventType: "Cumpleaños - Paquete: Essential",
      message: "Hora: 20:00 | Invitados: 70 | Ubicación: Huixquilucan de degollado",
      defaultDurationHours: 2,
    })

    assert.strictEqual(parsed.cleanEmail, "", "No debe asignar el correo de Vendetta al cliente")
    assert.strictEqual(parsed.ceremonyType, "cumpleanos")
    assert.strictEqual(parsed.customName, "Cumpleaños - Karla gonzalez")
    assert.strictEqual(parsed.packageKeyword, "Essential")
    assert.strictEqual(parsed.startTime, "20:00")
    assert.strictEqual(parsed.endTime, "22:00")
    assert.strictEqual(parsed.arrivalTime, "18:30")
    assert.strictEqual(parsed.setupTime, "18:00")
    assert.strictEqual(parsed.guestCount, 70)
    assert.strictEqual(parsed.city, "Huixquilucan de degollado")
    assert.strictEqual(parsed.venueName, "", "No debe inventar venue si solo era municipio")
  })

  it("caso real 2: Lead de Isac De Anda (cumpleaños con temática rock)", () => {
    const parsed = parseInquiryDetails({
      name: "Isac De Anda",
      phone: "7226472843",
      email: "isac_deanda@outlook.com",
      eventType: "Cumpleaños - Paquete: Essential",
      message: "Hora: 22:00 | Invitados: 75 | Ubicación: Toluca | Notas: Temática de rock en español y Ska",
      defaultDurationHours: 2,
    })

    assert.strictEqual(parsed.cleanEmail, "isac_deanda@outlook.com")
    assert.strictEqual(parsed.ceremonyType, "cumpleanos")
    assert.strictEqual(parsed.packageKeyword, "Essential")
    assert.strictEqual(parsed.startTime, "22:00")
    assert.strictEqual(parsed.endTime, "00:00")
    assert.strictEqual(parsed.guestCount, 75)
    assert.strictEqual(parsed.city, "Toluca")
    assert.strictEqual(parsed.venueName, "", "No debe asignar Toluca como nombre de salón/venue")
    assert.strictEqual(parsed.notes, "Temática de rock en español y Ska")
  })

  it("caso real 3: Cotización avanzada con rango 12h, venue entre paréntesis, maps y viáticos", () => {
    const parsed = parseInquiryDetails({
      name: "Miguel Ángel Chimal Cisneros",
      phone: "+52 1 55 3607 6037",
      email: "cliente_5215536076037@cotizacion.vendetta.mx",
      eventType: "Corporativo / Fin de Año (Producción especial)",
      message: "Horario: 02:00 PM a 03:30 PM (1.5 Horas) | Invitados: 150 | Ubicación: Tlalnepantla de Baz, Estado de México (Estevez Jor.Servicos) | Maps: https://www.google.com/maps/place/Estevez | Motivo revisión: Aforo > 100 (150 personas) | Viáticos: $1600 MXN",
    })

    assert.strictEqual(parsed.cleanEmail, "", "Debe limpiar el correo dummy de cotización")
    assert.strictEqual(parsed.ceremonyType, "corporativo")
    assert.strictEqual(parsed.startTime, "14:00")
    assert.strictEqual(parsed.endTime, "15:30")
    assert.strictEqual(parsed.guestCount, 150)
    assert.strictEqual(parsed.venueName, "Estevez Jor.Servicos")
    assert.strictEqual(parsed.city, "Tlalnepantla de Baz")
    assert.strictEqual(parsed.state, "Estado de México")
    assert.strictEqual(parsed.mapsLink, "https://www.google.com/maps/place/Estevez")
    assert.strictEqual(parsed.viaticosAmount, 1600)
  })

  it("caso 4: Formulario estructurado con dropdown de Estado y Municipio y Maps pendiente", () => {
    const parsed = parseInquiryDetails({
      name: "Ana Lucía Mora",
      phone: "7221234567",
      email: "ana@ejemplo.com",
      eventType: "Boda - Paquete: Experience",
      message: "Hora: 19:00 | Invitados: 120 | Ubicación: Metepec, Estado de México | Maps: Pendiente por confirmar | Notas: Requiere iluminación especial",
    })

    assert.strictEqual(parsed.cleanEmail, "ana@ejemplo.com")
    assert.strictEqual(parsed.ceremonyType, "boda")
    assert.strictEqual(parsed.packageKeyword, "Experience")
    assert.strictEqual(parsed.city, "Metepec")
    assert.strictEqual(parsed.state, "Estado de México")
    assert.strictEqual(parsed.venueName, "", "No debe inventar venue cuando solo se seleccionó estado y municipio")
    assert.strictEqual(parsed.mapsLink, null, "No debe asignar 'Pendiente por confirmar' como link url de Maps")
    assert.strictEqual(parsed.guestCount, 120)
    assert.strictEqual(parsed.notes, "Requiere iluminación especial")
  })
})
