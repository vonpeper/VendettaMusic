// src/lib/phone.ts

/**
 * Remove all non-digit characters from a phone string.
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/\D+/g, "");
}

/**
 * Determine if a phone number is a dummy placeholder.
 * Dummy numbers are any 10-digit sequence where all digits are identical
 * (e.g. "0000000000", "1111111111", "5555555555") or the specific
 * values "5500000000" and "0000000000" (or their cleaned equivalents).
 */
export function isDummyPhone(phone: string): boolean {
  const cleaned = cleanPhone(phone);
  // Empty string is also considered dummy/invalid
  if (!cleaned) return true;
  // Specific known dummy numbers
  if (cleaned === "5500000000" || cleaned === "0000000000") return true;
  // All digits identical (e.g., 1111111111)
  const allSame = /^([0-9])\1+$/.test(cleaned);
  return allSame;
}

/**
 * Normalize a Mexican WhatsApp phone number to the 13-digit format:
 *   52 + 1 + 10-digit mobile number
 *   e.g. "7226342452" => "5217226342452"
 *   e.g. "+52 1 722 634 2452" => "5217226342452"
 */
export function normalizeMexicanWhatsapp(phone: string): string | null {
  const cleaned = cleanPhone(phone);
  // Reject dummy numbers
  if (isDummyPhone(cleaned)) return null;

  // If already full length (13) and starts with 52, assume it's normalized.
  if (cleaned.length === 13 && cleaned.startsWith("52")) {
    return cleaned;
  }

  // If length is 11 and starts with "1", prepend country code.
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `52${cleaned}`;
  }

  // If length is 10, assume it's the mobile number without the leading "1".
  if (cleaned.length === 10) {
    return `521${cleaned}`;
  }

  // Reject anything else.
  return null;
}

/**
 * Validate that a phone number is a proper Mexican WhatsApp number.
 * Returns true for normalized 13-digit numbers starting with "52"
 * and not a dummy placeholder.
 */
export function isValidWhatsappPhone(phone: string): boolean {
  const normalized = normalizeMexicanWhatsapp(phone);
  return normalized !== null;
}

/**
 * Returns the normalized WhatsApp phone number if valid, otherwise null.
 */
export function getValidWhatsappPhone(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const normalized = normalizeMexicanWhatsapp(phone);
  return normalized;
}
