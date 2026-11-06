import { linkRecipeToPantry } from '../core/match';
import type { PantryItem, Recipe } from '../types';

const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] as const;

const MONTHS = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
] as const;

/** Saturday-first short labels. Index 0 is Saturday. */
const SHORT_DAYS = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'] as const;

export interface WeekDay {
  key: string;
  label: string;
  isToday: boolean;
}

export function formatArabicDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}، ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Saturday through Friday, with today labeled اليوم. */
export function weekStartingSaturday(today: Date): WeekDay[] {
  const start = startOfDay(today);
  const sinceSaturday = (start.getDay() + 1) % 7;
  start.setDate(start.getDate() - sinceSaturday);
  const todayKey = dayKey(today);

  return SHORT_DAYS.map((label, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const key = dayKey(date);
    const isToday = key === todayKey;
    return { key, label: isToday ? 'اليوم' : label, isToday };
  });
}

/**
 * Cooked marks only when a real date key is supplied.
 * Passing an empty list draws an empty week instead of a sample history.
 */
export function cookedOn(days: WeekDay[], cookedKeys: readonly string[]): boolean[] {
  const cooked = new Set(cookedKeys);
  return days.map((day) => cooked.has(day.key));
}

export function weekStatusLabel(cookedCount: number | null): string {
  if (cookedCount == null) return 'لسه بدون سجل';
  return `طبختي ${cookedCount}`;
}

export function availabilityLabel(haveCount: number, total: number): string {
  return `متوفر عندك ${haveCount} من ${total}`;
}

export function missingLabel(missingCount: number): string {
  return `ناقص ${missingCount}`;
}

export function suggestionBadge(haveCount: number): string {
  return haveCount > 0 ? 'اقتراح من مكوناتك' : 'اقتراح اليوم';
}

export function ingredientCountLabel(total: number): string {
  return `${total} مكونات`;
}

export function recipesOnHand(recipes: Recipe[], pantry: PantryItem[]): Recipe[] {
  return recipes.filter((recipe) => isFullyOnHand(recipe, pantry));
}

export function isFullyOnHand(recipe: Recipe, pantry: PantryItem[]): boolean {
  const link = linkRecipeToPantry(recipe, pantry);
  return link.total > 0 && link.missing.length === 0;
}
