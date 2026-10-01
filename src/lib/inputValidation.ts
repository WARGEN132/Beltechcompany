/**
 * Input Security & Validation Utilities for ООО «БелТехКомпания»
 * - Auto-formats and restricts phone numbers to digits only (+375 (XX) XXX-XX-XX)
 * - Limits maximum input lengths to prevent memory / lag / DoS overloads
 * - Sanitizes against XSS / HTML injection attacks
 */

export function formatPhoneInput(rawInput: string): string {
  if (!rawInput) return "";

  const allDigits = rawInput.replace(/\D/g, "");

  if (allDigits.length === 0) return "";

  // Пользователь стирает префикс "+375" (остаётся "+3", "+37"):
  // даём полностью очистить поле.
  if (rawInput.trim().startsWith("+") && allDigits.length < 3) return "";

  let subscriberDigits = allDigits;
  if (allDigits.startsWith("375")) {
    subscriberDigits = allDigits.slice(3);
  } else if (allDigits.startsWith("80")) {
    subscriberDigits = allDigits.slice(2);
  }

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
 * Полный белорусский номер = 375 + 9 цифр = 12 цифр.
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("375");
}

export function sanitizeName(val: string, maxLen: number = 60): string {
  if (!val) return "";
  return val.replace(/<[^>]*>?/gm, "").slice(0, maxLen);
}

export function sanitizeEmail(val: string, maxLen: number = 80): string {
  if (!val) return "";
  return val.replace(/\s+/g, "").replace(/<[^>]*>?/gm, "").slice(0, maxLen);
}

export function sanitizeComment(val: string, maxLen: number = 500): string {
  if (!val) return "";
  return val.replace(/<[^>]*>?/gm, "").slice(0, maxLen);
}