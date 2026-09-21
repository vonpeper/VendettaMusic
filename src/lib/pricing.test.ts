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
    const { getShowPackageHourlyRate, calculateShowPackageBasePrice, calculateShowBasePrice } = await import("./pricing")

    // Tarifas horarias referenciales oficiales
    assert.equal(getShowPackageHourlyRate("Essential"), 4250)
    assert.equal(getShowPackageHourlyRate(null), 4250)
    assert.equal(getShowPackageHourlyRate("Experience"), 7750)
    assert.equal(getShowPackageHourlyRate("Festival Premium"), 12750)

    // Curva oficial de precios: Base 2h = $8,500 | Horas adicionales = +$5,000/hr ($1,000/hr x músico)
    assert.equal(calculateShowPackageBasePrice("Essential", 2), 8500)   // 2 horas = $8,500
    assert.equal(calculateShowPackageBasePrice("Essential", 3), 13500)  // 3 horas = $13,500
    assert.equal(calculateShowPackageBasePrice("Essential", 4), 18500)  // 4 horas = $18,500
    assert.equal(calculateShowPackageBasePrice("Essential", 5), 23500)  // 5 horas = $23,500

    // Paquetes Experience y Festival
    assert.equal(calculateShowPackageBasePrice("Experience", 2), 15500)
    assert.equal(calculateShowPackageBasePrice("Experience", 3), 23250)
    assert.equal(calculateShowPackageBasePrice("Festival Premium", 2), 25500)
    assert.equal(calculateShowPackageBasePrice("Festival Premium", 3), 38250)

    // Foráneo (+20%)
    const price5h = calculateShowPackageBasePrice("Essential", 5)
    assert.equal(calculateShowBasePrice(price5h, true), 28200) // 23500 * 1.2 = 28200
    assert.equal(calculateShowBasePrice(8500, true), 10200)   // 8500 * 1.2 = 10200
  })

  it("debe calcular el split de costos y nómina (calculateEventCostBreakdown) para privados y bares", async () => {
    const { calculateEventCostBreakdown } = await import("./pricing")

    // Privado 2 Horas ($8,500): Músicos $1,500 c/u, Staff $600, Vendetta $1,900
    const priv2h = calculateEventCostBreakdown(2, "privado")
    assert.equal(priv2h.totalPrice, 8500)
    assert.equal(priv2h.musicianPayEach, 1500)
    assert.equal(priv2h.musiciansTotal, 6000)
    assert.equal(priv2h.staffPay, 600)
    assert.equal(priv2h.audioAndOfficeProfit, 1900)

    // Privado 3 Horas ($13,500): Músicos $2,500 c/u, Staff $900, Vendetta $2,600
    const priv3h = calculateEventCostBreakdown(3, "privado")
    assert.equal(priv3h.totalPrice, 13500)
    assert.equal(priv3h.musicianPayEach, 2500)
    assert.equal(priv3h.musiciansTotal, 10000)
    assert.equal(priv3h.staffPay, 900)
    assert.equal(priv3h.audioAndOfficeProfit, 2600)

    // Privado 5 Horas ($23,500): Músicos $4,500 c/u, Staff $1,500, Vendetta $4,000
    const priv5h = calculateEventCostBreakdown(5, "privado")
    assert.equal(priv5h.totalPrice, 23500)
    assert.equal(priv5h.musicianPayEach, 4500)
    assert.equal(priv5h.musiciansTotal, 18000)
    assert.equal(priv5h.staffPay, 1500)
    assert.equal(priv5h.audioAndOfficeProfit, 4000)

    // Bar 2 Horas ($3,800): Músicos $850 c/u, Staff $400, Vendetta $0 (0 comisión)
    const bar = calculateEventCostBreakdown(2, "bar")
    assert.equal(bar.totalPrice, 3800)
    assert.equal(bar.staffPay, 400)
    assert.equal(bar.musicianPayEach, 850)
    assert.equal(bar.musiciansTotal, 3400)
    assert.equal(bar.audioAndOfficeProfit, 0)
  })
})

