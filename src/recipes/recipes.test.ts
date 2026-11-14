import { describe, expect, it } from 'vitest';
import type { PantryItem, Recipe } from '../types';
import { coverageBadge, recipeCardMeta, recipeMatchesListFilter, recipeMatchesQuery, savedRecipeCount } from './recipes';

function recipe(patch: Partial<Recipe> & Pick<Recipe, 'id' | 'name'>): Recipe {
  return {
    ingredients: [],
    steps: ['تُطهى.'],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...patch,
  };
}

describe('recipe list', () => {
  const pantry: PantryItem[] = [
    { id: 'r', name: 'أرز', category: 'staples' },
    { id: 'm', name: 'حليب', category: 'liquids' },
  ];
  const rice = recipe({
    id: 'rice',
    name: 'أرز بالحليب',
    minutes: 40,
    kind: 'sweet',
    favorite: true,
    ingredients: [
      { name: 'أرز', category: 'staples' },
      { name: 'حليب', category: 'liquids' },
    ],
  });
  const soup = recipe({
    id: 'soup',
    name: 'شوربة عدس',
    minutes: 20,
    kind: 'soup',
    ingredients: [
      { name: 'عدس', category: 'staples' },
      { name: 'بصل', category: 'vegetables' },
    ],
  });

  it('searches the dish and its ingredients, and filters without inventing a favorite', () => {
    expect(recipeMatchesQuery(soup, 'عدس')).toBe(true);
    expect(recipeMatchesQuery(soup, 'أرز')).toBe(false);
    expect(recipeMatchesListFilter(rice, pantry, 'sweet')).toBe(true);
    expect(recipeMatchesListFilter(soup, pantry, 'quick')).toBe(true);
    expect(recipeMatchesListFilter(rice, pantry, 'quick')).toBe(false);
    expect(recipeMatchesListFilter(rice, pantry, 'ready')).toBe(true);
    expect(recipeMatchesListFilter(soup, pantry, 'ready')).toBe(false);
    expect(recipeMatchesListFilter(rice, pantry, 'favorite')).toBe(true);
    expect(recipeMatchesListFilter(soup, pantry, 'favorite')).toBe(false);
  });

  it('shows minutes and a short type only when they were saved', () => {
    expect(recipeCardMeta(rice)).toBe('40 د · حلو');
    expect(recipeCardMeta(recipe({ id: 'v', name: 'مجدرة', kind: 'main', vegetarian: true, minutes: 45 }))).toBe(
      '45 د · نباتية',
    );
    expect(recipeCardMeta(recipe({ id: 'plain', name: 'بدون' }))).toBe('');
    expect(coverageBadge(soup, pantry)).toEqual({ label: 'ناقص 2', full: false });
    expect(coverageBadge(rice, pantry)).toEqual({ label: 'كله متوفر', full: true });
    expect(savedRecipeCount(12)).toBe('12 وصفة محفوظة');
  });
});