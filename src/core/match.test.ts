import { describe, expect, it } from 'vitest';
import { createSeedData } from './seed';
import { formatProgress, linkRecipeToPantry } from './match';
import { localSuggestion, rankRecipes } from './suggest';
import type { PantryItem, Recipe } from '../types';

const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe('fridge to recipe link', () => {
  it('shows how many ingredients are already in the fridge', () => {
    const data = createSeedData(ids(), () => '2026-04-01T00:00:00.000Z');
    const ranked = rankRecipes(data.recipes, data.pantry);
    expect(ranked[0]?.name).toBe('مقلوبة خضار');

    const link = linkRecipeToPantry(ranked[0], data.pantry);
    expect(formatProgress(link)).toBe('عندك 7 من 8');
    expect(link.missing.map((item) => item.name)).toEqual(['باذنجان']);
    expect(link.have).toHaveLength(7);
    expect(data.shopping).toEqual([]);
  });

  it('offers a different recipe next and then starts over', () => {
    const data = createSeedData(ids(), () => '2026-04-01T00:00:00.000Z');
    const first = localSuggestion({ recipes: data.recipes, pantry: data.pantry, excludeIds: [] });
    const second = localSuggestion({
      recipes: data.recipes,
      pantry: data.pantry,
      excludeIds: [first!.recipe.id],
    });

    expect(first?.recipe.name).toBe('مقلوبة خضار');
    expect(second?.recipe.name).toBe('أرز بالحليب');
    expect(second?.recipe.id).not.toBe(first?.recipe.id);

    const allIds = data.recipes.map((recipe) => recipe.id);
    const wrapped = localSuggestion({
      recipes: data.recipes,
      pantry: data.pantry,
      excludeIds: [...allIds, 'local-pantry'],
    });
    expect(wrapped?.recipe.name).toBe('مقلوبة خضار');
    expect(wrapped?.wrapped).toBe(true);
  });

  it('matches synonyms ingredient by ingredient', () => {
    const recipe: Recipe = {
      id: 'r1',
      name: 'سلطة',
      ingredients: [
        { name: 'طماطم', category: 'vegetables' },
        { name: 'خيار', category: 'vegetables' },
      ],
      steps: ['تقطيع'],
      createdAt: 't',
      updatedAt: 't',
    };
    const pantry: PantryItem[] = [{ id: 'p1', name: 'بندورة', category: 'vegetables' }];
    const link = linkRecipeToPantry(recipe, pantry);
    expect(formatProgress(link)).toBe('عندك 1 من 2');
    expect(link.have.map((item) => item.name)).toEqual(['طماطم']);
    expect(link.missing.map((item) => item.name)).toEqual(['خيار']);
  });

  it('builds a dish from the fridge when nothing is saved', () => {
    const pantry: PantryItem[] = [
      { id: '1', name: 'بيض', category: 'staples' },
      { id: '2', name: 'حليب', category: 'liquids' },
    ];
    const suggestion = localSuggestion({ recipes: [], pantry, excludeIds: [] });
    expect(suggestion?.recipe.name).toBe('طبق من الثلاجة');
    const link = linkRecipeToPantry(suggestion!.recipe, pantry);
    expect(link.missing).toEqual([]);
    expect(link.haveCount).toBe(link.total);
  });
});
