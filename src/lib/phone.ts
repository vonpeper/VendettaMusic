// src/lib/phone.ts

/**
 * Remove all non-digit characters from a phone string.
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/\D+/g, "");
}

/**
 * Determine if a phone number is a dummy placeholder.
 */
export function isDummyPhone(phone: string): boolean {
  const cleaned = cleanPhone(phone);
  if (!cleaned) return true;
  if (cleaned === "5500000000" || cleaned === "0000000000") return true;
  const allSame = /^([0-9])\1+$/.test(cleaned);
  return allSame;
}

/**
 * Normalize any Mexican phone to the 13-digit WhatsApp format: 521XXXXXXXXXX
 *
 * Handles all common input formats:
 *   "722 784 4738"        → "5217227844738"   (10 digits, local)
 *   "52 1 722 537 2550"   → "5217225372550"   (13 digits, already correct)
 *   "7222417045"          → "5217222417045"   (10 digits, no spaces)
 *   "521 722 784 4738"    → "5217227844738"   (13 digits with spaces)
 *   "+52 722 784 4738"    → "5217227844738"   (12 digits, missing the 1)
 *   "1 722 784 4738"      → "5217227844738"   (11 digits with leading 1)
 */
export function toWhatsAppNumber(phone: string): string | null {
  const digits = cleanPhone(phone);
  if (!digits || isDummyPhone(digits)) return null;

  // Already correct: 521 + 10 digits = 13 digits
  if (digits.length === 13 && digits.startsWith("521")) return digits;

  // 52 + 10 digits = 12 digits (missing the mobile "1")
  if (digits.length === 12 && digits.startsWith("52")) return `521${digits.substring(2)}`;

  // 1 + 10 digits = 11 digits (US-style with leading 1, no country code)
  if (digits.length === 11 && digits.startsWith("1")) return `52${digits}`;

  // 10 digits: bare local number
  if (digits.length === 10) return `521${digits}`;

  return null;
}

/**
 * Returns the full WhatsApp JID for Evolution API: 521XXXXXXXXXX@s.whatsapp.net
 * Returns null if the phone is invalid.
 */
export function toWhatsAppJid(phone: string): string | null {
  const number = toWhatsAppNumber(phone);
  return number ? `${number}@s.whatsapp.net` : null;
}

/**
 * Returns wa.me deep link for a Mexican phone number.
 */
export function toWaLink(phone: string): string | null {
  const number = toWhatsAppNumber(phone);
  return number ? `https://wa.me/${number}` : null;
}

/**
 * @deprecated Use toWhatsAppNumber instead.
 */
export function normalizeMexicanWhatsapp(phone: string): string | null {
  return toWhatsAppNumber(phone);
}

/**
 * Validate that a phone number is a proper Mexican WhatsApp number.
 */
export function isValidWhatsappPhone(phone: string): boolean {
  return toWhatsAppNumber(phone) !== null;
}

/**
 * Returns the normalized WhatsApp phone number if valid, otherwise null.
 */
export function getValidWhatsappPhone(phone: string | undefined | null): string | null {
  if (!phone) return null;
  return toWhatsAppNumber(phone);
}
