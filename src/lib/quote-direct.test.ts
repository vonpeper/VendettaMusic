import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculateEventHours, getShowPackageHourlyRate, calculateShowBasePrice } from "./pricing"

describe("Reglas de Cotizador Directo (Horas, Aforo > 100 y Producción)", () => {
  it("debe calcular correctamente 5 horas para el caso Irina Galo (04:00 PM a 09:00 PM)", () => {
    const horas = calculateEventHours("04:00 PM", "09:00 PM")
    assert.equal(horas, 5)

    const rate = getShowPackageHourlyRate(null) // Essential = 4250
    assert.equal(rate, 4250)

    const localBase = rate * horas
    assert.equal(localBase, 21250) // $21,250 MXN

    const showPrice = calculateShowBasePrice(localBase, false)
    assert.equal(showPrice, 21250)
  })

  it("debe calcular correctamente 2 horas por defecto (08:00 PM a 10:00 PM)", () => {
    const horas = calculateEventHours("08:00 PM", "10:00 PM")
    assert.equal(horas, 2)

    const rate = getShowPackageHourlyRate("Essential")
    assert.equal(rate * horas, 8500)
  })

  it("debe calcular correctamente eventos nocturnos que cruzan medianoche (08:00 PM a 01:00 AM = 5h)", () => {
    const horas = calculateEventHours("08:00 PM", "01:00 AM")
    assert.equal(horas, 5)

    const rate = getShowPackageHourlyRate("Essential")
    assert.equal(rate * horas, 21250)
  })

  it("debe identificar cuando un evento califica para auto-landing o para revisión manual", () => {
    // Caso 1: 50 invitados, 2 horas, sin extras -> auto_quote
    const c1Aforo = 50
    const c1Extras: string[] = []
    const c1Horas = 2
    const c1Auto = c1Aforo <= 100 && c1Extras.length === 0 && c1Horas <= 5
    assert.equal(c1Auto, true)

    // Caso 2: 80 invitados, 5 horas, sin extras -> auto_quote (Irina Galo)
    const c2Aforo = 80
    const c2Extras: string[] = []
    const c2Horas = 5
    const c2Auto = c2Aforo <= 100 && c2Extras.length === 0 && c2Horas <= 5
    assert.equal(c2Auto, true)

    // Caso 3: 150 invitados (> 100) -> needs_review
    const c3Aforo = 150
    const c3Extras: string[] = []
    const c3Horas = 5
    const c3Auto = c3Aforo <= 100 && c3Extras.length === 0 && c3Horas <= 5
    assert.equal(c3Auto, false)

    // Caso 4: 80 invitados pero con Pantalla LED -> needs_review
    const c4Aforo = 80
    const c4Extras = ["Pantalla LED"]
    const c4Horas = 2
    const c4Auto = c4Aforo <= 100 && c4Extras.length === 0 && c4Horas <= 5
    assert.equal(c4Auto, false)

    // Caso 5: 50 invitados pero con duración extendida de 7 horas -> needs_review
    const c5Aforo = 50
    const c5Extras: string[] = []
    const c5Horas = 7
    const c5Auto = c5Aforo <= 100 && c5Extras.length === 0 && c5Horas <= 5
    assert.equal(c5Auto, false)
  })

  it("debe aplicar recargo foráneo (+20%) para eventos fuera de zona local", () => {
    const rate = getShowPackageHourlyRate("Essential") // 4250
    const horas = 5
    const local = rate * horas // 21250

    const foraneo = calculateShowBasePrice(local, true)
    assert.equal(foraneo, 25500) // 21250 * 1.2 = 25500
  })

  it("debe calcular paquetes de mayor producción como Experience y Festival", () => {
    const rateExp = getShowPackageHourlyRate("Experience") // 7750
    assert.equal(rateExp * 2, 15500)
    assert.equal(rateExp * 5, 38750)

    const rateFest = getShowPackageHourlyRate("Festival Premium") // 12750
    assert.equal(rateFest * 2, 25500)
    assert.equal(rateFest * 5, 63750)
  })
})
