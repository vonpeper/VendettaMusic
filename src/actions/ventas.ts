"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { notifyMusicians, dispatchNotification, notifyEventCancellation } from "@/lib/notifications"
import { formatDateMX } from "@/lib/utils"

export async function markBookingAsCompleted(bookingId: string) {
  try {
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { 
        status: "completado",
        paymentStatus: "paid"
      }
    })
    
    // Sincronizar con Event de forma segura
    const br = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    if (br?.eventId) {
      await db.event.updateMany({
        where: { id: br.eventId },
        data: { 
          status: "completado",
          balance: 0
        }
      })
    }

    revalidatePath("/admin/ventas")
    revalidatePath("/admin/eventos")
    revalidatePath("/admin/eventualidades")
    revalidatePath("/admin")
    revalidatePath("/agenda")
    return { success: true }
  } catch (error: any) {
    console.error("Error marking booking as completed:", error)
    return { success: false, error: error?.message || "Error al completar el contrato." }
  }
}

export async function updateBookingStatusAction(bookingId: string, newStatus: string) {
  try {
    const trimmedId = bookingId?.trim()
    if (!trimmedId) return { success: false, error: "ID de solicitud no proporcionado." }

    let brCheck = await db.bookingRequest.findFirst({
      where: {
        OR: [
          { id: trimmedId },
          { shortId: trimmedId.toUpperCase() }
        ]
      },
      include: {
        event: {
          include: {
            client: true,
            location: true,
          }
        }
      }
    })

    if (!brCheck) {
      // Compatibilidad con cotizaciones legacy (Quote)
      const quote = await db.quote.findFirst({
        where: {
          OR: [
            { id: trimmedId }
          ]
        },
        include: {
          client: { include: { user: true } },
          event: true
        }
      })

      if (quote) {
        await db.quote.update({
          where: { id: quote.id },
          data: { status: newStatus }
        })

        const linkedEvent = quote.event || await db.event.findFirst({
          where: { quoteId: quote.id }
        })

        if (linkedEvent) {
          await db.event.update({
            where: { id: linkedEvent.id },
            data: { 
              status: newStatus,
              ...(newStatus === "completado" ? { balance: 0 } : {})
            }
          })

          if (newStatus === "cancelado") {
            console.log(`⚠️ updateBookingStatusAction: Detectada cancelación para cotización ${quote.id}. Notificando...`)
            await notifyEventCancellation(linkedEvent.id, db).catch(e => console.error("Error sending cancellation notifications:", e))
          }

          const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
          syncEventToGoogleCalendar(linkedEvent.id).catch(e => console.error("Error syncing to Google Calendar:", e))
        }

        revalidatePath("/admin/ventas")
        revalidatePath(`/admin/ventas/${quote.id}`)
        revalidatePath(`/admin/ventas/${trimmedId}`)
        revalidatePath("/admin/ventas/[id]", "page")
        revalidatePath("/admin/eventos")
        revalidatePath("/admin/eventualidades")
        revalidatePath("/admin")
        revalidatePath("/agenda")

        return { success: true }
      }

      return { success: false, error: "Solicitud o cotización no encontrada." }
    }

    const canonicalBookingId = brCheck.id

    if (newStatus === "agendado") {
      // 1. Validadores estrictos
      if (!brCheck.requestedDate) return { success: false, error: "Falta definir la fecha del evento." }
      if (!brCheck.packageId && !brCheck.packageName) return { success: false, error: "Falta asignar un paquete." }
      if (!brCheck.clientName || !brCheck.clientPhone) return { success: false, error: "Falta asignar información del cliente." }

      // 2. Crear o actualizar ClientProfile (Fuente de la verdad)
      let clientId = brCheck.clientId || brCheck.event?.clientId
      
      // Si no hay clientId pero tenemos correo, intentamos buscar el usuario
      let userId = brCheck.clientUserId
      const cleanEmail = brCheck.clientEmail?.trim() || null

      if (!userId && cleanEmail) {
        const user = await db.user.upsert({
          where: { email: cleanEmail },
          create: {
            email: cleanEmail,
            name: brCheck.clientName,
            role: "CLIENT",
          },
          update: {
            name: brCheck.clientName,
          }
        })
        userId = user.id
      } else if (!userId && !clientId) {
        // Fallback: Si no hay correo ni clientId, creamos un usuario placeholder sin email
        const user = await db.user.create({
          data: {
            name: brCheck.clientName,
            role: "CLIENT",
          }
        })
        userId = user.id
      }

      if (userId && !clientId) {
        const clientProfile = await db.clientProfile.upsert({
          where: { userId: userId },
          create: {
            userId: userId,
            whatsapp: brCheck.clientPhone,
            city: brCheck.city || "Toluca",
            state: brCheck.state || "México",
          },
          update: {
            whatsapp: brCheck.clientPhone,
            city: brCheck.city || "Toluca",
            state: brCheck.state || "México",
          }
        })
        clientId = clientProfile.id
      }

      // 3. Crear o actualizar Location
      let locationId = brCheck.event?.locationId
      if (brCheck.address || brCheck.venueType) {
        const locationName = brCheck.clientName ? `Show - ${brCheck.clientName} (${brCheck.shortId || 'Web'})` : "Evento Vendetta"
        const locationAddress = [brCheck.calle, brCheck.numero, brCheck.colonia, brCheck.municipio, brCheck.state, brCheck.zipCode].filter(Boolean).join(", ") || brCheck.address || "Dirección no especificada"

        if (locationId) {
          await db.location.update({
            where: { id: locationId },
            data: {
              name: locationName,
              address: locationAddress,
              mapsLink: brCheck.mapsLink,
              city: brCheck.city,
              state: brCheck.state,
            }
          })
        } else {
          const newLoc = await db.location.create({
            data: {
              name: locationName,
              address: locationAddress,
              mapsLink: brCheck.mapsLink,
              city: brCheck.city,
              state: brCheck.state,
            }
          })
          locationId = newLoc.id
        }
      }

      // 4. Crear o actualizar Evento
      let eventId = brCheck.eventId
      if (!eventId) {
        const crypto = await import("crypto")
        const quoteId = crypto.randomUUID()
        
        // Crear Cotización para compatibilidad legacy
        if (clientId) {
          await db.quote.create({
            data: {
              id: quoteId,
              clientId: clientId,
              status: "agendado",
              totalEstimated: brCheck.baseAmount,
              guestCount: brCheck.guestCount,
              ceremonyType: brCheck.venueType,
              notes: brCheck.adminNote || "",
              eventDate: brCheck.requestedDate,
              items: {
                create: [
                  {
                    description: `Confirmación Web: ${brCheck.packageName}`,
                    quantity: 1,
                    unitCost: brCheck.baseAmount
                  }
                ]
              }
            }
          })
        }

        const lineItems = await db.bookingLineItem.findMany({ where: { bookingRequestId: canonicalBookingId } })
        const lineItemsTotal = lineItems.reduce((acc, it) => acc + (it.lineTotal || (it.quantity * it.unitCost) || 0), 0)
        const subtotal = Math.max(0, Number(brCheck.baseAmount || 0) + Number(brCheck.viaticosAmount || 0) + lineItemsTotal - Number(brCheck.discountAmount || 0))
        const hasInvoice = Boolean(brCheck.invoice)
        const ivaAmount = hasInvoice ? Math.round(subtotal * 0.16 * 100) / 100 : 0
        const totalWithTax = subtotal + ivaAmount
        const deposit = (Number(brCheck.depositAmount || 0) > 0) ? Number(brCheck.depositAmount) : Math.round(totalWithTax * 0.3)
        const balance = Math.max(0, totalWithTax - deposit)

        // Crear Evento
        const event = await db.event.create({
          data: {
            quoteId:          clientId ? quoteId : null,
            clientId:         clientId || null,
            date:             brCheck.requestedDate,
            guestCount:       brCheck.guestCount,
            performanceStart: brCheck.startTime,
            startTime:        brCheck.startTime,
            performanceEnd:   brCheck.endTime,
            amount:           subtotal,
            deposit:          deposit,
            balance:          balance,
            ivaAmount:        ivaAmount,
            totalWithTax:     totalWithTax,
            totalIncome:      totalWithTax,
            depositMethod:    brCheck.paymentMethod,
            status:           "agendado",
            venueType:        brCheck.venueType,
            mapsLink:         brCheck.mapsLink,
            ceremonyType:     brCheck.ceremonyType || brCheck.venueType || "show",
            locationId:       locationId || null,
            isPublic:         brCheck.isPublic,
            clientProvidesAudio: brCheck.clientProvidesAudio,
            setupTime:        brCheck.setupTime || null,
            arrivalTime:      brCheck.arrivalTime || null,
            dressCode:        brCheck.dressCode || null,
            customName:       brCheck.customName || null,
            musicianNotes:    brCheck.musicianNotes || brCheck.adminNote || null,
            source:           "funnel"
          }
        })
        eventId = event.id

        // Vincular booking con el eventId
        await db.bookingRequest.update({
          where: { id: canonicalBookingId },
          data:  { eventId: eventId }
        })

        // Asignar automáticamente los músicos titulares al evento
        const { assignDefaultMusicians } = await import("@/lib/musicians")
        await assignDefaultMusicians(eventId, db).catch(e => console.error("Error auto-assigning default musicians:", e))

        // Sincronizar con Google Calendar si la integración está activa
        try {
          const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
          await syncEventToGoogleCalendar(eventId)
        } catch (calErr) {
          console.error("⚠️ Error syncing confirmed funnel event to Google Calendar:", calErr)
        }
      } else {
        const lineItems = await db.bookingLineItem.findMany({ where: { bookingRequestId: canonicalBookingId } })
        const lineItemsTotal = lineItems.reduce((acc, it) => acc + (it.lineTotal || (it.quantity * it.unitCost) || 0), 0)
        const subtotal = Math.max(0, Number(brCheck.baseAmount || 0) + Number(brCheck.viaticosAmount || 0) + lineItemsTotal - Number(brCheck.discountAmount || 0))
        const hasInvoice = Boolean(brCheck.invoice)
        const ivaAmount = hasInvoice ? Math.round(subtotal * 0.16 * 100) / 100 : 0
        const totalWithTax = subtotal + ivaAmount
        const deposit = (Number(brCheck.depositAmount || 0) > 0) ? Number(brCheck.depositAmount) : Math.round(totalWithTax * 0.3)
        const balance = Math.max(0, totalWithTax - deposit)

        await db.event.update({
          where: { id: eventId },
          data: {
            clientId: clientId,
            locationId: locationId,
            status: newStatus,
            amount: subtotal,
            deposit: deposit,
            balance: balance,
            ivaAmount: ivaAmount,
            totalWithTax: totalWithTax,
          }
        })
      }
      
      // 5. Actualizar el BookingRequest con el clientId
      await db.bookingRequest.update({
        where: { id: canonicalBookingId },
        data: {
          clientId: clientId,
          clientUserId: userId,
        }
      })
    }

    await db.bookingRequest.update({
      where: { id: canonicalBookingId },
      data: { 
        status: newStatus,
        ...(newStatus === "completado" ? { paymentStatus: "paid" } : {})
      }
    })

    // Sincronizar con Event
    const br = await db.bookingRequest.findUnique({ 
      where: { id: canonicalBookingId },
      include: { 
        event: { 
          include: { 
            location: true,
            package: true,
            client: { include: { user: true } }
          } 
        } 
      }
    })

    if (br?.eventId) {
      if (newStatus !== "agendado") {
        await db.event.updateMany({
          where: { id: br.eventId },
          data: { 
            status: newStatus,
            ...(newStatus === "completado" ? { balance: 0 } : {})
          }
        })
      }

      if (newStatus === "agendado") {
        const existingClientNotif = await db.notification.findFirst({
          where: {
            bookingRequestId: br.id,
            type: { in: ["CLIENT_CONFIRMED", "client_confirmed"] }
          }
        })

        if (!existingClientNotif) {
          await dispatchNotification({
            type: "CLIENT_CONFIRMED",
            bookingId: br.id
          }).catch(e => console.error("Error sending client confirmation notification:", e))
        }
      }

      if (newStatus === "cancelado") {
        console.log(`⚠️ updateBookingStatusAction: Detectada cancelación para contrato ${canonicalBookingId}. Notificando...`)
        await notifyEventCancellation(br.eventId, db).catch(e => console.error("Error sending cancellation notifications:", e))
      }
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${trimmedId}`)
    revalidatePath(`/admin/ventas/${canonicalBookingId}`)
    if (brCheck.shortId) {
      revalidatePath(`/admin/ventas/${brCheck.shortId}`)
      revalidatePath(`/status/${brCheck.shortId}`)
      revalidatePath(`/propuesta/${brCheck.shortId}`)
    }
    revalidatePath("/admin/ventas/[id]", "page")
    revalidatePath("/admin/eventos")
    revalidatePath("/admin/eventualidades")
    revalidatePath("/admin")
    revalidatePath("/agenda")

    if (br?.eventId) {
      const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
      syncEventToGoogleCalendar(br.eventId).catch(e => console.error("Error syncing to Google Calendar:", e))
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error updating booking status:", error)
    return { success: false, error: error?.message || "Error al actualizar el estado." }
  }
}

export async function markBookingAsPaidAction(bookingId: string) {
  try {
    const booking = await db.bookingRequest.update({
      where: { id: bookingId },
      data: { paymentStatus: "paid" }
    })

    if (booking.eventId) {
      // Create payment record for the remaining balance
      const event = await db.event.findUnique({
        where: { id: booking.eventId },
        include: { payments: true }
      })
      
      const total = booking.baseAmount + (booking.viaticosAmount || 0) - (booking.discountAmount || 0);
      const paid = (event?.payments || []).filter(p => p.status === 'completed' || p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
      const balance = total - paid;
      
      if (balance > 0) {
        await db.payment.create({
          data: {
            eventId: booking.eventId,
            bookingRequestId: booking.id,
            amount: balance,
            method: "TRANSFER",
            status: "completed",
            reference: "Liquidación Manual"
          }
        })
      }

      await db.event.update({
        where: { id: booking.eventId },
        data: { 
          balance: 0,
          status: "completado"  // Excluye el anticipo del cálculo de "anticipos en banco" en eventualidades
        }
      })

      // También completar la BookingRequest
      await db.bookingRequest.update({
        where: { id: bookingId },
        data: { status: "completado" }
      })
    }

    // Alerta al Admin
    const { dispatchAdminAlert } = await import("@/lib/notifications")
    await dispatchAdminAlert(`💰 *PAGO RECIBIDO*\nEl cliente *${booking.clientName}* ha liquidado su evento.\n\nFolio: ${booking.shortId}`)

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    revalidatePath("/admin/eventualidades")
    revalidatePath("/admin/eventos")
    return { success: true }
  } catch (error) {
    console.error("Error marking booking as paid:", error)
    return { success: false, error: "Error al liquidar el pago." }
  }
}
export async function markContractAsSignedAction(bookingId: string) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { 
        event: { 
          include: { 
            contracts: true,
            location: true,
            package: true
          } 
        } 
      }
    })

    if (!booking || !booking.eventId) {
      return { success: false, error: "No se encontró un evento vinculado." }
    }

    // Si tiene contrato, marcar el primero como firmado
    if (booking.event?.contracts && booking.event.contracts.length > 0) {
      await db.contract.update({
        where: { id: booking.event.contracts[0].id },
        data: { status: "signed" }
      })
    } else {
      // Si no tiene, crear uno firmado (fallback)
      await db.contract.create({
        data: {
          eventId: booking.eventId,
          status: "signed",
        }
      })
    }

    // Notificar a músicos automáticamente al firmar contrato
    if (booking.event && booking.event.status === "agendado") {
      const existingClientNotif = await db.notification.findFirst({
        where: {
          bookingRequestId: booking.id,
          type: { in: ["CLIENT_CONFIRMED", "client_confirmed"] }
        }
      })

      if (!existingClientNotif) {
        await dispatchNotification({
          type: "CLIENT_CONFIRMED",
          bookingId: booking.id
        })
      }
      // No notificar automáticamente al staff al firmar. El admin lo hará manualmente.
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error marking contract as signed:", error)
    return { success: false, error: "Error al firmar el contrato." }
  }
}

export async function updateVenueTypeAction(bookingId: string, newType: string) {
  try {
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { venueType: newType }
    })
    revalidatePath(`/admin/ventas/${bookingId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating venueType:", error)
    return { success: false, error: "Error al actualizar tipo de evento." }
  }
}


export async function updateContractStatusAction(bookingId: string, newStatus: string) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { 
        event: { 
          include: { 
            contracts: true,
            location: true,
            package: true
          } 
        } 
      }
    })

    if (!booking || !booking.eventId) {
      return { success: false, error: "No se encontró un evento vinculado." }
    }

    if (booking.event?.contracts && booking.event.contracts.length > 0) {
      await db.contract.update({
        where: { id: booking.event.contracts[0].id },
        data: { 
          status: newStatus,
          signedAt: newStatus === "signed" ? new Date() : null
        }
      })
    } else {
      await db.contract.create({
        data: {
          eventId: booking.eventId,
          status: newStatus,
          signedAt: newStatus === "signed" ? new Date() : null
        }
      })
    }

    // Si se firma y el evento está agendado, podemos disparar notificaciones si no se habían enviado
    if (newStatus === "signed" && booking.event && booking.event.status === "agendado") {
      // Opcional: solo si queremos re-enviar o asegurar envío
      // await dispatchNotification(...)
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating contract status:", error)
    return { success: false, error: "Error al actualizar contrato." }
  }
}

