import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { calculateEventHours, calculateShowPackageBasePrice, calculateShowBasePrice } from "./pricing"

describe("Reglas de Cotizador Directo (Horas, Aforo > 100 y Producción)", () => {
  it("debe calcular correctamente 5 horas con la curva oficial ($8,500 + $5,000/hr adicional = $23,500)", () => {
    const horas = calculateEventHours("04:00 PM", "09:00 PM")
    assert.equal(horas, 5)

    const localBase = calculateShowPackageBasePrice(null, horas) // Essential 5h
    assert.equal(localBase, 23500) // $8,500 + 3 * $5,000 = $23,500 MXN

    const showPrice = calculateShowBasePrice(localBase, false)
    assert.equal(showPrice, 23500)
  })

  it("debe calcular correctamente 2 horas por defecto ($8,500 MXN)", () => {
    const horas = calculateEventHours("08:00 PM", "10:00 PM")
    assert.equal(horas, 2)

    const localBase = calculateShowPackageBasePrice("Essential", horas)
    assert.equal(localBase, 8500)
  })

  it("debe calcular correctamente eventos nocturnos que cruzan medianoche (08:00 PM a 01:00 AM = 5h -> $23,500)", () => {
    const horas = calculateEventHours("08:00 PM", "01:00 AM")
    assert.equal(horas, 5)

    const localBase = calculateShowPackageBasePrice("Essential", horas)
    assert.equal(localBase, 23500)
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
    const horas = 5
    const local = calculateShowPackageBasePrice("Essential", horas) // 23500

    const foraneo = calculateShowBasePrice(local, true)
    assert.equal(foraneo, 28200) // 23500 * 1.2 = 28200
  })

  it("debe calcular paquetes de mayor producción como Experience y Festival", () => {
    assert.equal(calculateShowPackageBasePrice("Experience", 2), 15500)
    assert.equal(calculateShowPackageBasePrice("Experience", 5), 38750)

    assert.equal(calculateShowPackageBasePrice("Festival Premium", 2), 25500)
    assert.equal(calculateShowPackageBasePrice("Festival Premium", 5), 63750)
  })
})
