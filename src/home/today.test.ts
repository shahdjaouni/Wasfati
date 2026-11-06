import { describe, expect, it } from 'vitest';
import { createSeedData } from '../core/seed';
import type { Recipe } from '../types';
import {
  availabilityLabel,
  cookedOn,
  formatArabicDate,
  ingredientCountLabel,
  isFullyOnHand,
  missingLabel,
  recipesOnHand,
  suggestionBadge,
  weekStartingSaturday,
  weekStatusLabel,
} from './today';

const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe('today screen copy', () => {
  const friday = new Date(2026, 10, 6);

  it('formats the header date with western numerals', () => {
    expect(friday.getDay()).toBe(5);
    expect(formatArabicDate(friday)).toBe('الجمعة، 6 تشرين الثاني');
    expect(formatArabicDate(friday)).not.toMatch(/[٠-٩]/);
  });

  it('lays the week out Saturday to Friday and marks only today', () => {
    const week = weekStartingSaturday(friday);
    expect(week.map((day) => day.label)).toEqual(['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'اليوم']);
    expect(week[0]?.key).toBe('2026-10-31');
    expect(week[6]?.key).toBe('2026-11-06');
    expect(week.filter((day) => day.isToday).map((day) => day.key)).toEqual(['2026-11-06']);
    expect(cookedOn(week, [])).toEqual([false, false, false, false, false, false, false]);
    expect(cookedOn(week, ['2026-11-04'])[4]).toBe(true);
  });

  it('does not invent a cooked-count fraction when there is no record', () => {
    expect(weekStatusLabel(null)).toBe('لسه بدون سجل');
    expect(weekStatusLabel(2)).toBe('طبختي 2');
    expect(weekStatusLabel(2)).not.toMatch(/من/);
  });

  it('describes pantry coverage without a made-up time or dish type', () => {
    expect(availabilityLabel(6, 8)).toBe('متوفر عندك 6 من 8');
    expect(missingLabel(2)).toBe('ناقص 2');
    expect(ingredientCountLabel(8)).toBe('8 مكونات');
    expect(suggestionBadge(6)).toBe('اقتراح من مكوناتك');
    expect(suggestionBadge(0)).toBe('اقتراح اليوم');
  });

  it('keeps only recipes whose ingredients are all in the pantry', () => {
    const data = createSeedData(ids(), () => '2026-04-01T00:00:00.000Z');
    expect(recipesOnHand(data.recipes, data.pantry).map((recipe) => recipe.name)).toEqual([]);
    expect(isFullyOnHand(data.recipes[0] as Recipe, data.pantry)).toBe(false);

    const ready: Recipe = {
      id: 'ready',
      name: 'بطاطا مقلية',
      ingredients: [{ name: 'بطاطا', category: 'vegetables' }],
      steps: ['تقلى البطاطا.'],
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    };
    expect(recipesOnHand([ready, ...data.recipes], data.pantry).map((recipe) => recipe.name)).toEqual(['بطاطا مقلية']);
  });
});
