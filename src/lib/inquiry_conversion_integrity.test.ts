import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { createUnifiedQuote } from "./quote-service"
import { execSync } from "child_process"
import fs from "fs"

const TEST_DB_PATH = "/Users/ppbau/.gemini/antigravity/brain/3dfdba2c-7be1-44af-9aab-9f27a9504448/scratch/conversion_integrity_test.db"
const TEST_DB_URL = `file:${TEST_DB_PATH}`

let prisma: PrismaClient

describe("Integridad Relacional 1-a-1: ContactInquiry <-> BookingRequest", () => {
  before(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    // Desplegar todas las migraciones acumuladas
    execSync(`npx prisma migrate deploy`, {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: "pipe"
    })

    const adapter = new PrismaLibSql({ url: TEST_DB_URL })
    prisma = new PrismaClient({ adapter })
    await prisma.$connect()
  })

  after(async () => {
    if (prisma) await prisma.$disconnect()
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  it("1. Conversión normal crea BookingRequest con sourceInquiryId y marca el inquiry como converted", async () => {
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: "Mariana Rivera",
        email: "mariana@test.com",
        phone: "5512345678",
        eventType: "Boda",
        status: "new"
      }
    })

    const result = await prisma.$transaction(async (tx) => {
      return await createUnifiedQuote(tx, {
        originInquiryId: inquiry.id,
        clientName: inquiry.name,
        clientEmail: inquiry.email,
        clientPhone: inquiry.phone,
        customName: "Boda Mariana",
        eventDate: "2026-11-20",
        basePrice: 18000,
        status: "pendiente"
      })
    })

    assert.ok(result.bookingId)
    assert.equal(result.isNew, true)

    // Verificar en BD
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: result.bookingId },
      include: { sourceInquiry: true }
    })
    assert.ok(booking)
    assert.equal(booking.sourceInquiryId, inquiry.id)
    assert.equal(booking.sourceInquiry?.id, inquiry.id)

    const updatedInquiry = await prisma.contactInquiry.findUnique({
      where: { id: inquiry.id },
      include: { convertedBooking: true }
    })
    assert.equal(updatedInquiry?.status, "converted")
    assert.equal(updatedInquiry?.convertedBooking?.id, result.bookingId)
  })

  it("2. Reintento secuencial es estrictamente idempotente (reutiliza la cotización existente)", async () => {
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: "Carlos Mendoza",
        email: "carlos@test.com",
        phone: "5522334455",
        status: "new"
      }
    })

    // Primer intento
    const first = await prisma.$transaction(async (tx) => {
      return await createUnifiedQuote(tx, {
        originInquiryId: inquiry.id,
        clientName: inquiry.name,
        clientEmail: inquiry.email,
        customName: "Evento Carlos",
        eventDate: "2026-12-01",
        basePrice: 20000,
        status: "pendiente"
      })
    })

    // Segundo intento secuencial
    const second = await prisma.$transaction(async (tx) => {
      return await createUnifiedQuote(tx, {
        originInquiryId: inquiry.id,
        clientName: inquiry.name,
        clientEmail: inquiry.email,
        customName: "Evento Carlos Reintento",
        eventDate: "2026-12-01",
        basePrice: 20000,
        status: "pendiente"
      })
    })

    assert.equal(first.bookingId, second.bookingId)
    assert.equal(second.isNew, false)

    const totalBookings = await prisma.bookingRequest.count({
      where: { sourceInquiryId: inquiry.id }
    })
    assert.equal(totalBookings, 1)
  })

  it("3. Dos intentos concurrentes resuelven sin error y producen exactamente 1 BookingRequest (cero huérfanos)", async () => {
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: "Fernanda Concurrente",
        email: "fer@test.com",
        phone: "5599887766",
        status: "new"
      }
    })

    // Lanzar dos transacciones simultáneas
    const [res1, res2] = await Promise.all([
      prisma.$transaction(async (tx) => {
        return await createUnifiedQuote(tx, {
          originInquiryId: inquiry.id,
          clientName: inquiry.name,
          clientEmail: inquiry.email,
          customName: "Boda Fer - Hilo 1",
          eventDate: "2026-10-15",
          basePrice: 25000,
          status: "pendiente"
        })
      }),
      prisma.$transaction(async (tx) => {
        return await createUnifiedQuote(tx, {
          originInquiryId: inquiry.id,
          clientName: inquiry.name,
          clientEmail: inquiry.email,
          customName: "Boda Fer - Hilo 2",
          eventDate: "2026-10-15",
          basePrice: 25000,
          status: "pendiente"
        })
      })
    ])

    // Ambos deben haber resuelto al mismo bookingId
    assert.equal(res1.bookingId, res2.bookingId)

    const count = await prisma.bookingRequest.count({
      where: { sourceInquiryId: inquiry.id }
    })
    assert.equal(count, 1) // Estrictamente 1 registro
  })

  it("4. Eliminación de BookingRequest libera la relación sin dejar pointers inválidos", async () => {
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: "Rodrigo Temporal",
        email: "rodrigo@test.com",
        phone: "5544332211",
        status: "new"
      }
    })

    const created = await prisma.$transaction(async (tx) => {
      return await createUnifiedQuote(tx, {
        originInquiryId: inquiry.id,
        clientName: inquiry.name,
        clientEmail: inquiry.email,
        customName: "Evento Rodrigo",
        eventDate: "2026-09-30",
        basePrice: 15000,
        status: "pendiente"
      })
    })

    // Eliminar el BookingRequest
    await prisma.bookingRequest.delete({
      where: { id: created.bookingId }
    })

    // Consultar el inquiry: convertedBooking debe ser null de forma natural
    const refetchedInquiry = await prisma.contactInquiry.findUnique({
      where: { id: inquiry.id },
      include: { convertedBooking: true }
    })
    assert.ok(refetchedInquiry)
    assert.equal(refetchedInquiry.convertedBooking, null)

    // Puede re-convertirse limpiamente
    const reconverted = await prisma.$transaction(async (tx) => {
      return await createUnifiedQuote(tx, {
        originInquiryId: inquiry.id,
        clientName: inquiry.name,
        clientEmail: inquiry.email,
        customName: "Evento Rodrigo Nuevo",
        eventDate: "2026-09-30",
        basePrice: 16000,
        status: "pendiente"
      })
    })
    assert.ok(reconverted.bookingId)
    assert.notEqual(reconverted.bookingId, created.bookingId)
  })

  it("5. Restricción única en base de datos previene manualmente insertar dos BookingRequests con el mismo sourceInquiryId", async () => {
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: "Test Unique DB",
        email: "unique@test.com",
        phone: "5500000000",
        status: "new"
      }
    })

    await prisma.bookingRequest.create({
      data: {
        sourceInquiryId: inquiry.id,
        clientName: "Cliente 1",
        clientPhone: "5500000000",
        requestedDate: new Date("2026-11-01"),
        startTime: "18:00",
        endTime: "22:00",
        baseAmount: 10000,
        depositAmount: 3000,
        packageName: "Paquete Base",
        venueType: "salon",
        address: "Toluca",
        city: "Toluca",
        paymentMethod: "transfer"
      }
    })

    // Intentar insertar un segundo registro con el mismo sourceInquiryId debe fallar por @unique
    await assert.rejects(
      async () => {
        await prisma.bookingRequest.create({
          data: {
            sourceInquiryId: inquiry.id,
            clientName: "Cliente 2",
            clientPhone: "5500000000",
            requestedDate: new Date("2026-11-01"),
            startTime: "18:00",
            endTime: "22:00",
            baseAmount: 10000,
            depositAmount: 3000,
            packageName: "Paquete Base",
            venueType: "salon",
            address: "Toluca",
            city: "Toluca",
            paymentMethod: "transfer"
          }
        })
      },
      (err: unknown) => typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002"
    )
  })
})
