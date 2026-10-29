import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { extractLast10, getPhoneSearchVariants, findCommercialContact, purgeOrphanInboxItems } from "./commercial-contacts"
import { db } from "./db"

describe("Validación de Contactos Comerciales y Admisión de Mensajes (commercial-contacts.ts)", () => {
  it("debe extraer correctamente los últimos 10 dígitos numéricos de diversos formatos", () => {
    assert.equal(extractLast10("+52 1 722 634 2452"), "7226342452")
    assert.equal(extractLast10("5215512345678@s.whatsapp.net"), "5512345678")
    assert.equal(extractLast10("55-1234-5678"), "5512345678")
    assert.equal(extractLast10("(722) 634-2452"), "7226342452")
    assert.equal(extractLast10("5512345678"), "5512345678")
  })

  it("debe retornar null para números incompletos, inválidos o vacíos", () => {
    assert.equal(extractLast10(""), null)
    assert.equal(extractLast10(null), null)
    assert.equal(extractLast10(undefined), null)
    assert.equal(extractLast10("12345"), null)
    assert.equal(extractLast10("abc-def"), null)
  })

  it("debe generar variantes de búsqueda para coincidir con formatos guardados en BD", () => {
    const variants = getPhoneSearchVariants("7226342452")
    assert.ok(variants.includes("7226342452"))
    assert.ok(variants.includes("722 634 2452"))
    assert.ok(variants.includes("722-634-2452"))
  })

  it("debe descartar inmediatamente remitentes que provengan de grupos (@g.us) o difusión", async () => {
    const groupRes = await findCommercialContact("120363024823904@g.us")
    assert.equal(groupRes.isCommercial, false)
    assert.equal(groupRes.last10, null)

    const broadcastRes = await findCommercialContact("status@broadcast")
    assert.equal(broadcastRes.isCommercial, false)
  })

  it("debe descartar números personales o desconocidos que no estén en la base comercial", async () => {
    const unknownRes = await findCommercialContact("5219999999999@s.whatsapp.net")
    assert.equal(unknownRes.isCommercial, false)
    assert.equal(unknownRes.client, null)
    assert.equal(unknownRes.booking, null)
    assert.equal(unknownRes.inquiry, null)
  })

  it("debe reconocer un contacto comercial existente por BookingRequest o ContactInquiry", async () => {
    // Buscar un booking de prueba existente en la BD para validar reconocimiento real
    const existingBooking = await db.bookingRequest.findFirst({
      where: { clientPhone: { not: "" } },
      select: { clientPhone: true, clientName: true }
    })

    if (existingBooking?.clientPhone) {
      const last10 = extractLast10(existingBooking.clientPhone)
      if (last10) {
        const res = await findCommercialContact(`521${last10}@s.whatsapp.net`)
        assert.equal(res.isCommercial, true)
        assert.ok(res.booking !== null || res.client !== null)
      }
    }
  })

  it("debe purgar registros huérfanos de InboxItem sin afectar los válidos", async () => {
    // 1. Insertar un item huérfano simulado (número falso sin relación)
    const orphanItem = await db.inboxItem.create({
      data: {
        phoneNumber: "9998887766",
        senderName: "Chat Personal Desconocido",
        message: "Hola primo",
        type: "new_lead",
        status: "pending",
        priority: "low"
      }
    })

    // 2. Ejecutar la rutina de purga
    const purgeResult = await purgeOrphanInboxItems()
    assert.ok(purgeResult.deletedCount >= 1, "Debe haber eliminado al menos el registro huérfano")

    // 3. Confirmar que el registro huérfano fue removido de la base de datos
    const checkDeleted = await db.inboxItem.findUnique({
      where: { id: orphanItem.id }
    })
    assert.equal(checkDeleted, null, "El registro huérfano debe haber sido eliminado")
  })
})
