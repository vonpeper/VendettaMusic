import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculateQuoteTotals, roundCurrency } from "./pricing"

describe("Motor Centralizado de Precios (pricing.ts)", () => {
  it("debe calcular subtotal y total sin adicionales ni factura", () => {
    const result = calculateQuoteTotals({
      basePrice: 15000,
      viaticosAmount: 1200,
      depositAmount: 5000
    })

    assert.equal(result.basePrice, 15000)
    assert.equal(result.viaticosAmount, 1200)
    assert.equal(result.subtotal, 16200)
    assert.equal(result.ivaAmount, 0)
    assert.equal(result.totalAmount, 16200)
    assert.equal(result.depositAmount, 5000)
    assert.equal(result.balanceAmount, 11200)
    assert.equal(result.isFullyPaid, false)
  })

  it("debe calcular IVA del 16% cuando invoice es true", () => {
    const result = calculateQuoteTotals({
      basePrice: 10000,
      viaticosAmount: 0,
      invoice: true,
      depositAmount: 3000
    })

    assert.equal(result.subtotal, 10000)
    assert.equal(result.ivaAmount, 1600)
    assert.equal(result.totalAmount, 11600)
    assert.equal(result.depositAmount, 3000)
    assert.equal(result.balanceAmount, 8600)
  })

  it("debe incluir conceptos adicionales manuales (LineItems)", () => {
    const result = calculateQuoteTotals({
      basePrice: 20000,
      viaticosAmount: 1500,
      additionalItems: [
        { description: "Luces robóticas extra", quantity: 2, unitCost: 1500 },
        { description: "Hora extra DJ", quantity: 1, unitCost: 2000 }
      ],
      discountAmount: 1000,
      invoice: true,
      depositAmount: 10000
    })

    // Adicionales: (2 * 1500) + (1 * 2000) = 5000
    assert.equal(result.additionalItemsTotal, 5000)
    // Subtotal: 20000 + 1500 + 5000 - 1000 = 25500
    assert.equal(result.subtotal, 25500)
    // IVA: 25500 * 0.16 = 4080
    assert.equal(result.ivaAmount, 4080)
    // Total: 25500 + 4080 = 29580
    assert.equal(result.totalAmount, 29580)
    // Saldo: 29580 - 10000 = 19580
    assert.equal(result.balanceAmount, 19580)
  })

  it("debe evitar saldos negativos si el anticipo es igual o superior al total", () => {
    const result = calculateQuoteTotals({
      basePrice: 5000,
      depositAmount: 6000
    })

    assert.equal(result.totalAmount, 5000)
    assert.equal(result.depositAmount, 6000)
    assert.equal(result.balanceAmount, 0)
    assert.equal(result.isFullyPaid, true)
  })

  it("debe manejar valores nulos, indefinidos o vacíos sin producir NaN", () => {
    const result = calculateQuoteTotals({
      basePrice: null,
      viaticosAmount: undefined,
      discountAmount: NaN,
      depositAmount: null
    })

    assert.equal(result.basePrice, 0)
    assert.equal(result.viaticosAmount, 0)
    assert.equal(result.subtotal, 0)
    assert.equal(result.totalAmount, 0)
    assert.equal(result.balanceAmount, 0)
  })

  it("debe redondear correctamente a 2 decimales", () => {
    assert.equal(roundCurrency(10.555), 10.56)
    assert.equal(roundCurrency(10.554), 10.55)
    assert.equal(roundCurrency(null), 0)
    assert.equal(roundCurrency(undefined), 0)
  })

  it("debe calcular correctamente la duración en horas entre horarios 12h y 24h", async () => {
    const { calculateEventHours, parseTimeToMinutes } = await import("./pricing")

    // Formato 12h regular
    assert.equal(parseTimeToMinutes("04:00 PM"), 16 * 60)
    assert.equal(parseTimeToMinutes("09:00 PM"), 21 * 60)
    assert.equal(calculateEventHours("04:00 PM", "09:00 PM"), 5) // Caso Irina Galo

    // Formato medianoche / madrugada
    assert.equal(calculateEventHours("08:00 PM", "01:00 AM"), 5)
    assert.equal(calculateEventHours("08:00 PM", "10:00 PM"), 2) // Estándar 2h

    // Formato 24h
    assert.equal(calculateEventHours("16:00", "21:00"), 5)
    assert.equal(calculateEventHours("20:00", "01:00"), 5)
    assert.equal(calculateEventHours("17:00", "19:00"), 2)

    // Defaults y fallbacks
    assert.equal(calculateEventHours("", ""), 2)
    assert.equal(calculateEventHours(null, null), 2)
  })

  it("debe calcular tarifas horarias y costos base por horas según el paquete", async () => {
    const { getShowPackageHourlyRate, calculateShowBasePrice } = await import("./pricing")

    // Tarifas horarias oficiales
    assert.equal(getShowPackageHourlyRate("Essential"), 4250)
    assert.equal(getShowPackageHourlyRate(null), 4250)
    assert.equal(getShowPackageHourlyRate("Experience"), 7750)
    assert.equal(getShowPackageHourlyRate("Festival Premium"), 12750)

    // Cálculo por horas para Essential
    const rate = getShowPackageHourlyRate("Essential")
    assert.equal(rate * 2, 8500)   // 2 horas = $8,500
    assert.equal(rate * 3, 12750)  // 3 horas = $12,750
    assert.equal(rate * 4, 17000)  // 4 horas = $17,000
    assert.equal(rate * 5, 21250)  // 5 horas = $21,250 (Caso Irina Galo)

    // Foráneo (+20%)
    assert.equal(calculateShowBasePrice(rate * 5, true), 25500)
    assert.equal(calculateShowBasePrice(rate * 2, true), 10200)
  })
})
