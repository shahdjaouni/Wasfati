import { linkRecipeToPantry } from '../core/match';
import { rankRecipes } from '../core/suggest';
import { canonicalName } from '../core/text';
import { MONTHS, SHORT_DAYS, recipeMatchesFilter, weekStartingSaturday, type HomeFilter } from '../home/today';
import type { Ingredient, PantryItem, PlanSlot, Recipe } from '../types';

/**
 * Days chosen when the cook picks a frequency chip, or when a saved goal
 * has no matching day list. Index 0 is Saturday. Six has no chip; it is the
 * set used when settings store 6.
 */
export const PLAN_PRESETS: Record<number, number[]> = {
  1: [6],
  2: [1, 4],
  3: [1, 3, 6],
  4: [0, 2, 4, 6],
  5: [0, 1, 3, 4, 6],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export const FREQUENCY_CHOICES: { goal: number; label: string }[] = [
  { goal: 1, label: 'مرة' },
  { goal: 2, label: '2' },
  { goal: 3, label: '3' },
  { goal: 4, label: '4' },
  { goal: 5, label: '5' },
  { goal: 7, label: 'يومياً' },
];

export function presetDays(goal: number): number[] {
  return [...(PLAN_PRESETS[goal] ?? PLAN_PRESETS[3])];
}

/** Picking مرة / 2 / 3 / 4 / 5 / يومياً replaces the days so the count matches. */
export function applyFrequency(goal: number): { weeklyGoal: number; planDays: number[] } {
  const weeklyGoal = Number.isInteger(goal) && goal >= 1 && goal <= 7 ? goal : 3;
  return { weeklyGoal, planDays: presetDays(weeklyGoal) };
}

/**
 * Tapping a day adds or removes it. The weekly goal becomes that count,
 * so home's «من M» and the frequency stay one number.
 * The last selected day stays: the goal cannot drop to 0.
 */
export function togglePlanDay(days: readonly number[], index: number): { weeklyGoal: number; planDays: number[] } {
  const set = new Set(days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6));
  if (index < 0 || index > 6) {
    const planDays = [...set].sort((a, b) => a - b);
    return { weeklyGoal: Math.max(1, planDays.length), planDays: planDays.length > 0 ? planDays : presetDays(3) };
  }
  if (set.has(index)) {
    if (set.size <= 1) {
      const planDays = [...set].sort((a, b) => a - b);
      return { weeklyGoal: 1, planDays };
    }
    set.delete(index);
  } else {
    set.add(index);
  }
  const planDays = [...set].sort((a, b) => a - b);
  return { weeklyGoal: planDays.length, planDays };
}

