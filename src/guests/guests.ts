import { linkRecipeToPantry } from '../core/match';
import { rankRecipes } from '../core/suggest';
import { canonicalName, cleanText } from '../core/text';
import { WEEKDAYS, dayKey } from '../home/today';
import {
  GUEST_COURSE_IDS,
  GUEST_OCCASION_IDS,
  type GuestCourse,
  type GuestNote,
  type GuestOccasion,
  type GuestPlan,
  type Ingredient,
  type PantryItem,
  type Recipe,
} from '../types';

export const GUEST_OCCASIONS: { id: GuestOccasion; label: string }[] = [
  { id: 'family', label: 'غدا عيلة' },
  { id: 'friends', label: 'عشا أصحاب' },
  { id: 'birthday', label: 'عيد ميلاد' },
  { id: 'iftar', label: 'إفطار رمضان' },
];

export const GUEST_COURSES: { id: GuestCourse; label: string; tile: string }[] = [
  { id: 'main', label: 'رئيسي', tile: '#B65A2E' },
  { id: 'vegetarian', label: 'نباتي', tile: '#6B4E36' },
  { id: 'salad', label: 'سلطة ومقبلات', tile: '#2F5D3A' },
  { id: 'sweet', label: 'حلو', tile: '#E7B35A' },
];

/** Cold dishes are plated this many minutes before the food is ready. Not a recipe time. */
export const SIDES_BEFORE_READY_MINUTES = 90;

export function defaultGuestPlan(today: Date): GuestPlan {
  return {
    occasion: 'family',
    date: dayKey(today),
    readyHour: 14,
    readyMinute: 0,
    guests: 10,
    notes: [],
    menu: {},
  };
}

export function vegetariansLabel(count: number): string {
  if (count <= 1) return 'نباتي';
  return `${count} نباتيين`;
}

/** Recipes of one course. A main falls back to any رئيسية when every main is marked vegetarian. */
export function coursePool(recipes: readonly Recipe[], course: GuestCourse): Recipe[] {
  if (course === 'main') {
    const savory = recipes.filter((recipe) => recipe.kind === 'main' && recipe.vegetarian !== true);
    if (savory.length > 0) return savory;
    return recipes.filter((recipe) => recipe.kind === 'main');
  }
  if (course === 'vegetarian') {
    return recipes.filter((recipe) => recipe.vegetarian === true && recipe.kind !== 'sweet' && recipe.kind !== 'salad');
  }
  if (course === 'salad') return recipes.filter((recipe) => recipe.kind === 'salad');
  return recipes.filter((recipe) => recipe.kind === 'sweet');
}

/** Pantry coverage first. Ids in `avoid` are skipped until the course would otherwise be empty. */
export function rankCourse(
  recipes: readonly Recipe[],
  pantry: readonly PantryItem[],
  course: GuestCourse,
  avoid: readonly string[] = [],
): Recipe[] {
  const pool = coursePool(recipes, course);
  const fresh = rankRecipes(pool.filter((recipe) => !avoid.includes(recipe.id)), pantry as PantryItem[]);
  if (fresh.length > 0) return fresh;
  return rankRecipes(pool, pantry as PantryItem[]);
}

export function suggestMenu(recipes: readonly Recipe[], pantry: readonly PantryItem[]): GuestPlan['menu'] {
  const menu: GuestPlan['menu'] = {};
  const used: string[] = [];
  for (const course of GUEST_COURSES) {
    const pick = rankCourse(recipes, pantry, course.id, used)[0];
    if (!pick) continue;
    menu[course.id] = pick.id;
    used.push(pick.id);
  }
  return menu;
}

/** Keeps a saved id when that recipe is still the right course. Otherwise fills from the pantry ranking. */
export function resolveMenu(
  saved: GuestPlan['menu'],
  recipes: readonly Recipe[],
  pantry: readonly PantryItem[],
): GuestPlan['menu'] {
  const menu: GuestPlan['menu'] = {};
  const used: string[] = [];
  for (const course of GUEST_COURSES) {
    const savedId = saved[course.id];
    const stillThere = savedId != null && coursePool(recipes, course.id).some((recipe) => recipe.id === savedId);
    if (stillThere && savedId) {
      menu[course.id] = savedId;
      used.push(savedId);
      continue;
    }
    const pick = rankCourse(recipes, pantry, course.id, used)[0];
    if (!pick) continue;
    menu[course.id] = pick.id;
    used.push(pick.id);
  }
  return menu;
}

