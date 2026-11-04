import type { IngredientLink, PantryItem, Recipe } from '../types';
import { namesMatch } from './text';

export function linkRecipeToPantry(recipe: Recipe, pantry: PantryItem[]): IngredientLink {
  const have: IngredientLink['have'] = [];
  const missing: IngredientLink['missing'] = [];

  for (const ingredient of recipe.ingredients) {
    const matched = pantry.some((item) => namesMatch(item.name, ingredient.name));
    const linked = { ...ingredient, matched };
    if (matched) have.push(linked);
    else missing.push(linked);
  }

  return {
    recipe,
    have,
    missing,
    haveCount: have.length,
    total: recipe.ingredients.length,
  };
}

export function formatProgress(link: Pick<IngredientLink, 'haveCount' | 'total'>): string {
  return `عندك ${link.haveCount} من ${link.total}`;
}

export function coverage(link: Pick<IngredientLink, 'haveCount' | 'total'>): number {
  if (link.total === 0) return 0;
  return link.haveCount / link.total;
}
