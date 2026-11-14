import { describe, expect, it } from 'vitest';
import type { PantryItem, Recipe } from '../types';
import {
  findUseSoon,
  fridgeAgeDays,
  recipeMatchesFilter,
  recipeMetaLine,
  useSoonMessage,
  weekStartingSaturday,
} from './today';

const stamp = '2026-11-01T00:00:00.000Z';

function recipe(partial: Partial<Recipe> & Pick<Recipe, 'id' | 'name'>): Recipe {
  return {
    ingredients: [],
    steps: ['خطوة'],
    createdAt: stamp,
    updatedAt: stamp,
    ...partial,
  };
}

describe('home details', () => {
  const tuesday = new Date(2026, 10, 10);

  it('joins only the recipe fields that were saved', () => {
    expect(recipeMetaLine(recipe({ id: 'a', name: 'مقلوبة', minutes: 60, servings: 4, kind: 'main' }))).toBe(
      '60 دقيقة · 4 أشخاص · طبخة رئيسية',
    );
    expect(recipeMetaLine(recipe({ id: 'b', name: 'شوربة', minutes: 25 }))).toBe('25 دقيقة');
    expect(recipeMetaLine(recipe({ id: 'c', name: 'بدون تفاصيل' }))).toBeNull();
  });

  it('filters suggestions from minutes, pantry, and the vegetarian or sweet marks', () => {
    const pantry: PantryItem[] = [{ id: 'p', name: 'عدس', category: 'staples' }];
    const quick = recipe({
      id: 'quick',
      name: 'شوربة',
      minutes: 20,
      kind: 'soup',
      vegetarian: true,
      ingredients: [{ name: 'عدس', category: 'staples' }],
    });
    const slow = recipe({ id: 'slow', name: 'مقلوبة', minutes: 60, kind: 'main', vegetarian: true });
    const sweet = recipe({ id: 'sweet', name: 'أرز بالحليب', minutes: 40, kind: 'sweet', vegetarian: true });
    const eggs = recipe({ id: 'eggs', name: 'شكشوكة', minutes: 15, vegetarian: false });
    const unknown = recipe({ id: 'old', name: 'قديمة' });

    expect(recipeMatchesFilter(quick, pantry, 'quick')).toBe(true);
    expect(recipeMatchesFilter(slow, pantry, 'quick')).toBe(false);
    expect(recipeMatchesFilter(unknown, pantry, 'quick')).toBe(false);
    expect(recipeMatchesFilter(quick, pantry, 'onHand')).toBe(true);
    expect(recipeMatchesFilter(slow, pantry, 'onHand')).toBe(false);
    expect(recipeMatchesFilter(quick, pantry, 'vegetarian')).toBe(true);
    expect(recipeMatchesFilter(eggs, pantry, 'vegetarian')).toBe(false);
    expect(recipeMatchesFilter(unknown, pantry, 'vegetarian')).toBe(false);
    expect(recipeMatchesFilter(sweet, pantry, 'sweet')).toBe(true);
    expect(recipeMatchesFilter(quick, pantry, 'sweet')).toBe(false);
  });

  it('counts a cooked day once inside the Saturday week', () => {
    const week = weekStartingSaturday(tuesday);
    const keys = new Set(['2026-11-07', '2026-11-08', '2026-11-07']);
    expect(week.filter((day) => keys.has(day.key)).map((day) => day.key)).toEqual(['2026-11-07', '2026-11-08']);
  });

  it('shows use-soon only for a real added date that is old enough', () => {
    const today = new Date(2026, 10, 10);
    const cauliflower: PantryItem = {
      id: 'c',
      name: 'قرنبيط',
      category: 'vegetables',
      addedAt: '2026-11-05T08:00:00.000Z',
    };
    const undated: PantryItem = { id: 'u', name: 'بصل', category: 'vegetables' };
    const fresh: PantryItem = {
      id: 'f',
      name: 'جزر',
      category: 'vegetables',
      addedAt: '2026-11-09T08:00:00.000Z',
    };
    expect(fridgeAgeDays(undefined, today)).toBeNull();
    expect(fridgeAgeDays(fresh.addedAt, today)).toBe(1);
    expect(fridgeAgeDays(cauliflower.addedAt, today)).toBe(5);

    const dish = recipe({
      id: 'maq',
      name: 'مقلوبة قرنبيط',
      ingredients: [{ name: 'قرنبيط', category: 'vegetables' }],
    });
    const soon = findUseSoon([undated, fresh, cauliflower], [dish], today);
    expect(soon?.item.name).toBe('قرنبيط');
    expect(soon?.days).toBe(5);
    expect(useSoonMessage(soon!)).toBe('استعمليه قريباً: قرنبيط صار له 5 أيام بالثلاجة، ومقلوبة قرنبيط بتخلّصه.');
    expect(findUseSoon([undated, fresh], [dish], today)).toBeNull();
  });
});