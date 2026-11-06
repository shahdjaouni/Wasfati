import type { Ingredient, PantryItem, Recipe } from '../types';
import { coverage, linkRecipeToPantry } from './match';
import { cleanText } from './text';

export interface LocalPick {
  recipe: Recipe;
  note?: string;
  wrapped?: boolean;
}

const CATEGORY_ORDER = ['vegetables', 'staples', 'liquids', 'spices'] as const;

export function rankRecipes(recipes: Recipe[], pantry: PantryItem[], excludeIds: string[] = []): Recipe[] {
  const excluded = new Set(excludeIds);
  return recipes
    .filter((recipe) => !excluded.has(recipe.id))
    .map((recipe) => ({ recipe, link: linkRecipeToPantry(recipe, pantry) }))
    .sort((a, b) => {
      const byCoverage = coverage(b.link) - coverage(a.link);
      if (byCoverage !== 0) return byCoverage;
      if (b.link.haveCount !== a.link.haveCount) return b.link.haveCount - a.link.haveCount;
      const missingA = a.link.total - a.link.haveCount;
      const missingB = b.link.total - b.link.haveCount;
      if (missingA !== missingB) return missingA - missingB;
      return a.recipe.name.localeCompare(b.recipe.name, 'ar');
    })
    .map((entry) => entry.recipe);
}

export const PANTRY_DISH_ID = 'local-pantry';

export function recipeFromPantry(pantry: PantryItem[], id: string = PANTRY_DISH_ID, now: string = new Date().toISOString()): Recipe | null {
  const picked = pickBalanced(pantry);
  if (picked.length === 0) return null;

  const ingredients: Ingredient[] = picked.map((item) => ({
    name: item.name,
    category: item.category,
    amount: item.amount,
  }));
  const names = ingredients.map((item) => item.name).join('، ');

  return {
    id,
    name: 'طبق من الثلاجة',
    ingredients,
    steps: [
      `جهّز: ${names}.`,
      'اجمع المونة والسوائل في قدر على نار هادئة.',
      'أضف الخضار ثم البهارات، واترك الطبق حتى يتجانس الطعم.',
      'قدّمه مباشرة.',
    ],
    photoUri: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function localSuggestion(options: {
  recipes: Recipe[];
  pantry: PantryItem[];
  excludeIds: string[];
  now?: string;
}): LocalPick | null {
  const ranked = rankRecipes(options.recipes, options.pantry, options.excludeIds);
  if (ranked[0]) return { recipe: ranked[0] };

  const generated = recipeFromPantry(options.pantry, PANTRY_DISH_ID, options.now);
  if (generated && !options.excludeIds.includes(PANTRY_DISH_ID)) {
    return { recipe: generated, note: 'اقتراح سريع مما هو متوفر في الثلاجة' };
  }

  if (options.excludeIds.length > 0) {
    const again = rankRecipes(options.recipes, options.pantry, [])[0];
    if (again) {
      return { recipe: again, note: 'هذه أقرب الوصفات المحفوظة لما في الثلاجة', wrapped: true };
    }
    if (generated) return { recipe: generated, note: 'هذا أنسب طبق من الموجود حالياً', wrapped: true };
  }

  return generated ? { recipe: generated, note: 'اقتراح سريع مما هو متوفر في الثلاجة' } : null;
}

function pickBalanced(pantry: PantryItem[]): PantryItem[] {
  const buckets = new Map<string, PantryItem[]>();
  for (const item of pantry) {
    const name = cleanText(item.name);
    if (!name) continue;
    const list = buckets.get(item.category) ?? [];
    list.push({ ...item, name });
    buckets.set(item.category, list);
  }

  const picked: PantryItem[] = [];
  for (const category of CATEGORY_ORDER) {
    const items = buckets.get(category) ?? [];
    for (const item of items.slice(0, 2)) {
      picked.push(item);
      if (picked.length >= 6) return picked;
    }
  }
  return picked;
}
