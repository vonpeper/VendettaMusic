import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha de Prisma/DB de forma ultra-segura para México.
 * Blindado contra 'Invalid Date' y nulos para evitar crashes 500.
 */
export function formatDateMX(dateInput: Date | string | null | undefined, formatStr: string = "PPP") {
  if (!dateInput) return ""
  
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    
    // Validación crítica para evitar que date-fns lance una excepción fatal
    if (!d || !isValid(d) || isNaN(d.getTime())) {
      console.warn("⚠️ [formatDateMX] Fecha inválida recibida:", dateInput)
      return ""
    }
    
    // ESTRATEGIA ANTIDESFASE: Forzamos mediodía UTC para fechas guardadas sin hora (00:00 UTC)
    // que al restarle 6 horas de México brincan al día anterior.
    const utcHours = d.getUTCHours()
    if (utcHours < 10) {
      const safeDate = new Date(d)
      safeDate.setUTCHours(12, 0, 0, 0)
      return format(safeDate, formatStr, { locale: es })
    }

    return format(d, formatStr, { locale: es })
  } catch (err) {
    console.error("❌ [CRITICAL] Error en formatDateMX:", err)
    return ""
  }
}

export function formatCurrency(amount: number) {
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(amount || 0)
  } catch (err) {
    return "$0"
  }
}