export function swapCourse(
  menu: GuestPlan['menu'],
  recipes: readonly Recipe[],
  pantry: readonly PantryItem[],
  course: GuestCourse,
): GuestPlan['menu'] {
  const pool = rankCourse(recipes, pantry, course, []);
  if (pool.length === 0) return menu;
  const index = pool.findIndex((recipe) => recipe.id === menu[course]);
  const next = pool[(index + 1) % pool.length];
  return { ...menu, [course]: next.id };
}

export function courseNote(recipe: Recipe | null, pantry: readonly PantryItem[]): { text: string; full: boolean } {
  if (!recipe) return { text: 'ما في وصفة محفوظة من هالنوع', full: false };
  const missing = linkRecipeToPantry(recipe, pantry as PantryItem[]).missing;
  if (missing.length === 0) return { text: 'كله متوفر', full: true };
  return { text: `ناقص: ${missing.map((item) => item.name).join('، ')}`, full: false };
}

export function scaleAmount(amount: string | undefined, servings: number | undefined, guests: number): string | undefined {
  if (!amount) return undefined;
  if (servings == null || servings <= 0 || guests === servings) return amount;
  const factor = guests / servings;
  return amount.replace(/(\d+(?:[.,]\d+)?)/, (raw) => {
    const value = Number(raw.replace(',', '.'));
    if (!Number.isFinite(value)) return raw;
    const scaled = Math.round(value * factor * 10) / 10;
    return Number.isInteger(scaled) ? String(scaled) : String(scaled);
  });
}

function leadingAmount(amount: string | undefined): { value: number; rest: string } | null {
  if (!amount) return null;
  const match = amount.match(/^(\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  return { value, rest: match[2] };
}

/** Missing ingredients across the menu, one row per name, amounts scaled by guests ÷ recipe servings. */
export function guestShoppingItems(
  recipes: readonly Recipe[],
  menu: GuestPlan['menu'],
  pantry: readonly PantryItem[],
  guests: number,
): Ingredient[] {
  const byName = new Map<string, Ingredient>();
  for (const course of GUEST_COURSES) {
    const recipe = recipes.find((item) => item.id === menu[course.id]);
    if (!recipe) continue;
    for (const missing of linkRecipeToPantry(recipe, pantry as PantryItem[]).missing) {
      const key = canonicalName(missing.name);
      if (!key) continue;
      const amount = scaleAmount(missing.amount, recipe.servings, guests);
      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, { name: cleanText(missing.name), category: missing.category, amount });
        continue;
      }
      const left = leadingAmount(existing.amount);
      const right = leadingAmount(amount);
      if (left && right && left.rest === right.rest) {
        const sum = Math.round((left.value + right.value) * 10) / 10;
        existing.amount = `${Number.isInteger(sum) ? sum : sum}${left.rest}`;
      }
    }
  }
  return [...byName.values()];
}

export function guestMissingTitle(count: number): string {
  return `ناقصك ${count} صنف للعزومة`;
}

export function guestMissingNames(items: readonly Ingredient[]): string {
  if (items.length <= 4) return items.map((item) => item.name).join('، ');
  return `${items.slice(0, 4).map((item) => item.name).join('، ')}، وغيرهم`;
}

export function formatClock(hour: number, minute: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')}`;
}

export function formatReadyTime(hour: number, minute: number): string {
  const period = hour < 5 ? 'الليل' : hour < 12 ? 'الصبح' : hour < 17 ? 'الظهر' : 'المسا';
  return `${formatClock(hour, minute)} ${period}`;
}

export interface PrepStep {
  label: string;
  detail: string;
  tone: 'shop' | 'work' | 'serve';
}

function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