export function weekRangeLabel(today: Date): string {
  const week = weekStartingSaturday(today);
  const start = dateFromKey(week[0].key);
  const end = dateFromKey(week[6].key);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} – ${end.getDate()} ${MONTHS[start.getMonth()]}`;
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
}

export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Calendar dates for the selected weekdays in the Saturday–Friday week of `today`. */
export function selectedDates(today: Date, planDays: readonly number[]): string[] {
  const week = weekStartingSaturday(today);
  return [...planDays]
    .filter((index) => Number.isInteger(index) && index >= 0 && index < week.length)
    .sort((a, b) => a - b)
    .map((index) => week[index].key);
}

export function peopleLabel(count: number): string {
  if (count === 1) return 'شخص';
  if (count === 2) return 'شخصان';
  return `${count} أشخاص`;
}

/** Minutes only when the recipe has them. The people count is the plan stepper, not a guessed serving. */
export function planDishMeta(recipe: Recipe, people: number): string {
  const parts: string[] = [];
  if (recipe.minutes != null) parts.push(`${recipe.minutes} دقيقة`);
  parts.push(peopleLabel(people));
  return parts.join(' · ');
}

/** Leftovers cover the next weekday. Friday has no following day in this week. */
export function leftoverNote(dayIndex: number, doubled: boolean): string | null {
  if (!doubled || dayIndex < 0 || dayIndex >= 6) return null;
  return `+ بواقي لـ${SHORT_DAYS[dayIndex + 1]}`;
}

export type PlanBadge = 'today' | 'cooked';

/** Today wins the saffron pill. A cooked earlier day shows طبختيها. */
export function planBadge(isToday: boolean, cooked: boolean): PlanBadge | null {
  if (isToday) return 'today';
  if (cooked) return 'cooked';
  return null;
}

function recipesForPeople(recipes: readonly Recipe[], pantry: readonly PantryItem[], people: number): Recipe[] {
  const ranked = rankRecipes([...recipes], [...pantry]);
  const fits = ranked.filter((recipe) => recipe.servings == null || recipe.servings >= people);
  const small = ranked.filter((recipe) => recipe.servings != null && recipe.servings < people);
  return [...fits, ...small];
}

function nextRecipe(order: readonly Recipe[], used: readonly string[], avoid: ReadonlySet<string>): Recipe | null {
  if (order.length === 0) return null;
  const taken = new Set(used);
  return (
    order.find((recipe) => !taken.has(recipe.id) && !avoid.has(recipe.id)) ??
    order.find((recipe) => !taken.has(recipe.id)) ??
    order[used.length % order.length]
  );
}

/**
 * Suggests one recipe per open day. Already reserved recipes are used again only
 * after the other candidates. `avoidIds` is tried last, so a re-suggest can move off
 * the current automatic pick. Every returned slot is automatic (`manual: false`).
 */
export function fillOpenDays(options: {
  recipes: readonly Recipe[];
  pantry: readonly PantryItem[];
  people: number;
  dates: readonly string[];
  reservedIds?: readonly string[];
  avoidIds?: readonly string[];
}): PlanSlot[] {
  if (options.recipes.length === 0 || options.dates.length === 0) return [];
  const order = recipesForPeople(options.recipes, options.pantry, options.people);
  const used = [...(options.reservedIds ?? [])];
  const avoid = new Set(options.avoidIds ?? []);
  const slots: PlanSlot[] = [];
  for (const date of options.dates) {
    const recipe = nextRecipe(order, used, avoid);
    if (!recipe) break;
    used.push(recipe.id);
    avoid.delete(recipe.id);
    slots.push({ date, recipeId: recipe.id, manual: false });
  }
  return slots;
}

/**
 * One saved recipe per selected day.
 * Among recipes that can feed `people` (or that never recorded servings),
 * pantry coverage wins and a recipe is not repeated until every candidate was used.
 * A recipe whose saved servings are below the plan is used only after those.
 */
export function fillWeek(options: {
  recipes: Recipe[];
  pantry: PantryItem[];
  dates: readonly string[];
  people: number;
}): PlanSlot[] {
  return fillOpenDays(options);
}

/**
 * Replaces automatic slots and fills empty days. A slot the cook chose
 * (`manual` missing or true) stays on its day and its recipe.
 */
export function resuggestOpenDays(options: {
  recipes: readonly Recipe[];
  pantry: readonly PantryItem[];
  people: number;
  dates: readonly string[];
  existing: readonly PlanSlot[];
}): PlanSlot[] {
  const byDate = new Map(options.existing.map((slot) => [slot.date, slot]));
  const locked = options.dates.flatMap((date) => {
    const slot = byDate.get(date);
    return slot?.recipeId && slot.manual !== false ? [slot] : [];
  });
  const open = options.dates.filter((date) => {
    const slot = byDate.get(date);
    return !slot?.recipeId || slot.manual === false;
  });
  const suggested = fillOpenDays({
    recipes: options.recipes,
    pantry: options.pantry,
    people: options.people,
    dates: open,
    reservedIds: locked.map((slot) => slot.recipeId),
    avoidIds: open.flatMap((date) => {
      const id = byDate.get(date)?.recipeId;
      return id ? [id] : [];
    }),
  });
  const suggestedByDate = new Map(suggested.map((slot) => [slot.date, slot]));
  return options.dates.flatMap((date) => {
    const slot = byDate.get(date);
    if (slot?.recipeId && slot.manual !== false) return [{ ...slot, manual: true as const }];
    const next = suggestedByDate.get(date);
    return next ? [next] : [];
  });
}

/** Missing ingredients of planned meals that are not already in the cooking log. Names are unique. */
export function missingPlanIngredients(options: {
  slots: readonly PlanSlot[];
  recipes: readonly Recipe[];
  pantry: readonly PantryItem[];
  cookedDates: readonly string[];
}): Ingredient[] {
  const cooked = new Set(options.cookedDates);
  const seen = new Set<string>();
  const missing: Ingredient[] = [];
  for (const slot of options.slots) {
    if (cooked.has(slot.date)) continue;
    const recipe = options.recipes.find((item) => item.id === slot.recipeId);
    if (!recipe) continue;
    for (const ingredient of linkRecipeToPantry(recipe, options.pantry as PantryItem[]).missing) {
      const key = canonicalName(ingredient.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      missing.push({ name: ingredient.name, category: ingredient.category, amount: ingredient.amount });
    }
  }
  return missing;
}

export function missingPlanTitle(count: number): string {
  const noun = count === 1 ? 'صنف' : 'أصناف';
  return `الخطة بتحتاج ${count} ${noun} مش عندك`;
}

/** Home uses this before the usual ranking when the day has a saved plan that passes the active filter. */
export function plannedRecipeForToday(
  recipes: readonly Recipe[],
  slots: readonly PlanSlot[],
  todayKey: string,
  pantry: readonly PantryItem[],
  filter: HomeFilter | null,
): Recipe | null {
  const slot = slots.find((item) => item.date === todayKey);
  if (!slot) return null;
  const recipe = recipes.find((item) => item.id === slot.recipeId);
  if (!recipe) return null;
  if (filter && !recipeMatchesFilter(recipe, pantry as PantryItem[], filter)) return null;
  return recipe;
}
