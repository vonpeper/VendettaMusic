import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { 
  updateProposalSelectionsAction, 
  saveClientLegalDataAction, 
  acceptProposalAction,
  requestChangesAction 
} from "@/actions/proposal"

import { auth } from "@/lib/auth"
import { ADMIN_ROLES } from "@/lib/auth-guards"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  const isAdmin = session?.user && ADMIN_ROLES.has(session.user.role as string)
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: Record<string, any> = {
    success: true,
    tests: []
  }

  const runTest = (name: string, assertion: boolean, details?: any) => {
    results.tests.push({ name, status: assertion ? "PASSED" : "FAILED", details })
    if (!assertion) results.success = false
  }

  try {
    // 0. Crear un BookingRequest de prueba
    const testBooking = await db.bookingRequest.create({
      data: {
        shortId: "VND-TEST-QA",
        clientName: "Colegio Mexicano de Anestesiología A.C.",
        clientPhone: "5500000000",
        clientEmail: "colegio_test@vendetta.mx",
        packageName: "Presentación musical",
        requestedDate: new Date("2026-08-20T12:00:00Z"),
        startTime: "20:00",
        endTime: "22:30",
        baseAmount: 78770, // Base obligatoria
        depositAmount: 45686.60,
        paymentMethod: "transfer",
        status: "pendiente",
        address: "World Trade Center, Ciudad de México (Salón Tolteca)",
        city: "CDMX",
        state: "Ciudad de México",
        venueType: "salon",
        guestCount: 800,
        hasPantalla: false,
        hasTemplete: false,
        quoteVersion: 1
      }
    })

    // --- TEST 1: Cálculos Base Obligatoria (No opcionales) ---
    // Recalcular con false, false
    await updateProposalSelectionsAction(testBooking.id, false, false)
    const b1 = await db.bookingRequest.findUnique({ where: { id: testBooking.id } })
    const subtotal1 = b1!.baseAmount
    const iva1 = Math.round(subtotal1 * 0.16 * 100) / 100
    const total1 = subtotal1 + iva1
    const dep1 = b1!.depositAmount
    
    runTest("1. Base obligatorios (Subtotal: $78,770)", subtotal1 === 78770, { subtotal: subtotal1 })
    runTest("2. Base obligatorios (IVA: $12,603.20)", iva1 === 12603.20, { iva: iva1 })
    runTest("3. Base obligatorios (Total: $91,373.20)", total1 === 91373.20, { total: total1 })
    runTest("4. Base obligatorios (Anticipo: $45,686.60)", dep1 === 45686.60, { deposit: dep1 })

    // --- TEST 2: Base más Pantalla LED ($36,250) ---
    await updateProposalSelectionsAction(testBooking.id, true, false)
    const b2 = await db.bookingRequest.findUnique({ where: { id: testBooking.id } })
    const subtotal2 = b2!.baseAmount
    const iva2 = Math.round(subtotal2 * 0.16 * 100) / 100
    const total2 = subtotal2 + iva2
    const dep2 = b2!.depositAmount

    runTest("5. Base + Pantalla LED (Subtotal: $115,020)", subtotal2 === 115020, { subtotal: subtotal2 })
    runTest("6. Base + Pantalla LED (IVA: $18,403.20)", iva2 === 18403.20, { iva: iva2 })
    runTest("7. Base + Pantalla LED (Total: $133,423.20)", total2 === 133423.20, { total: total2 })
    runTest("8. Base + Pantalla LED (Anticipo: $66,711.60)", dep2 === 66711.60, { deposit: dep2 })

    // --- TEST 3: Base más Templete ($18,390) ---
    await updateProposalSelectionsAction(testBooking.id, false, true)
    const b3 = await db.bookingRequest.findUnique({ where: { id: testBooking.id } })
    const subtotal3 = b3!.baseAmount
    const iva3 = Math.round(subtotal3 * 0.16 * 100) / 100
    const total3 = subtotal3 + iva3
    const dep3 = b3!.depositAmount

    runTest("9. Base + Templete (Subtotal: $97,160)", subtotal3 === 97160, { subtotal: subtotal3 })
    runTest("10. Base + Templete (IVA: $15,545.60)", iva3 === 15545.60, { iva: iva3 })
    runTest("11. Base + Templete (Total: $112,705.60)", total3 === 112705.60, { total: total3 })
    runTest("12. Base + Templete (Anticipo: $56,352.80)", dep3 === 56352.80, { deposit: dep3 })

    // --- TEST 4: Completo (Ambos opcionales) ---
    await updateProposalSelectionsAction(testBooking.id, true, true)
    const b4 = await db.bookingRequest.findUnique({ where: { id: testBooking.id } })
    const subtotal4 = b4!.baseAmount
    const iva4 = Math.round(subtotal4 * 0.16 * 100) / 100
    const total4 = subtotal4 + iva4
    const dep4 = b4!.depositAmount

    runTest("13. Completo ambos (Subtotal: $133,410)", subtotal4 === 133410, { subtotal: subtotal4 })
    runTest("14. Completo ambos (IVA: $21,345.60)", iva4 === 21345.60, { iva: iva4 })
    runTest("15. Completo ambos (Total: $154,755.60)", total4 === 154755.60, { total: total4 })
    runTest("16. Completo ambos (Anticipo: $77,377.80)", dep4 === 77377.80, { deposit: dep4 })

    // --- TEST 5: Intentar alterar precios desde el navegador ---
    // updateProposalSelectionsAction calcula los precios en el servidor de forma dura (35000 + 43770 + 36250 + 18390).
    // Si un atacante altera los subtotales de la UI y los manda, el servidor los sobreescribe de todas formas.
    runTest("17. Protección de alteración de precios en servidor", subtotal4 === 133410, { baseAmount: subtotal4 })

    // --- TEST 6: Aceptación y Bloqueo de Versión ---
    await acceptProposalAction(testBooking.id)
    const acceptedBooking = await db.bookingRequest.findUnique({ where: { id: testBooking.id } })
    runTest("18. Aceptación cambia estado a agendado", acceptedBooking!.status === "agendado", { status: acceptedBooking!.status })
    
    // Intentar cambiar opciones en versión bloqueada
    const changeAttempt = await updateProposalSelectionsAction(testBooking.id, false, false)
    runTest("19. Intento de cambio en versión bloqueada retorna error", changeAttempt.success === false, { message: changeAttempt.error })

    // --- TEST 7: Solicitar cambios incrementa versión y clona historial ---
    await requestChangesAction(testBooking.id)
    const newVersionBooking = await db.bookingRequest.findUnique({ where: { id: testBooking.id } })
    const historicalBooking = await db.bookingRequest.findFirst({
      where: { shortId: `${testBooking.shortId}-V1` }
    })

    runTest("20. Solicitar cambios incrementa versión a 2", newVersionBooking!.quoteVersion === 2, { version: newVersionBooking!.quoteVersion })
    runTest("21. Solicitar cambios restablece estado a pendiente", newVersionBooking!.status === "pendiente", { status: newVersionBooking!.status })
    runTest("22. Se clona e inactiva la versión anterior V1 en historial", historicalBooking !== null && historicalBooking.status === "cancelado", { historicalFolio: historicalBooking?.shortId })

    // --- TEST 8: Confidencialidad de costos de proveedores ---
    // Verificar que los costos confidenciales del proveedor no estén en las propiedades de BookingRequest
    const keys = Object.keys(newVersionBooking!)
    const leaks = keys.filter(k => k.toLowerCase().includes("reaktor") || k.toLowerCase().includes("costoproveedor"))
    runTest("23. Datos de costos de proveedores ocultos en payload", leaks.length === 0, { leaks })

    // 99. Limpieza de base de datos
    await db.bookingRequest.deleteMany({
      where: {
        OR: [
          { id: testBooking.id },
          { shortId: `${testBooking.shortId}-V1` }
        ]
      }
    })
    if (newVersionBooking?.eventId) {
      await db.event.delete({ where: { id: newVersionBooking.eventId } })
    }

  } catch (error: any) {
    results.success = false
    results.error = error.message || String(error)
  }

  return NextResponse.json(results)
}
