import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculateQuoteTotals } from "./pricing"

describe("Validaciones de Negocio CRM (crm.test.ts)", () => {
  it("debe evitar montos negativos en subtotal cuando el descuento es mayor al precio base", () => {
    const result = calculateQuoteTotals({
      basePrice: 5000,
      discountAmount: 8000,
      viaticosAmount: 0
    })

    assert.equal(result.subtotal, 0)
    assert.equal(result.totalAmount, 0)
    assert.equal(result.balanceAmount, 0)
  })

  it("debe sumar viáticos y adicionales correctamente al subtotal", () => {
    const result = calculateQuoteTotals({
      basePrice: 12000,
      viaticosAmount: 2500,
      additionalItems: [
        { description: "Luces arquitectónicas", quantity: 1, unitCost: 3500 },
        { description: "Hora extra", quantity: 2, unitCost: 4000 }
      ],
      discountAmount: 1500,
      invoice: false
    })

    // Adicionales: 3500 + 8000 = 11500
    // Subtotal: 12000 + 2500 + 11500 - 1500 = 24500
    assert.equal(result.additionalItemsTotal, 11500)
    assert.equal(result.subtotal, 24500)
    assert.equal(result.totalAmount, 24500)
  })

  it("debe calcular el saldo remanente con anticipo parcial", () => {
    const result = calculateQuoteTotals({
      basePrice: 30000,
      depositAmount: 10000,
      invoice: false
    })

    assert.equal(result.totalAmount, 30000)
    assert.equal(result.depositAmount, 10000)
    assert.equal(result.balanceAmount, 20000)
    assert.equal(result.isFullyPaid, false)
  })

  it("debe marcar isFullyPaid cuando el anticipo cubre el 100% del total", () => {
    const result = calculateQuoteTotals({
      basePrice: 20000,
      depositAmount: 20000
    })

    assert.equal(result.balanceAmount, 0)
    assert.equal(result.isFullyPaid, true)
  })
})
