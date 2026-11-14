import { describe, expect, it } from 'vitest';
import { mergeIntoShopping } from '../core/shopping';
import type { Ingredient, PantryItem, Recipe, ShoppingItem } from '../types';
import {
  coursePool,
  defaultGuestPlan,
  formatReadyTime,
  guestShoppingItems,
  migrateGuestPlan,
  prepSchedule,
  resolveMenu,
  scaleAmount,
  suggestMenu,
  swapCourse,
} from './guests';

function recipe(
  id: string,
  name: string,
  ingredients: Ingredient[],
  extra: Partial<Recipe> = {},
): Recipe {
  return {
    id,
    name,
    ingredients,
    steps: ['تُطهى.'],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...extra,
  };
}

const pantry: PantryItem[] = [{ id: 'rice', name: 'أرز', category: 'staples' }];

describe('guest menu', () => {
  const main = recipe('mansaf', 'منسف', [{ name: 'لحمة', category: 'staples' }, { name: 'أرز', category: 'staples' }], {
    kind: 'main',
    minutes: 240,
    servings: 4,
  });
  const veg = recipe('muj', 'مجدرة', [{ name: 'عدس', category: 'staples' }], { kind: 'main', vegetarian: true, servings: 4 });
  const salad = recipe('tab', 'تبولة', [{ name: 'بقدونس', category: 'vegetables', amount: 'ربطة' }], { kind: 'salad', servings: 4 });
  const sweet = recipe('knafeh', 'كنافة', [{ name: 'جبنة', category: 'staples', amount: '2 كوب' }], {
    kind: 'sweet',
    servings: 4,
  });
  const recipes = [sweet, salad, veg, main];

  it('builds each course from the saved type and does not invent a missing course', () => {
    const menu = suggestMenu(recipes, pantry);
    expect(menu.main).toBe('mansaf');
    expect(menu.vegetarian).toBe('muj');
    expect(menu.salad).toBe('tab');
    expect(menu.sweet).toBe('knafeh');
    expect(coursePool([main], 'salad')).toEqual([]);
    expect(suggestMenu([main], pantry).salad).toBeUndefined();
  });

  it('swaps within the course and keeps a saved pick', () => {
    const second = recipe('maq', 'مقلوبة', [{ name: 'دجاج', category: 'staples' }], { kind: 'main' });
    const menu = swapCourse({ main: 'mansaf' }, [main, second], pantry, 'main');
    expect(menu.main).toBe('maq');
    const again = swapCourse(menu, [main, second], pantry, 'main');
    expect(again.main).toBe('mansaf');
    expect(resolveMenu({ salad: 'tab' }, recipes, pantry).salad).toBe('tab');
  });

  it('scales missing amounts to the guests and adds each name once', () => {
    expect(scaleAmount('2 كوب', 4, 10)).toBe('5 كوب');
    expect(scaleAmount('ربطة', undefined, 10)).toBe('ربطة');
    const items = guestShoppingItems(recipes, { main: 'mansaf', sweet: 'knafeh', salad: 'tab' }, pantry, 10);
    expect(items.map((item) => item.name)).toEqual(['لحمة', 'بقدونس', 'جبنة']);
    expect(items.find((item) => item.name === 'جبنة')?.amount).toBe('5 كوب');

    const existing: ShoppingItem[] = [{
      id: 'have',
      name: 'لحمة',
      category: 'staples',
      checked: false,
      createdAt: '2026-11-01T00:00:00.000Z',
    }];
    const merged = mergeIntoShopping(existing, items, '2026-11-14T00:00:00.000Z', () => 'new');
    expect(merged.added).toBe(2);
    expect(merged.items.map((item) => item.name)).toEqual(['لحمة', 'بقدونس', 'جبنة']);
  });

  it('walks the prep list backwards from the ready time', () => {
    const steps = prepSchedule({
      event: new Date(2026, 10, 14),
      readyHour: 14,
      readyMinute: 0,
      mainMinutes: 240,
      hasSides: true,
      hasMissing: true,
    });
    expect(formatReadyTime(14, 0)).toBe('2:00 الظهر');
    expect(steps.map((step) => step.label)).toEqual([
      'الخميس',
      'الجمعة بالليل',
      'السبت 10:00',
      'السبت 12:30',
      'السبت 2:00',
    ]);
    expect(steps[0]?.detail).toBe('اشتري الأغراض الناقصة');
    expect(steps.at(-1)?.detail).toBe('صحتين للضيوف');
    expect(prepSchedule({
      event: new Date(2026, 10, 14),
      readyHour: 14,
      readyMinute: 0,
      hasSides: false,
      hasMissing: false,
    }).some((step) => step.detail === 'اشتري الأغراض الناقصة')).toBe(false);
  });

  it('keeps an older save and fills a guest plan only with real fields', () => {
    const migrated = migrateGuestPlan({
      occasion: 'birthday',
      date: '2026-11-14',
      readyHour: 14,
      readyMinute: 0,
      guests: 10,
      notes: [{ id: 'veg', kind: 'vegetarians', label: '2 نباتيين', count: 2 }, { id: 'x', kind: 'nope', label: 'لا' }],
      menu: { main: 'mansaf', salad: '' },
    }, new Date(2026, 10, 13));
    expect(migrated.occasion).toBe('birthday');
    expect(migrated.date).toBe('2026-11-14');
    expect(migrated.notes.map((note) => note.label)).toEqual(['2 نباتيين']);
    expect(migrated.menu).toEqual({ main: 'mansaf' });
    expect(defaultGuestPlan(new Date(2026, 10, 13)).date).toBe('2026-11-13');
    expect(migrateGuestPlan(undefined, new Date(2026, 10, 13)).menu).toEqual({});
  });
});