export async function sendAutoFollowUpAction(id: string, type: "booking" | "quote", phone: string, clientName: string) {
  try {
    // 1. Send WhatsApp Push
    await dispatchNotification({
      type: "CLIENT_FOLLOWUP",
      bookingId: id
    })

    // 2. Increment counter
    if (type === "booking") {
      await db.bookingRequest.update({
        where: { id },
        data: { followUpCount: { increment: 1 } }
      })
    } else {
      await db.quote.update({
        where: { id },
        data: { followUpCount: { increment: 1 } }
      })
    }

    revalidatePath("/admin/ventas")
    return { success: true }
  } catch (error) {
    console.error("Error in sendAutoFollowUpAction:", error)
    return { success: false, error: "Error al enviar el seguimiento automático" }
  }
}

export async function reactivateBookingAction(bookingId: string) {
  try {
    const booking = await db.bookingRequest.findUnique({ 
      where: { id: bookingId } 
    })
    if (!booking) return { success: false, error: "No se encontró la reserva." }

    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { 
        status: "pendiente",
        createdAt: new Date(), // Reiniciar el contador de 15 días
        followUpCount: 0      // Reiniciar seguimiento
      }
    })

    // SI TIENE EVENTO, TAMBIÉN RE-ACTIVARLO
    if (booking.eventId) {
      await db.event.update({
        where: { id: booking.eventId },
        data: { status: "scheduled" } // o "pendiente" si prefieres
      })
    }

    revalidatePath("/admin/ventas")
    revalidatePath("/admin/eventos")
    return { success: true }
  } catch (error) {
    console.error("Error reactivating booking:", error)
    return { success: false, error: "Error al reactivar el contrato." }
  }
}

