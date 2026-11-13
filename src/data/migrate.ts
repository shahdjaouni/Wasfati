import { migrateGuestPlan } from '../guests/guests';
import {
  DISH_KINDS,
  type AppData,
  type CookEntry,
  type DishKind,
  type PantryItem,
  type PlanSlot,
  type Recipe,
  type Settings,
} from '../types';
import { defaultSettings } from '../types';
import { sanitizeSettings } from './settings';

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** A positive whole number, or nothing. Strings and junk do not become a guess. */
export function optionalCount(value: unknown): number | undefined {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isInteger(number) || number <= 0 || number > 999) return undefined;
  return number;
}

function optionalKind(value: unknown): DishKind | undefined {
  return DISH_KINDS.includes(value as DishKind) ? (value as DishKind) : undefined;
}

export function migrateRecipe(value: unknown): Recipe | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Recipe;
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;
  return {
    ...raw,
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : [],
    steps: Array.isArray(raw.steps) ? raw.steps : [],
    minutes: optionalCount(raw.minutes),
    servings: optionalCount(raw.servings),
    kind: optionalKind(raw.kind),
    vegetarian: raw.vegetarian === true ? true : raw.vegetarian === false ? false : undefined,
  };
}

export function migratePantryItem(value: unknown): PantryItem | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as PantryItem;
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;
  const addedAt = typeof raw.addedAt === 'string' && !Number.isNaN(Date.parse(raw.addedAt)) ? raw.addedAt : undefined;
  return { ...raw, addedAt };
}

export function migrateCookLog(value: unknown): CookEntry[] {
  if (!Array.isArray(value)) return [];
  const byDate = new Map<string, CookEntry>();
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const raw = entry as CookEntry;
    if (typeof raw.date !== 'string' || !DAY_KEY.test(raw.date)) continue;
    if (typeof raw.recipeId !== 'string' || !raw.recipeId) continue;
    if (typeof raw.recipeName !== 'string' || !raw.recipeName.trim()) continue;
    byDate.set(raw.date, { date: raw.date, recipeId: raw.recipeId, recipeName: raw.recipeName.trim() });
  }
  return [...byDate.values()];
}

export function migratePlan(value: unknown): PlanSlot[] {
  if (!Array.isArray(value)) return [];
  const byDate = new Map<string, PlanSlot>();
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const raw = entry as PlanSlot;
    if (typeof raw.date !== 'string' || !DAY_KEY.test(raw.date)) continue;
    if (typeof raw.recipeId !== 'string' || !raw.recipeId) continue;
    byDate.set(raw.date, { date: raw.date, recipeId: raw.recipeId });
  }
  return [...byDate.values()];
}

export function migrateApp(parsed: Partial<AppData>): AppData {
  return {
    recipes: Array.isArray(parsed.recipes)
      ? parsed.recipes.map(migrateRecipe).filter((recipe): recipe is Recipe => recipe !== null)
      : [],
    pantry: Array.isArray(parsed.pantry)
      ? parsed.pantry.map(migratePantryItem).filter((item): item is PantryItem => item !== null)
      : [],
    shopping: Array.isArray(parsed.shopping) ? parsed.shopping : [],
    settings: sanitizeSettings(parsed.settings ?? defaultSettings()),
    cookLog: migrateCookLog(parsed.cookLog),
    plan: migratePlan(parsed.plan),
    guestPlan: migrateGuestPlan(parsed.guestPlan, new Date()),
    initialized: true,
  };
}

export function weeklyGoalOf(settings: Pick<Settings, 'weeklyGoal'> | undefined): number {
  return sanitizeSettings({ ...defaultSettings(), ...settings }).weeklyGoal;
}
