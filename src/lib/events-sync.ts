import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export interface EventFinancialInput {
  baseAmount: number
  viaticosAmount?: number
  discountAmount?: number
  additionalItemsTotal?: number
  invoice?: boolean
  depositAmount?: number // Anticipo cobrado / confirmado
}

export interface CalculatedFinancials {
  baseAmount: number
  viaticosAmount: number
  additionalItemsTotal: number
  discountAmount: number
  subtotal: number
  ivaAmount: number
  totalWithTax: number
  deposit: number
  balance: number
  invoice: boolean
}

/**
 * Motor canónico de cálculo financiero para eventos y cotizaciones.
 * Garantiza que Base, Viáticos, Adicionales, Descuento, IVA y Anticipo
 * sigan exactamente la misma fórmula matemática sin sobreescrituras silenciosas.
 */
export function computeCanonicalFinancials(input: EventFinancialInput): CalculatedFinancials {
  const base = Math.max(0, Math.round((Number(input.baseAmount) || 0) * 100) / 100)
  const viaticos = Math.max(0, Math.round((Number(input.viaticosAmount) || 0) * 100) / 100)
  const additional = Math.max(0, Math.round((Number(input.additionalItemsTotal) || 0) * 100) / 100)
  const discount = Math.max(0, Math.round((Number(input.discountAmount) || 0) * 100) / 100)

  const subtotal = Math.max(0, Math.round((base + viaticos + additional - discount) * 100) / 100)
  const hasInvoice = Boolean(input.invoice)
  const ivaAmount = hasInvoice ? Math.round(subtotal * 0.16 * 100) / 100 : 0
  const totalWithTax = Math.round((subtotal + ivaAmount) * 100) / 100

  // Si se pasa depositAmount explícito (incluso 0), se respeta estrictamente.
  // Nunca forzar 50% ni sobrescribir $0 sin consentimiento del usuario.
  const deposit = input.depositAmount !== undefined && input.depositAmount !== null && !isNaN(Number(input.depositAmount))
    ? Math.max(0, Math.round(Number(input.depositAmount) * 100) / 100)
    : 0

  const balance = Math.max(0, Math.round((totalWithTax - deposit) * 100) / 100)

  return {
    baseAmount: base,
    viaticosAmount: viaticos,
    additionalItemsTotal: additional,
    discountAmount: discount,
    subtotal,
    ivaAmount,
    totalWithTax,
    deposit,
    balance,
    invoice: hasInvoice,
  }
}

/**
 * Revalida de forma atómica y exhaustiva todas las vistas del dashboard y landings
 * afectadas por cambios en un evento o cotización.
 */
export function revalidateEventRoutes(params?: {
  bookingId?: string | null
  shortId?: string | null
  eventId?: string | null
}) {
  try {
    revalidatePath("/admin/ventas")
    revalidatePath("/admin/ventas", "page")
    if (params?.bookingId) {
      revalidatePath(`/admin/ventas/${params.bookingId}`)
    }
    if (params?.shortId) {
      revalidatePath(`/admin/ventas/${params.shortId}`)
      revalidatePath(`/propuesta/${params.shortId}`)
      revalidatePath(`/status/${params.shortId}`)
    }
    revalidatePath("/admin/ventas/[id]", "page")
    revalidatePath("/admin/eventos")
    revalidatePath("/admin/eventualidades")
    revalidatePath("/admin/finanzas")
    revalidatePath("/agenda")
    revalidatePath("/admin")
  } catch (err) {
    console.warn("⚠️ Error en revalidateEventRoutes (ignorado si no está en contexto de request):", err)
  }
}
