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

  it("debe identificar cuando un evento califica para auto-landing o para prospecto/revisión", () => {
    // Caso 1: 50 invitados, 2 horas, sin extras -> auto_quote
    const c1Aforo = 50
    const c1Extras: string[] = []
    const c1Horas = 2
    const c1Auto = c1Aforo <= 120 && c1Extras.length === 0 && c1Horas <= 5
    assert.equal(c1Auto, true)

    // Caso 2: 120 invitados (límite máximo auto-quote), 5 horas, sin extras -> auto_quote
    const c2Aforo = 120
    const c2Extras: string[] = []
    const c2Horas = 5
    const c2Auto = c2Aforo <= 120 && c2Extras.length === 0 && c2Horas <= 5
    assert.equal(c2Auto, true)

    // Caso 3: 121 invitados (> 120) -> NO cotización (se captura como prospecto para agendar llamada)
    const c3Aforo = 121
    const c3Extras: string[] = []
    const c3Horas = 3
    const c3Auto = c3Aforo <= 120 && c3Extras.length === 0 && c3Horas <= 5
    const c3RequiereLlamada = c3Aforo > 120
    assert.equal(c3Auto, false)
    assert.equal(c3RequiereLlamada, true)

    // Caso 4: 150 invitados (> 120) -> NO cotización
    const c4Aforo = 150
    const c4Extras: string[] = []
    const c4Horas = 5
    const c4Auto = c4Aforo <= 120 && c4Extras.length === 0 && c4Horas <= 5
    const c4RequiereLlamada = c4Aforo > 120
    assert.equal(c4Auto, false)
    assert.equal(c4RequiereLlamada, true)

    // Caso 5: 80 invitados pero con Pantalla LED -> needs_review (≤120 pero con extras)
    const c5Aforo = 80
    const c5Extras = ["Pantalla LED"]
    const c5Horas = 2
    const c5Auto = c5Aforo <= 120 && c5Extras.length === 0 && c5Horas <= 5
    assert.equal(c5Auto, false)

    // Caso 6: 50 invitados pero con duración extendida de 7 horas -> needs_review (≤120 pero >5h)
    const c6Aforo = 50
    const c6Extras: string[] = []
    const c6Horas = 7
    const c6Auto = c6Aforo <= 120 && c6Extras.length === 0 && c6Horas <= 5
    assert.equal(c6Auto, false)
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
