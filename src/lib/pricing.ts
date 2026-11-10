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
  subtotalBeforeDiscount: number
  subtotal: number
  ivaAmount: number
  totalAmount: number
  requiredDeposit: number
  depositAmount: number
  balanceAmount: number
  isFullyPaid: boolean
  depositExceedsTotal: boolean
  depositError: string | null
}

/**
 * Calcula el anticipo oficial requerido por Vendetta Music (exactamente el 50% del Total Final).
 */
export function calculateRequiredDeposit(totalAmount: number): number {
  return Math.round(Math.max(0, roundCurrency(totalAmount)) * 0.5)
}

export interface OfficeProfitInput {
  subtotal: number
  viaticos: number
  productionProviderCost?: number
  bandPayroll: number
}

export interface OfficeProfitResult {
  baseGravableShow: number
  realOfficeProfit: number
  profitMarginPercent: number
}

/**
 * Calcula la Utilidad Neta Real de Oficina excluyendo viáticos e IVA:
 * - Viáticos y fletes son costos de paso al 100% (margen 0).
 * - El IVA facturado es pasivo fiscal para el SAT y no forma parte del margen.
 * - BaseGravableShow = SubtotalCliente - ViáticosTotales - CostosProveedorProduccion
 * - UtilidadOficina = BaseGravableShow - NóminaTotalBanda
 */
