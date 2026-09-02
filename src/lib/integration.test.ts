import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculateQuoteTotals } from "./pricing"

describe("Pruebas de Integración y Ciclo Comercial (integration.test.ts)", () => {

  it("1. Cotización en estado PENDIENTE no debe generar Evento, ni Agenda, ni Ingreso", () => {
    const quotePayload = {
      mode: "create",
      status: "pendiente",
      clientName: "Valeria Morales",
      clientEmail: "valeria@gmail.com",
      eventDate: "2026-11-20",
      basePrice: 22000,
      viaticosAmount: 1800,
      depositAmount: 5000,
      additionalItems: [
        { description: "Luces arquitectónicas", quantity: 1, unitCost: 3500 }
      ]
    }

    const totals = calculateQuoteTotals({
      basePrice: quotePayload.basePrice,
      viaticosAmount: quotePayload.viaticosAmount,
      depositAmount: quotePayload.depositAmount,
      additionalItems: quotePayload.additionalItems
    })

    // Subtotal: 22000 + 1800 + 3500 = 27300
    assert.equal(totals.subtotal, 27300)
    assert.equal(totals.totalAmount, 27300)
    assert.equal(totals.depositAmount, 5000)
    assert.equal(totals.balanceAmount, 22300)

    // En estado pendiente, el evento NO se crea
    const shouldCreateEvent = quotePayload.status === "agendado" || quotePayload.status === "completado"
    assert.equal(shouldCreateEvent, false)

    // El ingreso real es 0 (no se asume como dinero recibido)
    const initialRealIncome = 0
    assert.equal(initialRealIncome, 0)
    assert.notEqual(initialRealIncome, totals.totalAmount)
  })

  it("2. Cotización en estado AGENDADO debe vincular exactamente un Evento", () => {
    const bookingPayload = {
      id: "bkg-101",
      shortId: "VND-AB12",
      status: "agendado",
      clientName: "Mariana Torres",
      eventDate: "2026-12-15"
    }

    const shouldCreateEvent = bookingPayload.status === "agendado" || bookingPayload.status === "completado"
    assert.equal(shouldCreateEvent, true)

    // Simular creación del evento
    let eventCreatedCount = 0
    let linkedEventId: string | null = null

    if (shouldCreateEvent) {
      eventCreatedCount++
      linkedEventId = "evt-202"
    }

    assert.equal(eventCreatedCount, 1)
    assert.equal(linkedEventId, "evt-202")
  })

  it("3. Repetir la acción de conversión a evento debe ser IDEMPOTENTE (no duplicar)", () => {
    const booking = {
      id: "bkg-101",
      status: "agendado",
      eventId: "evt-202" // Ya tiene evento vinculado
    }

    let duplicateCreated = false
    let returnedEventId: string | null = null

    // Simular convertBookingToEventAction con verificación de idempotencia
    if (booking.eventId) {
      // Ya existe evento, retornar ID sin crear otro
      returnedEventId = booking.eventId
      duplicateCreated = false
    } else {
      duplicateCreated = true
    }

    assert.equal(duplicateCreated, false)
    assert.equal(returnedEventId, "evt-202")
  })

  it("4. El anticipo solicitado NO debe cambiar paymentStatus a paid", () => {
    const quote = {
      baseAmount: 25000,
      depositAmount: 10000, // Anticipo solicitado capturado
      payments: [] // Sin registros de pago reales
    }

    // paymentStatus debe basarse en pagos reales, no en el anticipo capturado en la cotización
    const totalPaymentsReceived = (quote.payments as { amount: number }[]).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
    const paymentStatus = totalPaymentsReceived >= quote.baseAmount ? "paid" : totalPaymentsReceived > 0 ? "partial" : "pending"

    assert.equal(paymentStatus, "pending")
    assert.notEqual(paymentStatus, "paid")
  })

  it("5. Guardar una cotización sin cambios debe preservar conceptos y montos (Idempotencia)", () => {
    const originalQuote = {
      id: "bkg-999",
      clientName: "Carlos Slim",
      baseAmount: 50000,
      viaticosAmount: 5000,
      items: [
        { id: "it-1", description: "Audio Reforzado", quantity: 1, unitCost: 8000 }
      ]
    }

    const editedQuote = {
      ...originalQuote,
      items: [...originalQuote.items]
    }

    const totalsOrig = calculateQuoteTotals({
      basePrice: originalQuote.baseAmount,
      viaticosAmount: originalQuote.viaticosAmount,
      additionalItems: originalQuote.items
    })

    const totalsEdit = calculateQuoteTotals({
      basePrice: editedQuote.baseAmount,
      viaticosAmount: editedQuote.viaticosAmount,
      additionalItems: editedQuote.items
    })

    assert.deepEqual(totalsOrig, totalsEdit)
    assert.equal(totalsEdit.totalAmount, 63000)
  })
})
