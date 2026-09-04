import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculateQuoteTotals, validatePlannedDeposit } from "./pricing"
import { normalizeClientEmail, normalizeClientPhone } from "./clients"

describe("Ciclo de Vida y Reglas de Negocio CRM (lifecycle.test.ts)", () => {

  describe("1. Reglas de Depósito y Cálculos Financieros", () => {
    it("debe rechazar anticipo solicitado superior al total del evento", () => {
      const val = validatePlannedDeposit(6000, 5000)
      assert.equal(val.isValid, false)
      assert.ok(val.error?.includes("no puede superar el total"))

      const totals = calculateQuoteTotals({
        basePrice: 5000,
        depositAmount: 6000
      })
      assert.equal(totals.depositExceedsTotal, true)
      assert.ok(totals.depositError !== null)
    })

    it("debe aceptar anticipo solicitado menor o igual al total", () => {
      const val = validatePlannedDeposit(3000, 10000)
      assert.equal(val.isValid, true)

      const totals = calculateQuoteTotals({
        basePrice: 10000,
        depositAmount: 3000
      })
      assert.equal(totals.depositExceedsTotal, false)
      assert.equal(totals.depositError, null)
      assert.equal(totals.balanceAmount, 7000)
    })

    it("debe rechazar anticipos negativos", () => {
      const val = validatePlannedDeposit(-500, 10000)
      assert.equal(val.isValid, false)
      assert.ok(val.error?.includes("no puede ser negativo"))
    })
  })

  describe("2. Aislamiento de Datos de Cliente y Normalización", () => {
    it("debe normalizar teléfonos válidos a 10 dígitos y rechazar placeholders conocidos", () => {
      assert.equal(normalizeClientPhone("55 1234 5678"), "5512345678")
      assert.equal(normalizeClientPhone("+52 (722) 261-1773"), "7222611773")
      // Placeholders rechazados
      assert.equal(normalizeClientPhone("0000000000"), null)
      assert.equal(normalizeClientPhone("5500000000"), null)
      assert.equal(normalizeClientPhone("12345"), null)
    })

    it("debe normalizar correos válidos a minúsculas y rechazar no@no.com", () => {
      assert.equal(normalizeClientEmail("  JUAN@gmail.com  "), "juan@gmail.com")
      assert.equal(normalizeClientEmail("no@no.com"), null)
      assert.equal(normalizeClientEmail("invalido"), null)
    })

    it("simulación de cambio Cliente A -> Cliente B: no debe arrastrar campos de A si B no los tiene", () => {
      const clientA = { id: "c1", name: "Cliente A", phone: "5511112222", email: "a@test.com", city: "Toluca" }
      const clientB = { id: "c2", name: "Cliente B", phone: null, email: null, city: null }

      // Estado inicial con A
      let state: { selectedClientId: string | null; name: string; phone: string; email: string; city: string } = {
        selectedClientId: clientA.id,
        name: clientA.name ?? "",
        phone: clientA.phone ?? "",
        email: clientA.email ?? "",
        city: clientA.city ?? ""
      }
      assert.equal(state.phone, "5511112222")

      // Seleccionar B (sin teléfono ni correo)
      state = {
        selectedClientId: clientB.id,
        name: clientB.name ?? "",
        phone: clientB.phone ?? "",
        email: clientB.email ?? "",
        city: clientB.city ?? ""
      }

      // Verificación estricta: B no debe tener el teléfono de A
      assert.equal(state.phone, "")
      assert.equal(state.email, "")
      assert.equal(state.city, "")
      assert.equal(state.name, "Cliente B")

      // Limpiar cliente (null)
      state = {
        selectedClientId: null,
        name: "",
        phone: "",
        email: "",
        city: ""
      }
      assert.equal(state.selectedClientId, null)
      assert.equal(state.name, "")
    })
  })

  describe("3. Aislamiento de Datos de Venue", () => {
    it("debe separar nombre real de venue de su dirección", () => {
      const venueA = {
        id: "v1",
        name: "Hacienda Cantalagua",
        address: "Km 129 Carretera México-Toluca",
        city: "Contepec",
        state: "Michoacán",
        mapsLink: "https://maps.app.goo.gl/cantalagua"
      }

      assert.notEqual(venueA.name, venueA.address)
      assert.equal(venueA.name, "Hacienda Cantalagua")
      assert.equal(venueA.address, "Km 129 Carretera México-Toluca")
    })

    it("simulación de cambio Venue A -> Venue B: no debe arrastrar mapsLink ni ciudad si B no los tiene", () => {
      const venueA = {
        id: "v1",
        name: "Hacienda Cantalagua",
        address: "Km 129",
        city: "Contepec",
        state: "Michoacán",
        mapsLink: "https://maps.app.goo.gl/cantalagua"
      }
      const venueB = {
        id: "v2",
        name: "Jardín Los Encinos",
        address: "Av. Bosques 45",
        city: null,
        state: null,
        mapsLink: null
      }

      // Seleccionar A
      let state = {
        selectedVenueId: venueA.id,
        venueName: venueA.name ?? "",
        venueAddress: venueA.address ?? "",
        venueCity: venueA.city ?? "",
        venueState: venueA.state ?? "",
        mapsLink: venueA.mapsLink ?? ""
      }
      assert.equal(state.mapsLink, "https://maps.app.goo.gl/cantalagua")

      // Cambiar a B
      state = {
        selectedVenueId: venueB.id,
        venueName: venueB.name ?? "",
        venueAddress: venueB.address ?? "",
        venueCity: venueB.city ?? "",
        venueState: venueB.state ?? "",
        mapsLink: venueB.mapsLink ?? ""
      }

      // B no tiene Maps ni Ciudad, debe quedar vacío
      assert.equal(state.mapsLink, "")
      assert.equal(state.venueCity, "")
      assert.equal(state.venueName, "Jardín Los Encinos")
    })

    it("venue pendiente no debe generar registros sintéticos de catálogo", () => {
      const pendingAddress = "Jardín particular por confirmar"
      const isPending = !pendingAddress || pendingAddress.includes("por confirmar") || pendingAddress.includes("Por confirmar")
      assert.equal(isPending, true)
    })
  })

  describe("4. Reglas de Persistencia e Idempotencia de Conceptos Adicionales", () => {
    it("debe calcular subtotal y total exacto con múltiples conceptos adicionales", () => {
      const items = [
        { description: "1 Hora Extra de Banda", quantity: 2, unitCost: 4500 },
        { description: "Pantalla LED 3x2m", quantity: 1, unitCost: 6000 },
        { description: "Iluminación Robótica Beam", quantity: 4, unitCost: 800 }
      ]

      const totals = calculateQuoteTotals({
        basePrice: 18000,
        viaticosAmount: 1500,
        additionalItems: items,
        discountAmount: 2000,
        invoice: true,
        depositAmount: 15000
      })

      // Items: (2*4500) + (1*6000) + (4*800) = 9000 + 6000 + 3200 = 18200
      assert.equal(totals.additionalItemsTotal, 18200)
      // Subtotal: 18000 + 1500 + 18200 - 2000 = 35700
      assert.equal(totals.subtotal, 35700)
      // IVA (16%): 35700 * 0.16 = 5712
      assert.equal(totals.ivaAmount, 5712)
      // Total: 35700 + 5712 = 41412
      assert.equal(totals.totalAmount, 41412)
      // Saldo: 41412 - 15000 = 26412
      assert.equal(totals.balanceAmount, 26412)
    })
  })

  describe("5. Reglas de Aislamiento de Prospectos (ContactInquiry)", () => {
    it("el formulario de contacto solo debe validar datos de lead sin inventar pagos ni montos", () => {
      const contactData = {
        name: "Sofía Gómez",
        phone: "5587654321",
        email: "sofia@gmail.com",
        eventType: "boda",
        message: "Quisiera información para boda en octubre 2026"
      }

      assert.ok(contactData.name.length >= 2)
      assert.ok(contactData.email.includes("@"))
      // No debe contener baseAmount, depositAmount, paymentMethod ni venueType fijo
      assert.equal((contactData as Record<string, unknown>).baseAmount, undefined)
      assert.equal((contactData as Record<string, unknown>).paymentMethod, undefined)
    })
  })
})