export function calculateOfficeProfit({
  subtotal,
  viaticos,
  productionProviderCost = 0,
  bandPayroll
}: OfficeProfitInput): OfficeProfitResult {
  const safeSubtotal = Math.max(0, roundCurrency(subtotal))
  const safeViaticos = Math.max(0, roundCurrency(viaticos))
  const safeProduction = Math.max(0, roundCurrency(productionProviderCost))
  const safePayroll = Math.max(0, roundCurrency(bandPayroll))

  const baseGravableShow = safeSubtotal - safeViaticos - safeProduction
  const realOfficeProfit = baseGravableShow - safePayroll
  const profitMarginPercent = safeSubtotal > 0
    ? roundCurrency((realOfficeProfit / safeSubtotal) * 100)
    : 0

  return {
    baseGravableShow,
    realOfficeProfit,
    profitMarginPercent
  }
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

  // Subtotal base antes de descuentos
  const subtotalBeforeDiscount = roundCurrency(basePrice + viaticosAmount + additionalItemsTotal)

  // Subtotal neto (Base + Viáticos + Adicionales - Descuento)
  const rawSubtotal = subtotalBeforeDiscount - discountAmount
  const subtotal = Math.max(0, roundCurrency(rawSubtotal))

  // IVA (16%) si requiere factura
  const ivaAmount = input.invoice ? roundCurrency(subtotal * 0.16) : 0

  // Total final
  const totalAmount = roundCurrency(subtotal + ivaAmount)
  const requiredDeposit = calculateRequiredDeposit(totalAmount)

  // Anticipo y Saldo: Si se pasa explícito se respeta; sino por defecto el 30% oficial
  const hasExplicitDeposit = input.depositAmount !== null && input.depositAmount !== undefined && !isNaN(input.depositAmount)
  const rawDeposit = hasExplicitDeposit ? roundCurrency(input.depositAmount) : requiredDeposit
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
    subtotalBeforeDiscount,
    subtotal,
    ivaAmount,
    totalAmount,
    requiredDeposit,
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

/**
 * Calcula el costo base del show aplicando la regla foránea (+20% si el destino está fuera de la zona local).
 *
 * Regla de negocio oficial de Vendetta Music:
 * - Local (Metepec / Toluca <= 25km): baseLocalPrice ($8,500 para Essential 2h)
 * - Foráneo (> 25km o fuera de zona local): baseLocalPrice * 1.20 ($10,200 para Essential 2h)
 */
export function calculateShowBasePrice(baseLocalPrice: number, isOutsideZone: boolean): number {
  const price = Math.max(0, roundCurrency(baseLocalPrice))
  if (!isOutsideZone) {
    return price
  }
  return Math.round(price * 1.2)
}

/**
 * Parsea un string de hora en formato 12h ("04:00 PM", "8:30 am") o 24h ("16:00", "04:30") a minutos desde medianoche.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null
  const clean = timeStr.trim().toUpperCase()

  // Formato 12 horas: HH:MM AM/PM
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (match12) {
    let hours = parseInt(match12[1], 10)
    const minutes = parseInt(match12[2], 10)
    const modifier = match12[3]

    if (hours === 12) {
      hours = modifier === "AM" ? 0 : 12
    } else if (modifier === "PM") {
      hours += 12
    }
    return hours * 60 + minutes
  }

  // Formato 24 horas: HH:MM
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/)
  if (match24) {
    const hours = parseInt(match24[1], 10)
    const minutes = parseInt(match24[2], 10)
    return hours * 60 + minutes
  }

  return null
}

/**
 * Calcula la duración en horas entre dos horarios. Si cruza medianoche, suma 24 horas.
 * Si los horarios son iguales (ej. 00:00 y 00:00 o no definidos), devuelve 2 horas base.
 * Devuelve como mínimo 1 hora y redondea a 1 decimal.
 */
export function calculateEventHours(startTimeStr?: string | null, endTimeStr?: string | null): number {
  if (!startTimeStr || !endTimeStr) return 2

  const startMins = parseTimeToMinutes(startTimeStr)
  const endMins = parseTimeToMinutes(endTimeStr)

  if (startMins === null || endMins === null || startMins === endMins) {
    return 2
  }

  let diffMins = endMins - startMins
  if (diffMins < 0) {
    diffMins += 24 * 60
  }

  const hours = diffMins / 60
  const rounded = Math.round(hours * 10) / 10
  return Math.max(1, rounded)
}

/**
 * Tabulador oficial de pago a músicos (Vendetta Music):
 * - Duración base = 2 horas -> $1,500 MXN base por músico (o base configurada).
 * - Duración > 2 horas: cálculo proporcional:
 *   suggestedMusicianPay = Math.round((baseMusicianPay / 2) * durationHours)
 *   * 2h: ($1,500 / 2) * 2 = $1,500 por músico
 *   * 3h: ($1,500 / 2) * 3 = $2,250 por músico
 *   * 4h: ($1,500 / 2) * 4 = $3,000 por músico
 *   * 5h: ($1,500 / 2) * 5 = $3,750 por músico
 * - Si customMusicianPay está provisto (> 0), se respeta el monto manual.
 */
export function calculateSuggestedMusicianPay(
  durationHours: number = 2,
  baseMusicianPay: number = 1500,
  customMusicianPay?: number | null
): number {
  if (customMusicianPay !== undefined && customMusicianPay !== null && !isNaN(customMusicianPay) && customMusicianPay > 0) {
    return Math.round(customMusicianPay)
  }
  const h = Math.max(1, durationHours)
  const base = Math.max(0, baseMusicianPay)
  return Math.max(base, Math.round((base / 2) * h))
}

/**
 * Retorna la tarifa horaria base referencial según el paquete (catálogo oficial Vendetta).
 * - Essential: $4,250 MXN/hr (min 2 hrs = $8,500)
 * - Experience: $7,750 MXN/hr (min 2 hrs = $15,500)
 * - Festival Premium: $12,750 MXN/hr (min 2 hrs = $25,500)
 */
export function getShowPackageHourlyRate(packageName?: string | null): number {
  const name = (packageName || "").toLowerCase()
  if (name.includes("festival")) return 12750
  if (name.includes("experience")) return 7750
  return 4250 // Essential / Show Pop Rock por defecto
}

/**
 * Calcula el precio base del paquete musical según la duración en horas.
 * 
 * Reglas de Negocio Oficiales:
 * - Essential / Show Pop Rock:
 *   - Base 2 Horas: $8,500 MXN (Precio gancho competitivo en Toluca con 4 músicos, staff técnico y audio propio).
 *   - Horas adicionales: +$5,000 MXN / hora ($1,000 para CADA músico, $300 staff, $700 oficina/audio).
 *     2 hrs = $8,500 | 3 hrs = $13,500 | 4 hrs = $18,500 | 5 hrs = $23,500.
 * - Experience:
 *   - Base 2 Horas: $15,500 MXN | Horas adicionales: +$7,750 MXN / hr.
 * - Festival Premium:
 *   - Base 2 Horas: $25,500 MXN | Horas adicionales: +$12,750 MXN / hr.
 */
export function calculateShowPackageBasePrice(packageName?: string | null, hours: number = 2): number {
  const h = Math.max(2, hours)
  const name = (packageName || "").toLowerCase()

  if (name.includes("festival")) {
    return h <= 2 ? 25500 : 25500 + Math.round((h - 2) * 12750)
  }
  if (name.includes("experience")) {
    return h <= 2 ? 15500 : 15500 + Math.round((h - 2) * 7750)
  }

  // Essential / Show Pop Rock estándar
  if (h <= 2) return 8500
  return 8500 + Math.round((h - 2) * 5000)
}

export interface EventCostBreakdown {
  hours: number
  eventType: "privado" | "bar"
  totalPrice: number
  musiciansCount: number
  musicianPayEach: number
  musiciansTotal: number
  staffPay: number
  audioAndOfficeProfit: number
  ownerTotalTakeHome: number
  notes: string
  isCustomMusicianPay?: boolean
  isCustomStaffPay?: boolean
  defaultMusicianPayEach?: number
  defaultStaffPay?: number
}

/**
 * Calcula el desglose interno de nómina y margen para Vendetta.
 * 
 * - Evento Privado (4 músicos + 1 staff + audio propio):
 *   - Músicos: $750/hr c/u ($1,500 c/u mínimo por llamado de 2h).
 *   - Staff Técnico: $300/hr ($600 en 2h).
 *   - Vendetta (Renta de Audio + Margen Oficina): Lo restante del show ($1,900 en 2h base $8,500; +$1,700 por hora extra).
 *   - Ingreso Personal Dueño (Músico + Audio/Oficina): $3,400 en 2h, $5,850 en 3h, etc.
 * 
 * - Evento Bar (Showcase / Vitrina a $3,800 con 4 músicos y staff):
 *   - Staff Técnico: $400 (2h @ $200/hr).
 *   - Músicos: $3,400 ÷ 4 = $850 c/u.
 *   - Vendetta: $0 (0 comisión para maximizar la motivación y lealtad del equipo).
 *   - Ingreso Personal Dueño (como Músico): $850 en bar.
 *
 * Permite montos personalizados opcionales (customMusicianPay y customStaffPay)
 * recalculando automáticamente el remanente de Audio/Oficina y el ingreso del dueño.
 */
export function calculateEventCostBreakdown(
  hours: number = 2,
  eventType: "privado" | "bar" = "privado",
  customTotalPrice?: number,
  customMusicianPay?: number | null,
  customStaffPay?: number | null
): EventCostBreakdown {
  const h = Math.max(1, hours)
  const musiciansCount = 4

  const isCustomMusician = customMusicianPay !== undefined && customMusicianPay !== null && !isNaN(customMusicianPay) && customMusicianPay > 0
  const isCustomStaff = customStaffPay !== undefined && customStaffPay !== null && !isNaN(customStaffPay) && customStaffPay >= 0

  if (eventType === "bar") {
    const barTotal = customTotalPrice ?? 3800
    const defaultStaffPay = Math.round(h * 200)
    const staffPay = isCustomStaff ? Math.round(customStaffPay!) : defaultStaffPay
    const remainingForMusicians = Math.max(0, barTotal - defaultStaffPay)
    const defaultMusicianPayEach = Math.round(remainingForMusicians / musiciansCount)
    const musicianPayEach = isCustomMusician ? Math.round(customMusicianPay!) : defaultMusicianPayEach
    const musiciansTotal = musicianPayEach * musiciansCount
    const audioAndOfficeProfit = barTotal - (musiciansTotal + staffPay)
    const ownerTotalTakeHome = musicianPayEach + audioAndOfficeProfit

    const notes = (isCustomMusician || isCustomStaff)
      ? "Desglose con nómina ajustada manualmente (cálculo de remanente y dueño automático)."
      : "Bar: 100% distribuido entre músicos y staff ($0 comisión de oficina Vendetta para motivar al equipo)."

    return {
      hours: h,
      eventType: "bar",
      totalPrice: barTotal,
      musiciansCount,
      musicianPayEach,
      musiciansTotal,
      staffPay,
      audioAndOfficeProfit,
      ownerTotalTakeHome,
      notes,
      isCustomMusicianPay: isCustomMusician,
      isCustomStaffPay: isCustomStaff,
      defaultMusicianPayEach,
      defaultStaffPay,
    }
  }

  // Evento Privado
  const basePrice = customTotalPrice ?? calculateShowPackageBasePrice("Essential", h)
  const defaultMusicianPayEach = Math.max(1500, Math.round(h * 750))
  const musicianPayEach = isCustomMusician ? Math.round(customMusicianPay!) : defaultMusicianPayEach
  const musiciansTotal = musicianPayEach * musiciansCount
  const defaultStaffPay = Math.round(h * 300)
  const staffPay = isCustomStaff ? Math.round(customStaffPay!) : defaultStaffPay
  const audioAndOfficeProfit = basePrice - (musiciansTotal + staffPay)
  const ownerTotalTakeHome = musicianPayEach + audioAndOfficeProfit

  const notes = (isCustomMusician || isCustomStaff)
    ? "Desglose con nómina ajustada manualmente (cálculo de remanente y dueño automático)."
    : "Privado: Músicos $750/hr (mínimo $1,500 por 2h); Staff $300/hr; Remanente restante para Audio y Oficina Vendetta."

  return {
    hours: h,
    eventType: "privado",
    totalPrice: basePrice,
    musiciansCount,
    musicianPayEach,
    musiciansTotal,
    staffPay,
    audioAndOfficeProfit,
    ownerTotalTakeHome,
    notes,
    isCustomMusicianPay: isCustomMusician,
    isCustomStaffPay: isCustomStaff,
    defaultMusicianPayEach,
    defaultStaffPay,
  }
}


