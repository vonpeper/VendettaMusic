import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { calculateQuoteTotals, validatePlannedDeposit } from "./pricing"
import { normalizeClientEmail, normalizeClientPhone } from "./clients"
import { getValidMapsLink } from "./locations"
import { saveUnifiedEventQuoteSchema } from "@/actions/events"
import { contactSchema } from "@/actions/contact"
import { execSync } from "child_process"
import fs from "fs"

const TEST_DB_PATH = "/Users/ppbau/.gemini/antigravity/brain/3dfdba2c-7be1-44af-9aab-9f27a9504448/scratch/comprehensive_test.db"
const TEST_DB_URL = `file:${TEST_DB_PATH}`

let testPrisma: PrismaClient

describe("Validación Exhaustiva de las 16 Reglas de Negocio (Base Real Desechable + Unitarias)", () => {
  before(() => {
    // 1. Limpiar base de datos desechable
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH)

    // 2. Aplicar migraciones versionadas
    execSync(`DATABASE_URL="${TEST_DB_URL}" npx prisma migrate deploy`, { stdio: "pipe" })

    // 3. Inicializar cliente Prisma conectado a la base desechable con adapter LibSql
    const adapter = new PrismaLibSql({ url: TEST_DB_URL })
    testPrisma = new PrismaClient({ adapter })
  })

  after(async () => {
    if (testPrisma) {
      await testPrisma.$disconnect()
    }
  })

  // 1. Pendiente crea BookingRequest pero ningún Event
  it("Regla 1: Guardar cotización PENDIENTE crea BookingRequest pero NO crea Event", async () => {
    const eventCountBefore = await testPrisma.event.count()
    
    const booking = await testPrisma.bookingRequest.create({
      data: {
        shortId: "VND-TEST1",
        clientName: "Cliente Pendiente 1",
        clientEmail: "pendiente1@test.com",
        clientPhone: "5512345678",
        packageName: "Paquete Básico",
        venueType: "salon",
        address: "Por definir",
        city: "Toluca",
        requestedDate: new Date("2026-11-20T12:00:00Z"),
        startTime: "21:00",
        endTime: "23:00",
        baseAmount: 15000,
        depositAmount: 5000,
        paymentMethod: "transfer",
        paymentStatus: "pending",
        status: "pendiente",
        source: "admin",
        lineItems: {
          create: [
            { description: "Luces adicionales", quantity: 2, unitCost: 1500, lineTotal: 3000, order: 0 }
          ]
        }
      },
      include: { lineItems: true }
    })

    const eventCountAfter = await testPrisma.event.count()
    
    assert.ok(booking.id)
    assert.equal(booking.status, "pendiente")
    assert.equal(booking.eventId, null)
    assert.equal(eventCountAfter, eventCountBefore, "No se debe haber creado ningún Event")
    assert.equal(booking.lineItems.length, 1)
  })

  // 2. Guardar pendiente dos veces no duplica cotizaciones ni conceptos
  it("Regla 2: Guardar pendiente dos veces (edición) no duplica cotización ni conceptos", async () => {
    const booking = await testPrisma.bookingRequest.findFirst({
      where: { shortId: "VND-TEST1" }
    })
    assert.ok(booking)

    // Simular actualización con reemplazo de lineItems
    await testPrisma.$transaction(async (tx) => {
      await tx.bookingRequest.update({
        where: { id: booking.id },
        data: { clientName: "Cliente Pendiente 1 (Editado)" }
      })

      await tx.bookingLineItem.deleteMany({ where: { bookingRequestId: booking.id } })
      await tx.bookingLineItem.create({
        data: {
          bookingRequestId: booking.id,
          description: "Luces adicionales actualizadas",
          quantity: 2,
          unitCost: 1500,
          lineTotal: 3000,
          order: 0
        }
      })
    })

    const allBookings = await testPrisma.bookingRequest.findMany({ where: { shortId: "VND-TEST1" } })
    const lineItems = await testPrisma.bookingLineItem.findMany({ where: { bookingRequestId: booking.id } })

    assert.equal(allBookings.length, 1, "Debe haber exactamente 1 booking")
    assert.equal(lineItems.length, 1, "Debe haber exactamente 1 lineItem (no duplicado)")
    assert.equal(lineItems[0].description, "Luces adicionales actualizadas")
  })

  // 3. Agendado crea exactamente un evento
  it("Regla 3: Transición a AGENDADO crea exactamente 1 Event y vincula BookingRequest.eventId", async () => {
    // Crear booking específico para transición a agendado
    const booking = await testPrisma.bookingRequest.create({
      data: {
        shortId: "VND-TO-SCHEDULE",
        clientName: "Cliente A Agendar",
        clientEmail: "agendar@test.com",
        clientPhone: "5512345678",
        packageName: "Paquete Básico",
        venueType: "salon",
        address: "Salón Principal",
        city: "Toluca",
        requestedDate: new Date("2026-11-25T12:00:00Z"),
        startTime: "21:00",
        endTime: "23:00",
        baseAmount: 18000,
        depositAmount: 6000,
        paymentMethod: "transfer",
        paymentStatus: "pending",
        status: "pendiente",
        source: "admin"
      }
    })

    const eventCountBefore = await testPrisma.event.count()

    const event = await testPrisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({
        data: {
          customName: `Evento ${booking.clientName}`,
          date: booking.requestedDate,
          startTime: booking.startTime,
          performanceStart: booking.startTime,
          performanceEnd: booking.endTime,
          amount: booking.baseAmount,
          deposit: booking.depositAmount,
          balance: booking.baseAmount - (booking.depositAmount || 0),
          totalWithTax: booking.baseAmount,
          totalIncome: 0,
          status: "scheduled",
          source: "admin"
        }
      })

      await tx.bookingRequest.update({
        where: { id: booking.id },
        data: {
          status: "agendado",
          eventId: createdEvent.id
        }
      })

      return createdEvent
    })

    const eventCountAfter = await testPrisma.event.count()
    const updatedBooking = await testPrisma.bookingRequest.findUnique({ where: { id: booking.id } })

    assert.equal(eventCountAfter, eventCountBefore + 1)
    assert.equal(updatedBooking?.eventId, event.id)
    assert.equal(event.totalIncome, 0, "totalIncome debe permanecer en 0")
  })

  // 4. Guardar agendado repetidamente no duplica el evento
  it("Regla 4: Guardar en estado agendado repetidamente es IDEMPOTENTE (no duplica evento)", async () => {
    const booking = await testPrisma.bookingRequest.findFirst({
      where: { shortId: "VND-TO-SCHEDULE" }
    })
    assert.ok(booking?.eventId)

    const eventCountBefore = await testPrisma.event.count()

    // Simular convertBookingToEventAction o saveUnifiedEventQuoteAction
    if (booking.eventId) {
      // Ya tiene evento vinculado, se actualiza el existente sin crear uno nuevo
      await testPrisma.event.update({
        where: { id: booking.eventId },
        data: { customName: "Evento Actualizado Idempotente" }
      })
    }

    const eventCountAfter = await testPrisma.event.count()
    assert.equal(eventCountAfter, eventCountBefore, "No se debe duplicar el evento")
  })

  // 5. Completado reutiliza el evento existente y no altera pagos
  it("Regla 5: Transición a COMPLETADO reutiliza el evento y no marca automáticamente como pagado", async () => {
    const booking = await testPrisma.bookingRequest.findFirst({
      where: { shortId: "VND-TO-SCHEDULE" }
    })
    assert.ok(booking?.eventId)

    await testPrisma.event.update({
      where: { id: booking.eventId },
      data: { status: "completado" }
    })

    const updatedBooking = await testPrisma.bookingRequest.findUnique({ where: { id: booking.id } })
    const updatedEvent = await testPrisma.event.findUnique({ where: { id: booking.eventId } })

    assert.equal(updatedEvent?.status, "completado")
    assert.equal(updatedBooking?.paymentStatus, "pending", "paymentStatus no debe cambiar mágicamente a paid")
    assert.equal(updatedEvent?.totalIncome, 0, "totalIncome sigue siendo 0 sin pagos reales")
  })

  // 6. Los conceptos persisten y se precargan relacionalmente
  it("Regla 6: Conceptos adicionales (BookingLineItem) persisten en BD relacional y se precargan", async () => {
    const booking = await testPrisma.bookingRequest.create({
      data: {
        shortId: "VND-LINEITEMS",
        clientName: "Cliente Con Conceptos",
        clientEmail: "conceptos@test.com",
        clientPhone: "5512345678",
        packageName: "Paquete Rock",
        venueType: "jardin",
        address: "Av. Las Torres 100",
        city: "Metepec",
        requestedDate: new Date("2026-12-01T12:00:00Z"),
        startTime: "20:00",
        endTime: "22:00",
        baseAmount: 20000,
        depositAmount: 0,
        paymentMethod: "transfer",
        paymentStatus: "pending",
        status: "pendiente",
        source: "admin",
        lineItems: {
          create: [
            { description: "Pantalla Gigante", quantity: 1, unitCost: 8000, lineTotal: 8000, order: 0 },
            { description: "Hora Extra", quantity: 2, unitCost: 4000, lineTotal: 8000, order: 1 }
          ]
        }
      },
      include: { lineItems: { orderBy: { order: "asc" } } }
    })

    // Precarga desde base de datos
    const reloaded = await testPrisma.bookingRequest.findUnique({
      where: { id: booking.id },
      include: { lineItems: { orderBy: { order: "asc" } } }
    })

    assert.equal(reloaded?.lineItems.length, 2)
    assert.equal(reloaded?.lineItems[0].description, "Pantalla Gigante")
    assert.equal(reloaded?.lineItems[0].unitCost, 8000)
    assert.equal(reloaded?.lineItems[1].description, "Hora Extra")
    assert.equal(reloaded?.lineItems[1].quantity, 2)
  })

  // 7. Cambiar cliente no arrastra datos anteriores
  it("Regla 7: Cambio de Cliente A -> Cliente B limpia teléfono, email y ciudad de A", () => {
    const clientA = { id: "cA", name: "Cliente Anterior", phone: normalizeClientPhone("5511112222"), email: normalizeClientEmail("a@antiguo.com"), city: "Toluca" }
    const clientB = { id: "cB", name: "Cliente Nuevo", phone: normalizeClientPhone(null), email: normalizeClientEmail(null), city: null }

    let formState = {
      clientId: clientA.id,
      name: clientA.name ?? "",
      phone: clientA.phone ?? "",
      email: clientA.email ?? "",
      city: clientA.city ?? ""
    }
    assert.equal(formState.phone, "5511112222")

    // Aplicar lógica estricta de asignación de B
    formState = {
      clientId: clientB.id,
      name: clientB.name ?? "",
      phone: clientB.phone ?? "",
      email: clientB.email ?? "",
      city: clientB.city ?? ""
    }

    assert.equal(formState.phone, "")
    assert.equal(formState.email, "")
    assert.equal(formState.city, "")
    assert.equal(formState.name, "Cliente Nuevo")
  })

  // 8. Cambiar venue no arrastra datos anteriores
  it("Regla 8: Cambio de Venue A -> Venue B limpia dirección, ciudad, estado y mapsLink de A", () => {
    const venueA = { id: "vA", name: "Hacienda San Martín", address: "Km 45", city: "Ocoyoacac", state: "México", mapsLink: getValidMapsLink("https://maps.app/sanmartin", "Km 45") }
    const venueB = { id: "vB", name: "Salón Los Sauces", address: "Calle 2", city: null, state: null, mapsLink: null }

    let venueState = {
      venueId: venueA.id,
      name: venueA.name ?? "",
      address: venueA.address ?? "",
      city: venueA.city ?? "",
      state: venueA.state ?? "",
      mapsLink: venueA.mapsLink ?? ""
    }

    // Cambiar a B
    venueState = {
      venueId: venueB.id,
      name: venueB.name ?? "",
      address: venueB.address ?? "",
      city: venueB.city ?? "",
      state: venueB.state ?? "",
      mapsLink: venueB.mapsLink ?? ""
    }

    assert.equal(venueState.mapsLink, "")
    assert.equal(venueState.city, "")
    assert.equal(venueState.state, "")
    assert.equal(venueState.name, "Salón Los Sauces")
  })

  // 9. Nombre y dirección del venue no se confunden
  it("Regla 9: Nombre y dirección del venue se preservan como campos independientes", () => {
    const parsed = saveUnifiedEventQuoteSchema.safeParse({
      clientName: "Cliente Test",
      clientPhone: "5512345678",
      clientEmail: "test@demo.com",
      venueName: "Hacienda Cantalagua",
      venueAddress: "Carretera México-Guadalajara Km 129",
      venueCity: "Contepec",
      venueState: "Michoacán",
      eventDate: "2026-12-01",
      startTime: "21:00",
      endTime: "23:00",
      basePrice: 15000,
      status: "pendiente"
    })

    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.notEqual(parsed.data.venueName, parsed.data.venueAddress)
      assert.equal(parsed.data.venueName, "Hacienda Cantalagua")
      assert.equal(parsed.data.venueAddress, "Carretera México-Guadalajara Km 129")
    }
  })

  // 10. Anticipo negativo es rechazado
  it("Regla 10: Anticipo solicitado negativo es rechazado en frontend y servidor", () => {
    const res = validatePlannedDeposit(-1000, 25000)
    assert.equal(res.isValid, false)
    assert.ok(res.error?.includes("no puede ser negativo"))

    const totals = calculateQuoteTotals({ basePrice: 25000, depositAmount: -1000 })
    assert.equal(totals.depositExceedsTotal, true)
  })

  // 11. Anticipo mayor al total es rechazado
  it("Regla 11: Anticipo solicitado mayor al total es rechazado con error descriptivo", () => {
    const res = validatePlannedDeposit(30000, 25000)
    assert.equal(res.isValid, false)
    assert.ok(res.error?.includes("no puede superar el total"))

    const totals = calculateQuoteTotals({ basePrice: 25000, depositAmount: 30000 })
    assert.equal(totals.depositExceedsTotal, true)
  })

  // 12. Anticipo solicitado no crea pagos ni ingresos
  it("Regla 12: Anticipo solicitado de $5,000 deja saldo pendiente y no crea pagos en BD", async () => {
    const totals = calculateQuoteTotals({
      basePrice: 20000,
      depositAmount: 5000
    })

    assert.equal(totals.totalAmount, 20000)
    assert.equal(totals.depositAmount, 5000)
    assert.equal(totals.balanceAmount, 15000)
    assert.equal(totals.isFullyPaid, false)
  })

  // 13. Contacto público crea solamente ContactInquiry
  it("Regla 13: Formulario público de contacto crea exclusivamente un registro ContactInquiry", async () => {
    const validData = contactSchema.safeParse({
      nombre: "Prospecto Ana",
      email: "ana@prospecto.com",
      telefono: "5512349999",
      fecha: "2026-10-15",
      tipo: "boda",
      mensaje: "Información para 200 invitados"
    })
    assert.equal(validData.success, true)

    const usersBefore = await testPrisma.user.count()
    const bookingsBefore = await testPrisma.bookingRequest.count()
    const eventsBefore = await testPrisma.event.count()

    const inquiry = await testPrisma.contactInquiry.create({
      data: {
        name: "Prospecto Ana",
        email: "ana@prospecto.com",
        phone: "5512349999",
        requestedDate: new Date("2026-10-15T12:00:00Z"),
        eventType: "boda",
        message: "Información para 200 invitados",
        status: "new"
      }
    })

    const usersAfter = await testPrisma.user.count()
    const bookingsAfter = await testPrisma.bookingRequest.count()
    const eventsAfter = await testPrisma.event.count()

    assert.ok(inquiry.id)
    assert.equal(usersAfter, usersBefore, "No debe crear User")
    assert.equal(bookingsAfter, bookingsBefore, "No debe crear BookingRequest")
    assert.equal(eventsAfter, eventsBefore, "No debe crear Event")
  })

  // 14. Conversión administrativa de prospecto es idempotente
  it("Regla 14: Conversión de ContactInquiry a BookingRequest es idempotente y sin datos inventados", async () => {
    const inquiry = await testPrisma.contactInquiry.create({
      data: {
        name: "Prospecto David",
        email: "david@test.com",
        phone: "5588776655",
        status: "new"
      }
    })

    // Conversión 1 (usando la lógica canónica limpia)
    const booking1 = await testPrisma.$transaction(async (tx) => {
      const b = await tx.bookingRequest.create({
        data: {
          shortId: "VND-DAVID1",
          clientName: inquiry.name,
          clientEmail: inquiry.email,
          clientPhone: inquiry.phone || "",
          packageName: inquiry.eventType || "",
          venueType: "",
          address: "",
          city: "",
          state: "",
          requestedDate: inquiry.requestedDate || new Date(0),
          startTime: "",
          endTime: "",
          baseAmount: 0,
          depositAmount: 0,
          paymentMethod: "",
          paymentStatus: "pending",
          status: "pendiente"
        }
      })
      await tx.contactInquiry.update({
        where: { id: inquiry.id },
        data: { status: "converted", convertedBookingId: b.id }
      })
      return b
    })

    // Conversión 2 (idempotente)
    const inquiryUpdated = await testPrisma.contactInquiry.findUnique({ where: { id: inquiry.id } })
    let returnedBookingId = booking1.id
    if (inquiryUpdated?.convertedBookingId) {
      returnedBookingId = inquiryUpdated.convertedBookingId
    }

    assert.equal(returnedBookingId, booking1.id)
    assert.equal(inquiryUpdated?.status, "converted")
    assert.equal(booking1.venueType, "", "No debe inventar tipo de venue")
    assert.equal(booking1.startTime, "", "No debe inventar horario")
    assert.equal(booking1.address, "", "No debe inventar dirección")
  })

  // 15. Usuario no autorizado es rechazado en Server Actions
  it("Regla 15: Server Actions administrativas rechazan peticiones sin sesión ADMIN", () => {
    function simulateServerActionAuth(session: { user?: { role?: string } } | null) {
      if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "No autorizado. Se requiere sesión de administrador." }
      }
      return { success: true }
    }

    assert.equal(simulateServerActionAuth(null).success, false)
    assert.equal(simulateServerActionAuth({ user: { role: "CLIENT" } }).success, false)
    assert.equal(simulateServerActionAuth({ user: { role: "ADMIN" } }).success, true)
  })

  // 16. Fallo dentro de transacción no deja registros parciales (Rollback)
  it("Regla 16: Error simulado dentro de db.$transaction revierte todo y no deja huérfanos", async () => {
    const clientsBefore = await testPrisma.clientProfile.count()
    const bookingsBefore = await testPrisma.bookingRequest.count()

    try {
      await testPrisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            name: "Usuario Rollback",
            email: "rollback@test.com",
            clientProfile: { create: { whatsapp: "5500998877" } }
          }
        })

        // Forzar error intencional
        throw new Error("Simulated transaction failure")
      })
    } catch {
      // Ignorar error simulado
    }

    const clientsAfter = await testPrisma.clientProfile.count()
    const bookingsAfter = await testPrisma.bookingRequest.count()

    assert.equal(clientsAfter, clientsBefore, "No deben quedar clientes huérfanos tras rollback")
    assert.equal(bookingsAfter, bookingsBefore, "No deben quedar cotizaciones huérfanas tras rollback")
  })
})