/**
 * Steps run backwards from the ready time.
 * Shopping is two days before, prep is the night before, the main starts
 * `minutes` before ready when the recipe has that number, and sides are
 * {@link SIDES_BEFORE_READY_MINUTES} before ready.
 */
export function prepSchedule(options: {
  event: Date;
  readyHour: number;
  readyMinute: number;
  mainMinutes?: number;
  hasSides: boolean;
  hasMissing: boolean;
}): PrepStep[] {
  const ready = new Date(
    options.event.getFullYear(),
    options.event.getMonth(),
    options.event.getDate(),
    options.readyHour,
    options.readyMinute,
  );
  const steps: { at: number; step: PrepStep }[] = [];
  if (options.hasMissing) {
    const shop = new Date(ready);
    shop.setDate(shop.getDate() - 2);
    steps.push({
      at: shop.getTime(),
      step: { label: weekdayName(shop), detail: 'اشتري الأغراض الناقصة', tone: 'shop' },
    });
  }
  const night = new Date(ready);
  night.setDate(night.getDate() - 1);
  steps.push({
    at: night.getTime(),
    step: { label: `${weekdayName(night)} بالليل`, detail: 'حضّري المكونات اللي بتحتاج وقت', tone: 'work' },
  });
  if (options.mainMinutes != null && options.mainMinutes > 0) {
    const start = new Date(ready.getTime() - options.mainMinutes * 60_000);
    steps.push({
      at: start.getTime(),
      step: { label: `${weekdayName(start)} ${formatClock(start.getHours(), start.getMinutes())}`, detail: 'حطّي الطبخة الرئيسية على النار', tone: 'work' },
    });
  }
  if (options.hasSides) {
    const sides = new Date(ready.getTime() - SIDES_BEFORE_READY_MINUTES * 60_000);
    steps.push({
      at: sides.getTime(),
      step: { label: `${weekdayName(sides)} ${formatClock(sides.getHours(), sides.getMinutes())}`, detail: 'السلطات والمقبلات', tone: 'work' },
    });
  }
  steps.push({
    at: ready.getTime() + 1,
    step: { label: `${weekdayName(ready)} ${formatClock(ready.getHours(), ready.getMinutes())}`, detail: 'صحتين للضيوف', tone: 'serve' },
  });
  steps.sort((a, b) => a.at - b.at);
  return steps.map((item) => item.step);
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function migrateGuestPlan(value: unknown, today: Date): GuestPlan {
  const fallback = defaultGuestPlan(today);
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Partial<GuestPlan>;
  const occasion = GUEST_OCCASION_IDS.includes(raw.occasion as GuestOccasion) ? (raw.occasion as GuestOccasion) : fallback.occasion;
  const date = typeof raw.date === 'string' && DAY_KEY.test(raw.date) ? raw.date : fallback.date;
  const hour = Number(raw.readyHour);
  const minute = Number(raw.readyMinute);
  const guests = Number(raw.guests);
  const notes = Array.isArray(raw.notes)
    ? raw.notes.flatMap((note) => {
        if (!note || typeof note !== 'object') return [];
        const item = note as GuestNote;
        if (item.kind !== 'vegetarians' && item.kind !== 'children' && item.kind !== 'custom') return [];
        if (typeof item.label !== 'string' || !item.label.trim()) return [];
        const count = Number(item.count);
        return [{
          id: typeof item.id === 'string' && item.id ? item.id : item.kind,
          kind: item.kind,
          label: item.label.trim(),
          count: Number.isInteger(count) && count > 0 ? count : undefined,
        }];
      })
    : [];
  const menu: GuestPlan['menu'] = {};
  if (raw.menu && typeof raw.menu === 'object') {
    for (const course of GUEST_COURSE_IDS) {
      const id = raw.menu[course];
      if (typeof id === 'string' && id) menu[course] = id;
    }
  }
  return {
    occasion,
    date,
    readyHour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : fallback.readyHour,
    readyMinute: minute === 30 ? 30 : 0,
    guests: Number.isInteger(guests) && guests >= 2 && guests <= 40 ? guests : fallback.guests,
    notes,
    menu,
  };
}
