import { linkRecipeToPantry } from '../core/match';
import { cleanText } from '../core/text';
import { DISH_KIND_LABELS, type PantryItem, type Recipe } from '../types';

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
export const SHORT_DAYS = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'] as const;

export { MONTHS };

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

/**
 * Caption on the week card. `goal` is the saved weekly target (default 3),
 * counted as distinct cooked days from Saturday through Friday.
 */
export function weekCaption(cookedCount: number, goal: number): string {
  return `طبختي ${cookedCount} من ${goal} ›`;
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

/** Shown only for the fields the recipe actually has. */
export function recipeMetaLine(recipe: Recipe): string | null {
  const parts: string[] = [];
  if (recipe.minutes != null) parts.push(`${recipe.minutes} دقيقة`);
  if (recipe.servings != null) parts.push(servingsLabel(recipe.servings));
  if (recipe.kind) parts.push(DISH_KIND_LABELS[recipe.kind]);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function servingsLabel(count: number): string {
  if (count === 1) return 'شخص';
  if (count === 2) return 'شخصان';
  return `${count} أشخاص`;
}

export type HomeFilter = 'quick' | 'onHand' | 'vegetarian' | 'sweet';

export function recipeMatchesFilter(recipe: Recipe, pantry: PantryItem[], filter: HomeFilter): boolean {
  if (filter === 'quick') return recipe.minutes != null && recipe.minutes < 30;
  if (filter === 'onHand') return isFullyOnHand(recipe, pantry);
  if (filter === 'vegetarian') return recipe.vegetarian === true;
  return recipe.kind === 'sweet';
}

export function recipesForFilter(recipes: Recipe[], pantry: PantryItem[], filter: HomeFilter | null): Recipe[] {
  if (!filter) return recipes;
  return recipes.filter((recipe) => recipeMatchesFilter(recipe, pantry, filter));
}

/** Days in the fridge before the saffron banner may appear. */
export const USE_SOON_AFTER_DAYS = 5;

export function fridgeAgeDays(addedAt: string | undefined, today: Date): number | null {
  if (!addedAt) return null;
  const added = new Date(addedAt);
  if (Number.isNaN(added.getTime())) return null;
  const days = Math.round((startOfDay(today).getTime() - startOfDay(added).getTime()) / 86_400_000);
  if (days < 0) return null;
  return days;
}

export interface UseSoon {
  item: PantryItem;
  days: number;
  recipe: Recipe | null;
}

/** Oldest pantry item that has a real added date and has waited long enough. */
export function findUseSoon(pantry: readonly PantryItem[], recipes: readonly Recipe[], today: Date): UseSoon | null {
  let best: UseSoon | null = null;
  for (const item of pantry) {
    const days = fridgeAgeDays(item.addedAt, today);
    if (days == null || days < USE_SOON_AFTER_DAYS) continue;
    if (best && days <= best.days) continue;
    const name = cleanText(item.name);
    const recipe = recipes.find((entry) => entry.ingredients.some((ingredient) => cleanText(ingredient.name) === name)) ?? null;
    best = { item, days, recipe };
  }
  return best;
}

export function useSoonMessage(soon: UseSoon): string {
  const lead = `استعمليه قريباً: ${soon.item.name} صار له ${arabicDayCount(soon.days)} بالثلاجة`;
  if (!soon.recipe) return `${lead}.`;
  return `${lead}، و${soon.recipe.name} بتخلّصه.`;
}

function arabicDayCount(days: number): string {
  if (days === 1) return 'يوم';
  if (days === 2) return 'يومين';
  if (days >= 3 && days <= 10) return `${days} أيام`;
  return `${days} يوماً`;
}
