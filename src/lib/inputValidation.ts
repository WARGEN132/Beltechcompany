/**
 * Input Security & Validation Utilities for ООО «БелТехКомпания»
 * - Auto-formats and restricts phone numbers to digits only (+375 XX XXX-XX-XX)
 * - Limits maximum input lengths to prevent memory / lag / DoS overloads
 * - Sanitizes against XSS / HTML injection attacks
 */

/**
 * Strict Phone Number Formatter for Belarus (+375) & General Digits
 * Restricts input to digits only, preventing any letters, symbols or excessive length.
 */
export function formatPhoneInput(rawInput: string): string {
  if (!rawInput) return "";

  // Remove all non-digit characters
  const allDigits = rawInput.replace(/\D/g, "");

  // If empty, return blank
  if (allDigits.length === 0) return "";

  // Extract subscriber digits (skipping 375 or 80 if typed)
  let subscriberDigits = allDigits;
  if (allDigits.startsWith("375")) {
    subscriberDigits = allDigits.slice(3);
  } else if (allDigits.startsWith("80")) {
    subscriberDigits = allDigits.slice(2);
  }

  // Cap at 9 subscriber digits (e.g. 29 123 45 67)
  subscriberDigits = subscriberDigits.slice(0, 9);

  let formatted = "+375";
  if (subscriberDigits.length > 0) {
    formatted += ` (${subscriberDigits.slice(0, 2)}`;
  }
  if (subscriberDigits.length >= 2) {
    formatted += `) ${subscriberDigits.slice(2, 5)}`;
  }
  if (subscriberDigits.length >= 5) {
    formatted += `-${subscriberDigits.slice(5, 7)}`;
  }
  if (subscriberDigits.length >= 7) {
    formatted += `-${subscriberDigits.slice(7, 9)}`;
  }

  return formatted;
}

/**
 * Clean phone validation: returns true if phone has valid digit count (12 digits for +375 XX XXX-XX-XX)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 11 && digits.length <= 13;
}

/**
 * Sanitizes and truncates text input (Names, Cities, Addresses)
 */
export function sanitizeName(val: string, maxLen: number = 60): string {
  if (!val) return "";
  return val.replace(/<[^>]*>?/gm, "").slice(0, maxLen);
}

/**
 * Sanitizes email address with strict length limit
 */
export function sanitizeEmail(val: string, maxLen: number = 80): string {
  if (!val) return "";
  return val.replace(/\s+/g, "").replace(/<[^>]*>?/gm, "").slice(0, maxLen);
}

/**
 * Sanitizes long comments or specifications
 */
export function sanitizeComment(val: string, maxLen: number = 500): string {
  if (!val) return "";
  return val.replace(/<[^>]*>?/gm, "").slice(0, maxLen);
}