export async function confirmDepositPaidAction(bookingId: string) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { lineItems: true }
    })
    
    if (!booking) return { success: false, error: "Reserva no encontrada" }

    // Si aún no estaba agendado, cambiar a agendado para crear el evento y disparar CLIENT_CONFIRMED con la firma de contrato
    if (booking.status !== "agendado") {
      const updateRes = await updateBookingStatusAction(bookingId, "agendado")
      if (!updateRes.success) return updateRes
    }

    // Calcular el anticipo requerido canónico (30%)
    const lineItemsTotal = (booking.lineItems || []).reduce((acc: number, it: any) => acc + Number(it.lineTotal || (it.quantity * it.unitCost) || 0), 0)
    const subtotal = Math.max(0, Number(booking.baseAmount || 0) + Number(booking.viaticosAmount || 0) + lineItemsTotal - Number(booking.discountAmount || 0))
    const hasInvoice = Boolean(booking.invoice)
    const iva = hasInvoice ? Math.round(subtotal * 0.16 * 100) / 100 : 0
    const totalCalc = subtotal + iva
    const deposit = (booking.depositAmount && booking.depositAmount > 0) ? booking.depositAmount : Math.round(totalCalc * 0.3)

    await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "paid",
        depositAmount: deposit
      }
    })

    const updatedBooking = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    const eventId = updatedBooking?.eventId || booking.eventId

    if (eventId) {
      // Crear registro de pago si no existe
      const existingPayments = await db.payment.findMany({
        where: { bookingRequestId: booking.id, status: { in: ["completed", "paid"] } }
      });
      
      if (existingPayments.length === 0) {
        await db.payment.create({
          data: {
            eventId: eventId,
            bookingRequestId: booking.id,
            amount: deposit,
            method: "TRANSFER",
            status: "completed",
            reference: "Anticipo 30% Confirmado"
          }
        })
      }

      // Al confirmar anticipo, actualizamos el balance del evento
      const currentEvent = await db.event.findUnique({ where: { id: eventId } })
      const totalAmount = currentEvent?.totalWithTax || currentEvent?.amount || totalCalc
      await db.event.update({
        where: { id: eventId },
        data: { 
          deposit: deposit,
          balance: Math.max(0, totalAmount - deposit)
        }
      })
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    if (booking.shortId) {
      revalidatePath(`/admin/ventas/${booking.shortId}`)
      revalidatePath(`/status/${booking.shortId}`)
      revalidatePath(`/propuesta/${booking.shortId}`)
    }
    revalidatePath("/admin/eventos")
    return { success: true }
  } catch (error) {
    console.error("Error confirming deposit:", error)
    return { success: false, error: "Error al confirmar el anticipo." }
  }
}

