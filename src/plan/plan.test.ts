import { describe, expect, it } from 'vitest';
import { mergeIntoShopping } from '../core/shopping';
import { sanitizeSettings } from '../data/settings';
import type { Ingredient, PantryItem, Recipe, ShoppingItem } from '../types';
import {
  applyFrequency,
  fillWeek,
  leftoverNote,
  missingPlanIngredients,
  plannedRecipeForToday,
  togglePlanDay,
  weekRangeLabel,
} from './plan';

function recipe(id: string, name: string, ingredients: Ingredient[], servings?: number): Recipe {
  return {
    id,
    name,
    ingredients,
    steps: ['تُطهى.'],
    servings,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

describe('weekly plan', () => {
  it('treats the frequency chip as the weekly goal and keeps a custom day set that matches it', () => {
    expect(applyFrequency(3)).toEqual({ weeklyGoal: 3, planDays: [1, 3, 6] });
    expect(sanitizeSettings({ weeklyGoal: 4 }).planDays).toEqual([0, 2, 4, 6]);
    expect(sanitizeSettings({ weeklyGoal: 4 }).weeklyGoal).toBe(4);

    const custom = sanitizeSettings({ weeklyGoal: 2, planDays: [0, 6] });
    expect(custom.weeklyGoal).toBe(2);
    expect(custom.planDays).toEqual([0, 6]);

    const added = togglePlanDay([1, 3, 6], 0);
    expect(added.weeklyGoal).toBe(4);
    expect(added.planDays).toEqual([0, 1, 3, 6]);
    expect(togglePlanDay([6], 6)).toEqual({ weeklyGoal: 1, planDays: [6] });
  });

  it('fills the week from pantry coverage without repeating, and prefers a recipe that feeds the people', () => {
    const pantry: PantryItem[] = [
      { id: 'p', name: 'عدس', category: 'staples' },
      { id: 'r', name: 'أرز', category: 'staples' },
    ];
    const small = recipe('small', 'مجدرة', [{ name: 'عدس', category: 'staples' }, { name: 'أرز', category: 'staples' }], 2);
    const fits = recipe('fits', 'شوربة عدس', [{ name: 'عدس', category: 'staples' }, { name: 'جزر', category: 'vegetables' }], 4);
    const other = recipe('other', 'أرز بالحليب', [{ name: 'حليب', category: 'liquids' }], 6);

    const one = fillWeek({ recipes: [small, fits], pantry, dates: ['2026-11-10'], people: 4 });
    expect(one.map((slot) => slot.recipeId)).toEqual(['fits']);

    const week = fillWeek({
      recipes: [small, fits, other],
      pantry,
      dates: ['2026-11-08', '2026-11-10', '2026-11-13', '2026-11-14'],
      people: 4,
    });
    expect(week.map((slot) => slot.recipeId)).toEqual(['fits', 'other', 'small', 'fits']);
    expect(fillWeek({ recipes: [], pantry, dates: ['2026-11-10'], people: 4 })).toEqual([]);
  });

  it('lists each missing ingredient once, and only from meals that are not cooked yet', () => {
    const lentils = recipe('soup', 'شوربة عدس', [
      { name: 'عدس', category: 'staples' },
      { name: 'لبن', category: 'liquids' },
    ]);
    const maq = recipe('maq', 'مقلوبة', [
      { name: 'لبن', category: 'liquids' },
      { name: 'دجاج', category: 'staples' },
    ]);
    const cooked = recipe('done', 'مجدرة', [{ name: 'خبز', category: 'staples' }]);
    const pantry: PantryItem[] = [{ id: 'l', name: 'عدس', category: 'staples' }];
    const missing = missingPlanIngredients({
      slots: [
        { date: '2026-11-08', recipeId: 'done' },
        { date: '2026-11-10', recipeId: 'soup' },
        { date: '2026-11-13', recipeId: 'maq' },
      ],
      recipes: [lentils, maq, cooked],
      pantry,
      cookedDates: ['2026-11-08'],
    });
    expect(missing.map((item) => item.name)).toEqual(['لبن', 'دجاج']);

    const existing: ShoppingItem[] = [
      {
        id: 's',
        name: 'لبن',
        category: 'liquids',
        checked: false,
        createdAt: '2026-11-01T00:00:00.000Z',
      },
    ];
    const first = mergeIntoShopping(existing, missing, '2026-11-10T00:00:00.000Z', () => 'new');
    expect(first.added).toBe(1);
    expect(first.items.map((item) => item.name)).toEqual(['لبن', 'دجاج']);
    const again = mergeIntoShopping(first.items, missing, '2026-11-10T00:00:00.000Z', () => 'newer');
    expect(again.added).toBe(0);
    expect(again.items).toHaveLength(2);
  });

  it('names the week and the leftover day, and lets home prefer today only when the filter allows it', () => {
    expect(weekRangeLabel(new Date(2026, 10, 10))).toBe('7 – 13 تشرين الثاني');
    expect(weekRangeLabel(new Date(2026, 11, 1))).toBe('28 تشرين الثاني – 4 كانون الأول');
    expect(leftoverNote(0, true)).toBe('+ بواقي لـأحد');
    expect(leftoverNote(6, true)).toBeNull();

    const planned = recipe('maq', 'مقلوبة', [{ name: 'أرز', category: 'staples' }]);
    planned.minutes = 60;
    const slots = [{ date: '2026-11-10', recipeId: 'maq' }];
    expect(plannedRecipeForToday([planned], slots, '2026-11-10', [], null)?.id).toBe('maq');
    expect(plannedRecipeForToday([planned], slots, '2026-11-10', [], 'quick')).toBeNull();
    expect(plannedRecipeForToday([planned], slots, '2026-11-11', [], null)).toBeNull();
  });
});
