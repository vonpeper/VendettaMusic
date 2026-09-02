import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculateQuoteTotals, roundCurrency, formatCurrencyMXN } from "./pricing"

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
    assert.equal(roundCurrency(123.456), 123.46)
    assert.equal(roundCurrency(123.454), 123.45)
  })
})