export async function deleteContractAction(bookingId: string) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { event: { include: { contracts: true } } }
    })

    if (!booking) return { success: false, error: "Reserva no encontrada." }

    // 1. Borrar los registros de Contract vinculados al evento
    if (booking.eventId && booking.event?.contracts?.length) {
      await db.contract.deleteMany({ where: { eventId: booking.eventId } })
    }

    // 2. Limpiar firmas y fecha de firma en BookingRequest
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        clientSignature: null,
        adminSignature: null,
        signedAt: null,
      }
    })

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting contract:", error)
    return { success: false, error: "Error al eliminar el contrato." }
  }
}

export async function updateDepositAmountAction(bookingId: string, amount: number) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { event: true, lineItems: true }
    })
    if (!booking) return { success: false, error: "Reserva no encontrada" }

    // 1. Actualizar BookingRequest
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { 
        depositAmount: amount,
        paymentStatus: amount > 0 ? "paid" : "pendiente"
      }
    })

    // 2. Si tiene evento sincronizado, actualizarlo también
    if (booking.eventId) {
      const discount = Number(booking.discountAmount || 0)
      const lineItemsTotal = (booking.lineItems || []).reduce((acc: number, it: any) => acc + Number(it.lineTotal || (it.quantity * it.unitCost) || 0), 0)
      const subtotal = Math.max(0, Number(booking.baseAmount || 0) + Number(booking.viaticosAmount || 0) + lineItemsTotal - discount)
      const hasInvoice = Boolean(booking.invoice || booking.event?.invoice)
      const ivaAmount = hasInvoice ? (booking.event?.ivaAmount || Math.round(subtotal * 0.16 * 100) / 100) : 0
      const totalWithTax = subtotal + ivaAmount
      const balance = Math.max(0, totalWithTax - amount)

      await db.event.update({
        where: { id: booking.eventId },
        data: {
          deposit: amount,
          balance: balance
        }
      })

      // 3. Sincronizar tabla de pagos (Payment)
      const existingPayment = await db.payment.findFirst({
        where: { bookingRequestId: bookingId }
      })

      if (existingPayment) {
        if (amount > 0) {
          await db.payment.update({
            where: { id: existingPayment.id },
            data: { amount }
          })
        } else {
          // Si el anticipo se edita a 0, borramos el registro de pago
          await db.payment.delete({
            where: { id: existingPayment.id }
          })
        }
      } else if (amount > 0) {
        // Crear nuevo registro de pago
        await db.payment.create({
          data: {
            eventId: booking.eventId,
            bookingRequestId: bookingId,
            amount,
            method: "TRANSFER",
            status: "completed",
            reference: "Anticipo Manual"
          }
        })
      }
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    if (booking.shortId) {
      revalidatePath(`/admin/ventas/${booking.shortId}`)
      revalidatePath(`/status/${booking.shortId}`)
      revalidatePath(`/propuesta/${booking.shortId}`)
    }
    revalidatePath("/admin/eventos")
    revalidatePath("/admin/eventualidades")
    revalidatePath("/admin")

    if (booking.eventId) {
      const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
      syncEventToGoogleCalendar(booking.eventId).catch(e => console.error("Error syncing to Google Calendar:", e))
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating deposit amount:", error)
    return { success: false, error: "Error al actualizar el anticipo." }
  }
}

