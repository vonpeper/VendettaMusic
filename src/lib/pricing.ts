/**
 * Motor Centralizado de Cálculos Financieros de Vendetta Music
 *
 * Fórmula única y estricta:
 *   subtotal = basePrice + viaticosAmount + additionalItemsTotal - discountAmount
 *   ivaAmount = invoice ? Math.round(subtotal * 0.16 * 100) / 100 : 0
 *   totalAmount = subtotal + ivaAmount
 *   balanceAmount = Math.max(0, Math.round((totalAmount - depositAmount) * 100) / 100)
 */

export interface AdditionalLineItem {
  id?: string
  description: string
  quantity: number
  unitCost: number
}

export interface CalculateQuoteInput {
  basePrice: number | null | undefined
  viaticosAmount?: number | null | undefined
  discountAmount?: number | null | undefined
  additionalItems?: AdditionalLineItem[] | null | undefined
  invoice?: boolean | null | undefined
  depositAmount?: number | null | undefined
}

export interface QuoteTotalsResult {
  basePrice: number
  viaticosAmount: number
  additionalItemsTotal: number
  discountAmount: number
  subtotal: number
  ivaAmount: number
  totalAmount: number
  depositAmount: number
  balanceAmount: number
  isFullyPaid: boolean
  depositExceedsTotal: boolean
  depositError: string | null
}

/**
 * Valida que el anticipo solicitado sea coherente con el total del evento
 */
export function validatePlannedDeposit(depositAmount: number, totalAmount: number): { isValid: boolean; error?: string } {
  const dep = roundCurrency(depositAmount)
  const tot = roundCurrency(totalAmount)

  if (dep < 0) {
    return { isValid: false, error: "El anticipo solicitado no puede ser negativo" }
  }
  if (dep > tot && tot > 0) {
    return { isValid: false, error: `El anticipo solicitado ($${dep.toLocaleString("es-MX")}) no puede superar el total del evento ($${tot.toLocaleString("es-MX")})` }
  }
  return { isValid: true }
}

/**
 * Normaliza valores numéricos garantizando redondeo a 2 decimales y evitando NaN
 */
export function roundCurrency(amount: number | null | undefined): number {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    return 0
  }
  return Math.round(amount * 100) / 100
}

/**
 * Calcula los totales consolidados de una cotización o evento.
 */
export function calculateQuoteTotals(input: CalculateQuoteInput): QuoteTotalsResult {
  const basePrice = Math.max(0, roundCurrency(input.basePrice))
  const viaticosAmount = Math.max(0, roundCurrency(input.viaticosAmount))
  const discountAmount = Math.max(0, roundCurrency(input.discountAmount))

  // Calcular importe de conceptos adicionales
  let additionalItemsTotal = 0
  if (Array.isArray(input.additionalItems)) {
    for (const item of input.additionalItems) {
      const qty = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1
      const unitCost = Math.max(0, roundCurrency(item.unitCost))
      additionalItemsTotal += roundCurrency(qty * unitCost)
    }
  }
  additionalItemsTotal = roundCurrency(additionalItemsTotal)

  // Subtotal antes de impuestos
  const rawSubtotal = basePrice + viaticosAmount + additionalItemsTotal - discountAmount
  const subtotal = Math.max(0, roundCurrency(rawSubtotal))

  // IVA (16%) si requiere factura
  const ivaAmount = input.invoice ? roundCurrency(subtotal * 0.16) : 0

  // Total final
  const totalAmount = roundCurrency(subtotal + ivaAmount)

  // Anticipo y Saldo
  const rawDeposit = roundCurrency(input.depositAmount)
  const isNegativeDeposit = rawDeposit < 0
  const depositExceedsTotal = isNegativeDeposit || (totalAmount > 0 && rawDeposit > totalAmount)
  const depositError = isNegativeDeposit
    ? "El anticipo solicitado no puede ser negativo"
    : depositExceedsTotal
    ? `El anticipo solicitado ($${rawDeposit.toLocaleString("es-MX")}) no puede superar el total ($${totalAmount.toLocaleString("es-MX")})`
    : null

  const depositAmount = Math.max(0, rawDeposit)
  const balanceAmount = Math.max(0, roundCurrency(totalAmount - depositAmount))
  const isFullyPaid = totalAmount > 0 && depositAmount >= totalAmount

  return {
    basePrice,
    viaticosAmount,
    additionalItemsTotal,
    discountAmount,
    subtotal,
    ivaAmount,
    totalAmount,
    depositAmount,
    balanceAmount,
    isFullyPaid,
    depositExceedsTotal,
    depositError
  }
}

/**
 * Formatea un monto numérico a formato moneda mexicana (ej. $12,500.00 MXN)
 */
export function formatCurrencyMXN(amount: number | null | undefined, includeDecimals = true): string {
  const value = roundCurrency(amount)
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0
  }).format(value)
}
