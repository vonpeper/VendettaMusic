import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { generateSecureShortId, isValidShortIdFormat, generateUniqueShortId } from "./folios"

describe("Generación y Validación de Folios Criptográficos (folios.ts)", () => {
  it("debe generar un ID en formato canónico oficial VND-XXXX (4 caracteres hexadecimales)", () => {
    const id = generateSecureShortId()
    
    // Formato exacto VND-XXXX
    assert.match(id, /^VND-[0-9A-F]{4}$/)
    
    // Caracteres hexadecimales en mayúsculas
    const hexPart = id.replace("VND-", "")
    assert.equal(hexPart.length, 4)
    assert.match(hexPart, /^[0-9A-F]{4}$/)
  })

  it("debe generar IDs válidos con alta entropía y aleatoriedad", () => {
    const set = new Set<string>()
    for (let i = 0; i < 500; i++) {
      const id = generateSecureShortId()
      assert.match(id, /^VND-[0-9A-F]{4}$/)
      set.add(id)
    }
    // En 500 muestras de 65,536 combinaciones, la inmensa mayoría deben ser únicos
    assert.ok(set.size > 480, `Esperado > 480 IDs únicos, obtenido ${set.size}`)
  })

  it("debe validar correctamente folios con el formato oficial y con versiones", () => {
    assert.equal(isValidShortIdFormat("VND-4A2B"), true)
    assert.equal(isValidShortIdFormat("vnd-4a2b"), true) // Case insensitive
    assert.equal(isValidShortIdFormat("VND-5F39"), true)
    assert.equal(isValidShortIdFormat("VND-A7FA-V2"), true)
    assert.equal(isValidShortIdFormat("VND-MBBC-EENW-QSRR-NTE1"), true) // Retrocompatibilidad con anteriores
  })

  it("debe mantener retrocompatibilidad con folios anteriores y versiones históricas", () => {
    assert.equal(isValidShortIdFormat("VND-A1B2"), true)
    assert.equal(isValidShortIdFormat("VND-E4F8"), true)
    assert.equal(isValidShortIdFormat("VND-A1B2-V2"), true) // Versión de cotización histórica
    assert.equal(isValidShortIdFormat("550e8400-e29b-41d4-a716-446655440000"), true) // UUID directo
  })

  it("debe rechazar IDs malformados o con inyecciones", () => {
    assert.equal(isValidShortIdFormat(""), false)
    assert.equal(isValidShortIdFormat(null), false)
    assert.equal(isValidShortIdFormat(undefined), false)
    assert.equal(isValidShortIdFormat("VND-"), false)
    assert.equal(isValidShortIdFormat("VND-123"), false) // Demasiado corto
    assert.equal(isValidShortIdFormat("VND-INVALID-CHARACTER-!!"), false)
    assert.equal(isValidShortIdFormat("VND-1234'; DROP TABLE booking_requests;--"), false)
    assert.equal(isValidShortIdFormat("<script>alert(1)</script>"), false)
  })

  it("debe reintentar de forma segura en caso de colisión simulada", async () => {
    let callCount = 0
    const mockTx = {
      bookingRequest: {
        findUnique: async () => {
          callCount++
          // Simular 2 colisiones antes de encontrar un ID libre
          if (callCount <= 2) {
            return { id: "existing-id" }
          }
          return null
        }
      }
    }

    const uniqueId = await generateUniqueShortId(mockTx as unknown as Parameters<typeof generateUniqueShortId>[0], 5)
    assert.ok(uniqueId)
    assert.equal(callCount, 3) // Reintentó y encontró libre al 3er intento
  })

  it("debe aplicar rate limiting en memoria para proteger consultas públicas contra fuerza bruta", async () => {
    const { checkRateLimit } = await import("./rate-limit")
    const testIp = "192.168.1.100"

    // Consumir hasta el límite
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testIp, 5, 1000)
      assert.equal(res.allowed, true)
    }

    // El 6to intento en la misma ventana debe ser bloqueado
    const blocked = checkRateLimit(testIp, 5, 1000)
    assert.equal(blocked.allowed, false)
    assert.equal(blocked.remaining, 0)
  })
})
