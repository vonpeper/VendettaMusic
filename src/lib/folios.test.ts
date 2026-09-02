import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { generateSecureShortId, isValidShortIdFormat, generateUniqueShortId } from "./folios"

describe("Generación y Validación de Folios Criptográficos (folios.ts)", () => {
  it("debe generar un ID con 80 bits de entropía en formato VND-XXXX-XXXX-XXXX-XXXX", () => {
    const id = generateSecureShortId()
    
    // Formato exacto
    assert.match(id, /^VND-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}-[0-9A-HJKMNP-Z]{4}$/)
    
    // Caracteres Crockford Base32 (16 caracteres = 80 bits)
    const rawChars = id.replace(/VND-|-/g, "")
    assert.equal(rawChars.length, 16)
    
    // No debe contener caracteres ambiguos (I, L, O, U)
    assert.equal(/[ILOUilou]/.test(rawChars), false)
  })

  it("debe generar 1,000 IDs únicos sin colisiones estadísticas", () => {
    const set = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      const id = generateSecureShortId()
      assert.equal(set.has(id), false, `Colisión detectada en iteración ${i}`)
      set.add(id)
    }
    assert.equal(set.size, 1000)
  })

  it("debe validar correctamente folios con el nuevo formato seguro", () => {
    assert.equal(isValidShortIdFormat("VND-7K9M-4X2P-8W3T-9A2C"), true)
    assert.equal(isValidShortIdFormat("vnd-7k9m-4x2p-8w3t-9a2c"), true) // Case insensitive
    assert.equal(isValidShortIdFormat("VND-0000-1111-2222-3333"), true)
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
            return { id: "existing-id" } as any
          }
          return null
        }
      }
    }

    const uniqueId = await generateUniqueShortId(mockTx as any, 5)
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