export async function markLeadContactedAction(bookingId: string) {
  try {
    const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    if (!booking) return { success: false, error: "Registro no encontrado" }

    await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: "contactado",
        adminNote: booking.adminNote 
          ? `${booking.adminNote} | Contactado por WhatsApp` 
          : "Contactado por WhatsApp"
      }
    })

    if (booking.sourceInquiryId) {
      await db.contactInquiry.update({
        where: { id: booking.sourceInquiryId },
        data: { status: "contactado" }
      }).catch(() => {})
    }

    revalidatePath("/admin/ventas")
    return { success: true }
  } catch (error) {
    console.error("Error marking lead as contacted:", error)
    return { success: false, error: "Error al actualizar prospecto" }
  }
}

export async function scheduleLeadCallAction(bookingId: string, notes?: string) {
  try {
    const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    if (!booking) return { success: false, error: "Registro no encontrado" }

    const updatedNote = notes?.trim()
      ? (booking.adminNote ? `${booking.adminNote} | Llamada: ${notes.trim()}` : `Llamada: ${notes.trim()}`)
      : (booking.adminNote ? `${booking.adminNote} | Llamada técnica agendada` : "Llamada técnica agendada")

    await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: "llamada_agendada",
        adminNote: updatedNote
      }
    })

    if (booking.sourceInquiryId) {
      await db.contactInquiry.update({
        where: { id: booking.sourceInquiryId },
        data: { status: "llamada_agendada" }
      }).catch(() => {})
    }

    revalidatePath("/admin/ventas")
    return { success: true }
  } catch (error) {
    console.error("Error scheduling lead call:", error)
    return { success: false, error: "Error al agendar llamada" }
  }
}

