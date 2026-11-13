import { Platform } from 'react-native';
import { defaultGuestPlan } from '../guests/guests';
import { defaultSettings, type AppData, type Recipe } from '../types';
import { weekStartingSaturday } from '../home/today';

/** Web-only comparison fixture. Native builds never read the query string. */
export function isPlanSampleRequest(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('planSample') === '1';
}

function recipe(
  id: string,
  name: string,
  ingredients: Recipe['ingredients'],
  minutes: number,
): Recipe {
  return {
    id,
    name,
    ingredients,
    steps: ['تُطهى وتُقدّم.'],
    photoUri: null,
    minutes,
    servings: 4,
    kind: 'main',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

/** Sample plan for a 390px screenshot. It is loaded in memory and is not written to the phone. */
export function createPlanSample(today: Date): AppData {
  const week = weekStartingSaturday(today);
  const sunday = week[1].key;
  const tuesday = week[3].key;
  const friday = week[6].key;

  return {
    initialized: true,
    settings: {
      ...defaultSettings(),
      weeklyGoal: 3,
      planDays: [1, 3, 6],
      planPeople: 4,
      planDouble: false,
    },
    shopping: [],
    guestPlan: defaultGuestPlan(today),
    cookLog: [{ date: sunday, recipeId: 'plan-muj', recipeName: 'مجدّرة' }],
    plan: [
      { date: sunday, recipeId: 'plan-muj' },
      { date: tuesday, recipeId: 'plan-soup' },
      { date: friday, recipeId: 'plan-maq' },
    ],
    recipes: [
      recipe('plan-muj', 'مجدّرة', [
        { name: 'عدس', category: 'staples' },
        { name: 'أرز', category: 'staples' },
        { name: 'بصل', category: 'vegetables' },
      ], 45),
      recipe('plan-soup', 'شوربة عدس', [
        { name: 'عدس', category: 'staples' },
        { name: 'بصل', category: 'vegetables' },
        { name: 'لبن', category: 'liquids' },
        { name: 'صنوبر', category: 'staples' },
      ], 35),
      recipe('plan-maq', 'مقلوبة قرنبيط', [
        { name: 'قرنبيط', category: 'vegetables' },
        { name: 'أرز', category: 'staples' },
        { name: 'دجاج', category: 'staples' },
        { name: 'حمص', category: 'staples' },
        { name: 'خبز', category: 'staples' },
      ], 60),
    ],
    pantry: [
      { id: 'lentils', name: 'عدس', category: 'staples', addedAt: today.toISOString() },
      { id: 'rice', name: 'أرز', category: 'staples', addedAt: today.toISOString() },
      { id: 'onion', name: 'بصل', category: 'vegetables', addedAt: today.toISOString() },
      { id: 'cauli', name: 'قرنبيط', category: 'vegetables', addedAt: today.toISOString() },
    ],
  };
}
