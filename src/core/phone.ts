import { toWesternDigits } from './text';

/** International number for wa.me, without + or spaces. Local numbers that still start with 0 are rejected. */
export function normalizePhone(input: string): string | null {
  const western = toWesternDigits(input).trim();
  if (!western) return null;

  const compact = western.replace(/[\s().-]/g, '');
  const explicitlyInternational = compact.startsWith('+') || compact.startsWith('00');
  let digits = compact.replace(/[^\d]/g, '');
  if (compact.startsWith('00')) digits = digits.slice(2);

  if (!explicitlyInternational && digits.startsWith('0')) return null;
  if (!/^\d{8,15}$/.test(digits)) return null;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized || !message.trim()) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
