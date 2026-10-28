import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { autoExpireInactiveLeads } from "./lead-lifecycle"
import { getWhatsAppClosureUrl } from "@/components/admin/VentasTableClient"

describe("Lead Lifecycle & Expiration Logic (lead_lifecycle.test.ts)", () => {
  it("debe procesar leads expirados por fecha tentativa pasada", async () => {
    let updatedBookingData: any = null
    let updatedBookingIds: string[] = []
    let updatedInquiryIds: string[] = []

    const mockDb = {
      bookingRequest: {
        findMany: async (args: any) => {
          // If searching for past dates
          if (args.where?.requestedDate?.lt) {
            return [
              { id: "bk-past-1", sourceInquiryId: "inq-past-1" },
              { id: "bk-past-2", sourceInquiryId: null }
            ]
          }
          // Inactivity search
          return []
        },
        updateMany: async (args: any) => {
          updatedBookingIds = args.where.id.in
          updatedBookingData = args.data
          return { count: args.where.id.in.length }
        }
      },
      contactInquiry: {
        updateMany: async (args: any) => {
          if (args.where?.id?.in) {
            updatedInquiryIds = args.where.id.in
            return { count: args.where.id.in.length }
          }
          return { count: 0 }
        }
      }
    }

    const result = await autoExpireInactiveLeads(mockDb)

    assert.equal(result.expiredPastDate, 2)
    assert.equal(result.totalExpired, 2)
    assert.deepEqual(updatedBookingIds, ["bk-past-1", "bk-past-2"])
    assert.equal(updatedBookingData.status, "expirado")
    assert.ok(updatedBookingData.cancellationReason.includes("concluida"))
    assert.ok(updatedBookingData.closedAt instanceof Date)
    assert.deepEqual(updatedInquiryIds, ["inq-past-1"])
  })

  it("debe procesar leads expirados por inactividad comercial (>7 días sin anticipo)", async () => {
    let updatedInactiveBookings: string[] = []
    let updatedInactiveReason = ""

    const mockDb = {
      bookingRequest: {
        findMany: async (args: any) => {
          // Step A past dates: empty
          if (args.where?.requestedDate?.lt) return []
          // Step B inactivity: 1 lead
          if (args.where?.createdAt?.lt) {
            return [{ id: "bk-inactive-1", sourceInquiryId: "inq-inactive-1" }]
          }
          return []
        },
        updateMany: async (args: any) => {
          updatedInactiveBookings = args.where.id.in
          updatedInactiveReason = args.data.cancellationReason
          return { count: args.where.id.in.length }
        }
      },
      contactInquiry: {
        updateMany: async (args: any) => {
          if (args.where?.createdAt?.lt) {
            return { count: 1 }
          }
          return { count: 0 }
        }
      }
    }

    const result = await autoExpireInactiveLeads(mockDb)

    assert.equal(result.expiredInactivity, 2) // 1 booking + 1 orphan inquiry
    assert.equal(result.expiredPastDate, 0)
    assert.equal(result.totalExpired, 2)
    assert.deepEqual(updatedInactiveBookings, ["bk-inactive-1"])
    assert.ok(updatedInactiveReason.includes("7 días sin anticipo"))
  })

  it("no debe expirar leads cuando no hay registros pendientes aplicables", async () => {
    const mockDb = {
      bookingRequest: {
        findMany: async () => [],
        updateMany: async () => ({ count: 0 })
      },
      contactInquiry: {
        updateMany: async () => ({ count: 0 })
      }
    }

    const result = await autoExpireInactiveLeads(mockDb)

    assert.equal(result.expiredPastDate, 0)
    assert.equal(result.expiredInactivity, 0)
    assert.equal(result.totalExpired, 0)
  })

  describe("WhatsApp Closure Link Formatting", () => {
    it("debe generar URL de WhatsApp con mensaje respetuoso de liberación de fecha para número mexicano", () => {
      const url = getWhatsAppClosureUrl("55 1234 5678", "Mariana López", "2026-11-20T18:00:00.000Z")
      assert.ok(url !== null)
      assert.ok(url?.startsWith("https://wa.me/525512345678?text="))
      
      const decoded = decodeURIComponent(url?.split("text=")[1] || "")
      assert.ok(decoded.includes("Hola Mariana López"))
      assert.ok(decoded.includes("liberamos la fecha tentativa"))
      assert.ok(decoded.includes("con gusto volvemos a cotizar"))
    })

    it("debe manejar números ya con código de país 52 sin duplicarlo", () => {
      const url = getWhatsAppClosureUrl("+52 55 9876 5432", "Carlos Slim", null)
      assert.ok(url !== null)
      assert.ok(url?.startsWith("https://wa.me/525598765432?text="))
      const decoded = decodeURIComponent(url?.split("text=")[1] || "")
      assert.ok(decoded.includes("acordada"))
    })

    it("debe devolver null si el teléfono está vacío o es inválido", () => {
      assert.equal(getWhatsAppClosureUrl("", "Cliente"), null)
      assert.equal(getWhatsAppClosureUrl("abc", "Cliente"), null)
    })
  })
})
