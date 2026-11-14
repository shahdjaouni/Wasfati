import { Platform } from 'react-native';
import { defaultGuestPlan } from '../guests/guests';
import { defaultSettings, type AppData, type Recipe } from '../types';
import { dayKey, weekStartingSaturday } from './today';

/** Web-only comparison fixture. Native builds never read the query string. */
export function isHomeSampleRequest(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('homeSample') === '1';
}

function recipe(
  id: string,
  name: string,
  ingredients: Recipe['ingredients'],
  details: Pick<Recipe, 'minutes' | 'servings' | 'kind' | 'vegetarian'>,
  steps: string[],
): Recipe {
  return {
    id,
    name,
    ingredients,
    steps,
    photoUri: null,
    ...details,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

/** Sample home data so a 390px screenshot can be compared with the mockup. It is not written to the phone. */
export function createHomeSample(today: Date): AppData {
  const week = weekStartingSaturday(today);
  const todayKey = dayKey(today);
  const cooked = week.filter((day) => day.key < todayKey).slice(0, 2);
  const fiveDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString();

  return {
    initialized: true,
    settings: defaultSettings(),
    shopping: [],
    plan: [],
    guestPlan: defaultGuestPlan(today),
    cookLog: cooked.map((day) => ({ date: day.key, recipeId: 'sample-maq', recipeName: 'مقلوبة قرنبيط' })),
    recipes: [
      recipe(
        'sample-maq',
        'مقلوبة قرنبيط',
        [
          { name: 'قرنبيط', category: 'vegetables' },
          { name: 'بطاطا', category: 'vegetables' },
          { name: 'بصل', category: 'vegetables' },
          { name: 'أرز', category: 'staples' },
          { name: 'بهارات مشكلة', category: 'spices' },
          { name: 'زيت', category: 'staples' },
          { name: 'لبن', category: 'liquids' },
          { name: 'صنوبر', category: 'staples' },
        ],
        { minutes: 60, servings: 4, kind: 'main', vegetarian: true },
        ['تُقلى الخضار.', 'يُضاف الأرز ويُغطى القدر.', 'تُقلب المقلوبة وتُقدّم.'],
      ),
      recipe(
        'sample-soup',
        'شوربة عدس',
        [
          { name: 'عدس', category: 'staples' },
          { name: 'بصل', category: 'vegetables' },
        ],
        { minutes: 20, servings: 4, kind: 'soup', vegetarian: true },
        ['تُسلق الشوربة.'],
      ),
      recipe(
        'sample-sweet',
        'أرز بالحليب',
        [
          { name: 'أرز', category: 'staples' },
          { name: 'حليب', category: 'liquids' },
          { name: 'سكر', category: 'staples' },
        ],
        { minutes: 40, servings: 6, kind: 'sweet', vegetarian: true },
        ['يُطهى الأرز بالحليب.'],
      ),
    ],
    pantry: [
      { id: 'c', name: 'قرنبيط', category: 'vegetables', addedAt: fiveDaysAgo },
      { id: 'p', name: 'بطاطا', category: 'vegetables', addedAt: today.toISOString() },
      { id: 'o', name: 'بصل', category: 'vegetables', addedAt: today.toISOString() },
      { id: 'r', name: 'أرز', category: 'staples', addedAt: today.toISOString() },
      { id: 's', name: 'بهارات مشكلة', category: 'spices', addedAt: today.toISOString() },
      { id: 'z', name: 'زيت', category: 'staples', addedAt: today.toISOString() },
    ],
  };
}