export async function updateTotalAmountAction(
  bookingId: string, 
  baseAmount: number, 
  viaticosAmount?: number,
  discountAmount?: number
) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { event: true, lineItems: true, payments: true }
    })
    if (!booking) return { success: false, error: "Reserva no encontrada" }

    const finalBase = Math.max(0, baseAmount)
    const finalViaticos = viaticosAmount !== undefined ? Math.max(0, viaticosAmount) : Number(booking.viaticosAmount || 0)
    const finalDiscount = discountAmount !== undefined ? Math.max(0, discountAmount) : Number(booking.discountAmount || 0)
    const lineItemsTotal = (booking.lineItems || []).reduce((acc: number, it: any) => acc + Number(it.lineTotal || (it.quantity * it.unitCost) || 0), 0)
    
    // Subtotal antes de impuestos
    const subtotal = Math.max(0, finalBase + finalViaticos + lineItemsTotal - finalDiscount)

    const hasInvoice = Boolean(booking.invoice || booking.event?.invoice)
    const ivaAmount = hasInvoice ? Math.round(subtotal * 0.16 * 100) / 100 : 0
    const totalWithTax = subtotal + ivaAmount

    // Anticipo oficial de Vendetta: exactamente el 30% del Total Final
    const requiredDeposit = Math.round(totalWithTax * 0.3)
    const currentDeposit = Number(booking.depositAmount || 0)

    // Recalcular anticipo dinámicamente si no ha sido liquidado
    const isPaid = booking.paymentStatus === "paid"
    const finalDeposit = (isPaid && currentDeposit >= totalWithTax) 
      ? currentDeposit 
      : requiredDeposit

    // Saldo pendiente: Total Final - Anticipo Pagado (o pagos registrados)
    const paidAmount = (booking.payments || []).filter(p => p.status === 'completed' || p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
    const balance = isPaid ? 0 : Math.max(0, totalWithTax - paidAmount)

    // 1. Actualizar BookingRequest
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        baseAmount: finalBase,
        viaticosAmount: finalViaticos,
        discountAmount: finalDiscount,
        depositAmount: finalDeposit,
      }
    })

    // 2. Si tiene evento sincronizado, actualizarlo también
    if (booking.eventId) {
      await db.event.update({
        where: { id: booking.eventId },
        data: {
          amount: subtotal,
          deposit: finalDeposit,
          ivaAmount: ivaAmount,
          totalWithTax: totalWithTax,
          balance: balance
        }
      })

      if (booking.event?.quoteId) {
        await db.quote.update({
          where: { id: booking.event.quoteId },
          data: { totalEstimated: totalWithTax }
        }).catch(() => {})
        await db.quoteItem.updateMany({
          where: { quoteId: booking.event.quoteId },
          data: { unitCost: finalBase }
        }).catch(() => {})
      }

      const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
      syncEventToGoogleCalendar(booking.eventId).catch(e => console.error("Error syncing to Google Calendar:", e))
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    if (booking.shortId) {
      revalidatePath(`/admin/ventas/${booking.shortId}`)
      revalidatePath(`/propuesta/${booking.shortId}`)
      revalidatePath(`/status/${booking.shortId}`)
    }
    revalidatePath("/admin/eventos")
    revalidatePath("/admin/eventualidades")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error updating total amount:", error)
    return { success: false, error: "Error al actualizar el total del evento." }
  }
}

