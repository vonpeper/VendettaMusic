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
    
    // Sincronizar con Event y Quote si existen
    const br = await db.bookingRequest.findUnique({ where: { id: bookingId } })
    if (br) {
      if (br.eventId) {
        await db.event.update({
          where: { id: br.eventId },
          data: { status: "completado" }
        })
      }
      // Si es legacy y tiene quoteId (asumiendo que podría existir una relación indirecta o si bookingRequest se convirtió de Quote)
      // Pero usualmente BookingRequest e Event son la pareja principal ahora.
    }

    revalidatePath("/admin/ventas")
    return { success: true }
  } catch (error) {
    console.error("Error marking booking as completed:", error)
    return { success: false, error: "Error al completar el contrato." }
  }
}

export async function updateBookingStatusAction(bookingId: string, newStatus: string) {
  try {
    const brCheck = await db.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          include: {
            client: true,
            location: true,
          }
        }
      }
    })

    if (!brCheck) return { success: false, error: "Booking no encontrada." }

    if (newStatus === "agendado") {
      // 1. Validadores estrictos
      if (!brCheck.requestedDate) return { success: false, error: "Falta definir la fecha del evento." }
      if (!brCheck.packageId && !brCheck.packageName) return { success: false, error: "Falta asignar un paquete." }
      if (!brCheck.clientName || !brCheck.clientPhone) return { success: false, error: "Falta asignar información del cliente." }

      // 2. Crear o actualizar ClientProfile (Fuente de la verdad)
      let clientId = brCheck.clientId || brCheck.event?.clientId
      
      // Si no hay clientId pero tenemos correo, intentamos buscar el usuario
      let userId = brCheck.clientUserId
      if (!userId && brCheck.clientEmail) {
        const user = await db.user.upsert({
          where: { email: brCheck.clientEmail },
          create: {
            email: brCheck.clientEmail,
            name: brCheck.clientName,
            role: "CLIENT",
          },
          update: {
            name: brCheck.clientName,
          }
        })
        userId = user.id
      } else if (!userId) {
        // Fallback: Si no hay correo, creamos un usuario placeholder
        const user = await db.user.create({
          data: {
            name: brCheck.clientName,
            role: "CLIENT",
          }
        })
        userId = user.id
      }

      if (userId) {
        const clientProfile = await db.clientProfile.upsert({
          where: { userId: userId },
          create: {
            userId: userId,
            whatsapp: brCheck.clientPhone,
            city: brCheck.city,
            state: brCheck.state,
          },
          update: {
            whatsapp: brCheck.clientPhone,
            city: brCheck.city,
            state: brCheck.state,
          }
        })
        clientId = clientProfile.id
      }

      // 3. Crear o actualizar Location
      let locationId = brCheck.event?.locationId
      if (brCheck.address || brCheck.venueType) {
        const locationName = `Show - ${brCheck.clientName} (${brCheck.shortId || 'Web'})`
        const locationAddress = [brCheck.calle, brCheck.numero, brCheck.colonia, brCheck.municipio, brCheck.state, brCheck.zipCode].filter(Boolean).join(", ") || brCheck.address

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
            amount:           brCheck.baseAmount,
            deposit:          brCheck.depositAmount,
            balance:          brCheck.baseAmount - brCheck.depositAmount,
            totalIncome:      brCheck.baseAmount,
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
          where: { id: bookingId },
          data:  { eventId: eventId }
        })

        // Asignar automáticamente los músicos titulares al evento
        const { assignDefaultMusicians } = await import("@/lib/musicians")
        await assignDefaultMusicians(eventId, db)

        // Sincronizar con Google Calendar si la integración está activa
        try {
          const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
          await syncEventToGoogleCalendar(eventId)
        } catch (calErr) {
          console.error("⚠️ Error syncing confirmed funnel event to Google Calendar:", calErr)
        }
      } else {
        await db.event.update({
          where: { id: eventId },
          data: {
            clientId: clientId,
            locationId: locationId,
            status: newStatus
          }
        })
      }
      
      // 5. Actualizar el BookingRequest con el clientId
      await db.bookingRequest.update({
        where: { id: bookingId },
        data: {
          clientId: clientId,
          clientUserId: userId,
        }
      })
    }

    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { 
        status: newStatus,
        ...(newStatus === "completado" ? { paymentStatus: "paid" } : {})
      }
    })

    // Sincronizar con Event
    const br = await db.bookingRequest.findUnique({ 
      where: { id: bookingId },
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

    if (br?.eventId && br.event) {
      if (newStatus !== "agendado") {
        await db.event.update({
          where: { id: br.eventId },
          data: { status: newStatus }
        })
      }

      if (newStatus === "agendado") {
        // Verificamos de forma independiente si ya se le avisó al cliente
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
          })
        }
        // No notificar automáticamente al staff al agendar. El admin lo hará manualmente.
      }

      if (newStatus === "cancelado") {
        console.log(`⚠️ updateBookingStatusAction: Detectada cancelación para contrato ${bookingId}. Notificando...`)
        await notifyEventCancellation(br.eventId, db).catch(e => console.error("Error sending cancellation notifications:", e))
      }
    }

    revalidatePath("/admin/ventas")
    revalidatePath("/admin/eventos")

    if (br?.eventId) {
      const { syncEventToGoogleCalendar } = await import("@/lib/google-calendar")
      syncEventToGoogleCalendar(br.eventId).catch(e => console.error("Error syncing to Google Calendar:", e))
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating booking status:", error)
    return { success: false, error: "Error al actualizar el estado." }
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
      where: { id: bookingId }
    })
    
    if (!booking) return { success: false, error: "Reserva no encontrada" }

    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { paymentStatus: "paid" } // Lo marcamos como pagado (el anticipo)
    })

    if (booking.eventId) {
      // Crear registro de pago
      const existingPayments = await db.payment.findMany({
        where: { bookingRequestId: booking.id, status: { in: ["completed", "paid"] } }
      });
      
      if (existingPayments.length === 0) {
        await db.payment.create({
          data: {
            eventId: booking.eventId,
            bookingRequestId: booking.id,
            amount: booking.depositAmount || 0,
            method: "TRANSFER",
            status: "completed",
            reference: "Anticipo Manual"
          }
        })
      }

      // Al confirmar anticipo, actualizamos el balance del evento
      await db.event.update({
        where: { id: booking.eventId },
        data: { 
          deposit: booking.depositAmount,
          balance: booking.baseAmount - booking.depositAmount
        }
      })
    }

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
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
      where: { id: bookingId }
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
      await db.event.update({
        where: { id: booking.eventId },
        data: {
          deposit: amount,
          balance: booking.baseAmount - amount
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

    revalidatePath("/admin/ventas")
    revalidatePath(`/admin/ventas/${bookingId}`)
    revalidatePath(`/status/${booking.shortId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Error reporting deposit:", error)
    return { success: false, error: "Error al reportar el depósito." }
  }
}
