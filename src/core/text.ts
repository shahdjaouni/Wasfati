import { CATEGORY_LABELS, type IngredientCategory } from '../types';

const DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/**
 * Canonical ingredient names so "البندورة" and "طماطم" compare equal.
 * Synonym values are the form both sides must land on.
 */
const SYNONYMS: Record<string, string> = {
  بندوره: 'بندورة',
  طماطم: 'بندورة',
  طماطه: 'بندورة',
  بطاطس: 'بطاطا',
  بطاطه: 'بطاطا',
  ارز: 'رز',
  رز: 'رز',
  بيضه: 'بيض',
  بيضات: 'بيض',
  بصله: 'بصل',
  دجاجه: 'دجاج',
  'بهار اسود': 'فلفل اسود',
  'فلفل اسود': 'فلفل اسود',
  'زيت الزيتون': 'زيت زيتون',
  'حليب سائل': 'حليب',
  كريمه: 'كريمة',
  قشطه: 'كريمة',
};

const CATEGORY_ALIASES: Record<string, IngredientCategory> = {
  vegetables: 'vegetables',
  staples: 'staples',
  spices: 'spices',
  liquids: 'liquids',
  خضار: 'vegetables',
  مونة: 'staples',
  مونه: 'staples',
  بهارات: 'spices',
  سوائل: 'liquids',
};

export function toWesternDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)));
}

export function canonicalName(input: string): string {
  const cleaned = toWesternDigits(input)
    .trim()
    .toLowerCase()
    .replace(DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const joined = cleaned
    .split(' ')
    .map((token) => token.replace(/^ال/, ''))
    .filter(Boolean)
    .join(' ');

  return SYNONYMS[joined] ?? joined;
}

export function namesMatch(a: string, b: string): boolean {
  const left = canonicalName(a);
  const right = canonicalName(b);
  if (!left || !right) return false;
  if (left === right) return true;

  const leftTokens = left.split(' ');
  const rightTokens = right.split(' ');
  if (leftTokens.length === 1 && leftTokens[0].length >= 2 && rightTokens.includes(leftTokens[0])) {
    return true;
  }
  if (rightTokens.length === 1 && rightTokens[0].length >= 2 && leftTokens.includes(rightTokens[0])) {
    return true;
  }
  return false;
}

export function coerceCategory(value: unknown): IngredientCategory {
  if (typeof value === 'string' && value in CATEGORY_ALIASES) {
    return CATEGORY_ALIASES[value];
  }
  return 'staples';
}

export function categoryLabel(category: IngredientCategory): string {
  return CATEGORY_LABELS[category];
}

export function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