export async function reportDepositAction(bookingId: string, paymentRef: string) {
  try {
    const booking = await db.bookingRequest.findUnique({
      where: { id: bookingId }
    })
    if (!booking) return { success: false, error: "Reserva no encontrada" }

    await db.bookingRequest.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "review",
        paymentRef: paymentRef || "Reportado por Cliente"
      }
    })

    // 1. Alerta inmediata al Administrador por WhatsApp
    try {
      const { dispatchAdminAlert } = await import("@/lib/notifications")
      const { getAppUrl } = await import("@/lib/url")
      const { formatDateMX } = await import("@/lib/utils")
      const baseUrl = getAppUrl()
      const dateStr = formatDateMX(booking.requestedDate, "d 'de' MMMM")
      
      await dispatchAdminAlert(
        `🎉 *COTIZACIÓN APROBADA — VENDETTA*\n\n` +
        `El cliente *${booking.clientName}* ha aprobado su cotización y reportó su anticipo.\n\n` +
        `📋 *Folio:* ${booking.shortId}\n` +
        `📅 *Fecha:* ${dateStr}\n` +
        `💰 *Monto Anticipo:* $${(booking.depositAmount || 0).toLocaleString("es-MX")}\n` +
        `🔢 *Referencia:* ${paymentRef || "Reportado en web"}\n` +
        `📞 *Teléfono:* ${booking.clientPhone || "No registrado"}\n\n` +
        `👉 *Revisar y Validar en:* ${baseUrl}/admin/ventas/${booking.id}`
      )
    } catch (alertErr) {
      console.error("Error sending admin alert on quote approval:", alertErr)
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    revalidatePath(`/status/${booking.shortId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Error reporting deposit:", error)
    return { success: false, error: "Error al reportar el depósito." }
  }
}

export async function updateEventOperationalCostsAction(
  bookingId: string,
  customMusicianPay: number | null,
  customStaffPay: number | null
) {
  try {
    const trimmedId = bookingId?.trim()
    if (!trimmedId) return { success: false, error: "ID de reserva no proporcionado" }

    const cleanMusicianPay = customMusicianPay !== null && customMusicianPay !== undefined && !isNaN(customMusicianPay)
      ? Math.max(0, customMusicianPay)
      : null

    const cleanStaffPay = customStaffPay !== null && customStaffPay !== undefined && !isNaN(customStaffPay)
      ? Math.max(0, customStaffPay)
      : null

    // 1. Buscar BookingRequest
    const booking = await db.bookingRequest.findFirst({
      where: {
        OR: [
          { id: trimmedId },
          { shortId: trimmedId.toUpperCase() }
        ]
      },
      include: { event: true }
    })

    if (booking) {
      await db.bookingRequest.update({
        where: { id: booking.id },
        data: {
          customMusicianPay: cleanMusicianPay,
          customStaffPay: cleanStaffPay
        }
      })

      if (booking.eventId) {
        await db.event.update({
          where: { id: booking.eventId },
          data: {
            customMusicianPay: cleanMusicianPay,
            customStaffPay: cleanStaffPay
          }
        })
      }

      revalidatePath("/admin/ventas")
      revalidatePath(`/admin/ventas/${booking.id}`)
      if (booking.shortId) revalidatePath(`/admin/ventas/${booking.shortId}`)
      revalidatePath("/admin/eventos")
      revalidatePath("/admin/eventualidades")
      revalidatePath("/admin")

      return { success: true }
    }

    // 2. Soporte para cotizaciones legacy (Quote)
    const quote = await db.quote.findFirst({
      where: { id: trimmedId },
      include: { event: true }
    })

    if (quote && quote.event) {
      await db.event.update({
        where: { id: quote.event.id },
        data: {
          customMusicianPay: cleanMusicianPay,
          customStaffPay: cleanStaffPay
        }
      })

      revalidatePath("/admin/ventas")
      revalidatePath(`/admin/ventas/${quote.id}`)
      revalidatePath("/admin/eventos")
      revalidatePath("/admin")

      return { success: true }
    }

    return { success: false, error: "Reserva o evento no encontrado" }
  } catch (error: any) {
    console.error("Error updating operational costs:", error)
    return { success: false, error: error?.message || "Error al actualizar los costos operativos." }
  }
}

/**
 * Descarte comercial rápido de un lead o cotización:
 * Actualiza el status a 'cancelado', registra el motivo y la fecha de cierre.
 */
export async function discardLeadAction({ 
  bookingId, 
  reason 
}: { 
  bookingId: string
  reason: string 
}) {
  try {
    const trimmedId = bookingId?.trim()
    const trimmedReason = reason?.trim() || "Descarte comercial manual"
    if (!trimmedId) return { success: false, error: "ID de lead no proporcionado." }

    const booking = await db.bookingRequest.findFirst({
      where: {
        OR: [
          { id: trimmedId },
          { shortId: trimmedId.toUpperCase() }
        ]
      }
    })

    if (!booking) {
      // Soporte para cotizaciones legacy (Quote)
      const quote = await db.quote.findFirst({
        where: { id: trimmedId }
      })

      if (quote) {
        await db.quote.update({
          where: { id: quote.id },
          data: { status: "cancelado" }
        })
        revalidatePath("/admin/ventas")
        revalidatePath("/admin")
        return { success: true }
      }

      return { success: false, error: "Lead o solicitud no encontrada." }
    }

    const now = new Date()

    // 1. Actualizar BookingRequest
    await db.bookingRequest.update({
      where: { id: booking.id },
      data: {
        status: "cancelado",
        cancellationReason: trimmedReason,
        closedAt: now
      }
    })

    // 2. Si tiene ContactInquiry asociado, sincronizar a cancelado
    if (booking.sourceInquiryId) {
      await db.contactInquiry.update({
        where: { id: booking.sourceInquiryId },
        data: {
          status: "cancelado"
        }
      }).catch(e => console.warn("Could not cancel linked inquiry:", e))
    }

    // 3. Si tiene Event asociado, cancelar
    if (booking.eventId) {
      await db.event.updateMany({
        where: { id: booking.eventId },
        data: {
          status: "cancelado"
        }
      }).catch(e => console.warn("Could not cancel linked event:", e))
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${booking.id}`)
    revalidatePath("/admin/eventos")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Error in discardLeadAction:", error)
    return { success: false, error: error?.message || "Error al descartar el prospecto." }
  }
}

