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

  it("debe redondear viáticos estrictamente en múltiplos superiores de $100 (Opción A)", () => {
    const { roundTo100, roundTo500 } = require("./viaticos/googleMaps")
    // Casos reales aprobados por el usuario
    assert.equal(roundTo100(1467), 1500)
    assert.equal(roundTo100(1965), 2000)
    assert.equal(roundTo100(2007), 2100) // Caso Imelda Subiaur: $2,007 redondeado a $2,100
    assert.equal(roundTo100(3180), 3200) // Caso Querétaro: $3,180 redondeado a $3,200
    assert.equal(roundTo100(1654), 1700)
    assert.equal(roundTo100(0), 0)
    assert.equal(roundTo100(100), 100)
    assert.equal(roundTo100(101), 200)
    assert.equal(roundTo100(2000), 2000)

    // Alias retrocompatible roundTo500 debe ejecutar la misma lógica de roundTo100
    assert.equal(roundTo500(2007), 2100)
  })

  it("debe aplicar regla de costo base show local ($8,500) y foráneo (+20% -> $10,200)", () => {
    const { calculateShowBasePrice } = require("./pricing")
    const { isLocalCity } = require("./viaticos")

    // Validación de zona local
    assert.equal(isLocalCity("Metepec"), true)
    assert.equal(isLocalCity("Toluca"), true)
    assert.equal(isLocalCity("San Mateo Atenco"), true)
    assert.equal(isLocalCity("Querétaro"), false)
    assert.equal(isLocalCity("Ciudad de México"), false)
    assert.equal(isLocalCity("Iztapalapa"), false)

    // Essential base 2 horas = $8,500 MXN
    const essentialLocal = 8500
    assert.equal(calculateShowBasePrice(essentialLocal, false), 8500)

    // Foráneo: sube 20% (8,500 * 1.20 = 10,200 MXN)
    assert.equal(calculateShowBasePrice(essentialLocal, true), 10200)

    // Otro paquete (ej. $15,000)
    assert.equal(calculateShowBasePrice(15000, true), 18000)
  })
})
