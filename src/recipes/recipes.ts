import { linkRecipeToPantry } from '../core/match';
import { canonicalName } from '../core/text';
import { CATEGORIES, CATEGORY_LABELS, type IngredientCategory, type PantryItem, type Recipe } from '../types';

export type RecipeListFilter = 'all' | 'ready' | 'quick' | 'sweet' | 'favorite';

export const RECIPE_FILTERS: { id: RecipeListFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'ready', label: 'متوفرة الآن' },
  { id: 'quick', label: 'سريعة' },
  { id: 'sweet', label: 'حلويات' },
  { id: 'favorite', label: 'المفضلة' },
];

export interface PlateColors {
  tile: string;
  ring: string;
  food: string;
  dot: string;
}

/** Stable card colors. The same recipe keeps its plate wherever the list is filtered. */
export const PLATE_COLORS: PlateColors[] = [
  { tile: '#2F5D3A', ring: '#3B6C47', food: '#E8DCC0', dot: '#D9A55B' },
  { tile: '#F3E7CF', ring: '#EADAB8', food: '#FBF6EA', dot: '#B8834A' },
  { tile: '#E7B35A', ring: '#EDC47A', food: '#F2D08A', dot: '#C9822A' },
  { tile: '#6B4E36', ring: '#7D5F45', food: '#B99572', dot: '#E9D7B8' },
  { tile: '#E6EDE2', ring: '#D3DFCC', food: '#F5F1E4', dot: '#C7A46B' },
  { tile: '#B65A2E', ring: '#C46B3F', food: '#E7B977', dot: '#7A3A1A' },
];

export const CATEGORY_TONES: Record<IngredientCategory, { bg: string; fg: string }> = {
  vegetables: { bg: '#E6EDE2', fg: '#1F3F27' },
  staples: { bg: '#F3E7CF', fg: '#5A3F12' },
  spices: { bg: '#FBE0CC', fg: '#7A2E0E' },
  liquids: { bg: '#E2ECF3', fg: '#1E3A52' },
};

export function plateColors(id: string): PlateColors {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash + id.charCodeAt(index)) % PLATE_COLORS.length;
  return PLATE_COLORS[hash];
}

export function nextCategory(category: IngredientCategory): IngredientCategory {
  const index = CATEGORIES.indexOf(category);
  return CATEGORIES[(index + 1) % CATEGORIES.length];
}

export function categoryTone(category: IngredientCategory): { label: string; bg: string; fg: string } {
  return { label: CATEGORY_LABELS[category], ...CATEGORY_TONES[category] };
}

/** Short type for a card. A vegetarian main says نباتية. Nothing is invented when the kind was never saved. */
export function shortKind(recipe: Pick<Recipe, 'kind' | 'vegetarian'>): string | null {
  if (recipe.vegetarian === true && (recipe.kind === 'main' || recipe.kind == null)) return 'نباتية';
  if (recipe.kind === 'main') return 'رئيسية';
  if (recipe.kind === 'soup') return 'شوربة';
  if (recipe.kind === 'salad') return 'سلطة';
  if (recipe.kind === 'sweet') return 'حلو';
  return null;
}

/** «60 د · رئيسية». A missing minute or kind is left out. */
export function recipeCardMeta(recipe: Pick<Recipe, 'minutes' | 'kind' | 'vegetarian'>): string {
  const parts: string[] = [];
  if (recipe.minutes != null) parts.push(`${recipe.minutes} د`);
  const kind = shortKind(recipe);
  if (kind) parts.push(kind);
  return parts.join(' · ');
}

export function coverageBadge(recipe: Recipe, pantry: readonly PantryItem[]): { label: string; full: boolean } | null {
  const link = linkRecipeToPantry(recipe, [...pantry]);
  if (link.total <= 0) return null;
  if (link.haveCount === link.total) return { label: 'كله متوفر', full: true };
  return { label: `ناقص ${link.total - link.haveCount}`, full: false };
}

export function recipeMatchesQuery(recipe: Recipe, query: string): boolean {
  const needle = canonicalName(query);
  if (!needle) return true;
  if (canonicalName(recipe.name).includes(needle)) return true;
  return recipe.ingredients.some((ingredient) => canonicalName(ingredient.name).includes(needle));
}

export function recipeMatchesListFilter(recipe: Recipe, pantry: readonly PantryItem[], filter: RecipeListFilter): boolean {
  if (filter === 'favorite') return recipe.favorite === true;
  if (filter === 'sweet') return recipe.kind === 'sweet';
  if (filter === 'quick') return recipe.minutes != null && recipe.minutes < 30;
  if (filter === 'ready') {
    const link = linkRecipeToPantry(recipe, [...pantry]);
    return link.total > 0 && link.haveCount === link.total;
  }
  return true;
}

export function savedRecipeCount(count: number): string {
  return `${count} وصفة محفوظة`;
}