export async function approveAndSendProposalAction(params: {
  bookingId: string
  baseAmount: number
  viaticosAmount?: number
  discountAmount?: number
  depositAmount?: number
  packageName?: string
}) {
  try {
    const trimmedId = params.bookingId?.trim()
    if (!trimmedId) return { success: false, error: "ID de solicitud no proporcionado." }

    const base = Number(params.baseAmount) || 0
    const viaticos = Number(params.viaticosAmount) || 0
    const discount = Number(params.discountAmount) || 0
    const total = base + viaticos - discount

    if (total <= 0 || base <= 0) {
      return { 
        success: false, 
        error: "Debes definir un precio base mayor a 0 para aprobar y enviar la propuesta oficial." 
      }
    }

    const booking = await db.bookingRequest.findFirst({
      where: {
        OR: [
          { id: trimmedId },
          { shortId: trimmedId.toUpperCase() }
        ]
      },
      include: {
        client: true
      }
    })

    if (!booking) {
      return { success: false, error: "Solicitud de cotización no encontrada." }
    }

    const deposit = params.depositAmount && params.depositAmount > 0
      ? params.depositAmount
      : Math.round(total * 0.3)

    const updatedPackage = params.packageName?.trim() || booking.packageName || "Show Vendetta"

    // 1. Actualizar el BookingRequest
    await db.bookingRequest.update({
      where: { id: booking.id },
      data: {
        baseAmount: base,
        viaticosAmount: viaticos,
        discountAmount: discount,
        depositAmount: deposit,
        packageName: updatedPackage,
        status: "propuesta_enviada"
      }
    })

    // 2. Si tiene ContactInquiry asociado, sincronizar estatus
    if (booking.sourceInquiryId) {
      await db.contactInquiry.update({
        where: { id: booking.sourceInquiryId },
        data: { status: "propuesta_enviada" }
      }).catch(e => console.warn("Could not update inquiry status:", e))
    }

    // 3. Enviar WhatsApp oficial al cliente con el enlace personalizado https://vendetta.mx/status/{folio}
    const cleanPhone = (booking.clientPhone || booking.client?.whatsapp || "").replace(/\D/g, "")
    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: true,
        warning: "Propuesta aprobada pero el cliente no tiene un teléfono de WhatsApp válido de 10 dígitos para enviar la notificación automática."
      }
    }

    const fechaFormateada = booking.requestedDate ? formatDateMX(booking.requestedDate, "dd 'de' MMMM 'de' yyyy") : "tu fecha elegida"
    const proposalLink = `https://vendetta.mx/status/${booking.shortId}`

    const clientMsg = `Hola ${booking.clientName.trim()}, somos *Vendetta Live Music* 🎸.

Es un gusto saludarte. Hemos revisado la logística de tu evento para el *${fechaFormateada}* y tu propuesta oficial ya está lista y aprobada:

👉 ${proposalLink}

En este enlace podrás consultar el desglose de producción, detalles técnicos y apartar tu fecha con disponibilidad garantizada.

Quedamos a tus órdenes para afinar cualquier detalle. ¡Rock on! 🤘

—
*Vendetta Live Music* | _vendetta.mx_`

    const { sendWhatsApp } = await import("@/lib/notifications/whatsapp")
    const { messageId, error: waError } = await sendWhatsApp(
      cleanPhone, 
      clientMsg, 
      `Propuesta Aprobada [${booking.shortId}] - ${booking.clientName}`
    )

    // 4. Registro en el historial de Notificaciones
    await db.notification.create({
      data: {
        bookingRequestId: booking.id,
        type: "client_quote",
        channel: "whatsapp",
        recipient: cleanPhone,
        status: messageId ? "sent" : "failed",
        message: clientMsg,
        template: "client_quote",
        messageId: messageId || undefined,
        errorDetails: waError || null,
        category: "quote_approved"
      }
    }).catch(e => console.warn("Could not log notification:", e))

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${booking.id}`)
    revalidatePath(`/status/${booking.shortId}`)

    return { 
      success: true, 
      message: messageId 
        ? `Propuesta aprobada y enviada a ${booking.clientName} por WhatsApp.` 
        : `Propuesta guardada con estado 'Propuesta Enviada', pero Evolution API reportó: ${waError || "Sin confirmación de entrega"}.`
    }
  } catch (error: any) {
    console.error("Error in approveAndSendProposalAction:", error)
    return { success: false, error: error?.message || "Error al aprobar y enviar la propuesta." }
  }
}

