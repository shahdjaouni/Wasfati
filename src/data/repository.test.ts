import { describe, expect, it } from 'vitest';
import { formatProgress, linkRecipeToPantry } from '../core/match';
import { MemoryStorage, Repository } from './repository';

describe('local repository', () => {
  it('seeds once, remembers edits, and does not resurrect samples after a wipe', async () => {
    const ids = sequentialIds();
    const repo = new Repository(new MemoryStorage(), ids, () => '2026-04-01T00:00:00.000Z');
    const seeded = await repo.load();
    expect(seeded.recipes.length).toBeGreaterThan(0);
    expect(seeded.initialized).toBe(true);

    const again = await repo.load();
    expect(again.recipes.map((recipe) => recipe.id)).toEqual(seeded.recipes.map((recipe) => recipe.id));

    const saved = await repo.saveRecipe({
      name: '  فتوش  ',
      ingredients: [{ name: ' خس ', category: 'vegetables', amount: 'رأس' }],
      steps: ['  يُقطع الخس  ', ' '],
      photoUri: null,
    });
    expect(saved.recipes[0]?.name).toBe('فتوش');
    expect(saved.recipes[0]?.steps).toEqual(['يُقطع الخس']);

    const wiped = await repo.clearContent();
    expect(wiped.recipes).toEqual([]);
    expect(wiped.pantry).toEqual([]);
    const stayedEmpty = await repo.load();
    expect(stayedEmpty.recipes).toEqual([]);
    expect(stayedEmpty.cookLog).toEqual([]);
    expect(stayedEmpty.plan).toEqual([]);
  });

  it('keeps older recipes and pantry items, and records one cook per day', async () => {
    const storage = new MemoryStorage();
    await storage.setItem(
      'tabkha.v1',
      JSON.stringify({
        initialized: true,
        recipes: [
          {
            id: 'old',
            name: 'مقلوبة خضار',
            ingredients: [{ name: 'بطاطا', category: 'vegetables' }],
            steps: ['تُطهى.'],
            minutes: '60',
            servings: 0,
            kind: 'main',
            vegetarian: true,
            favorite: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            photoUri: null,
          },
          {
            id: 'junk',
            name: 'ناقصة',
            ingredients: [],
            steps: ['خطوة'],
            minutes: 'كثيرة',
            kind: 'dessert',
            favorite: 'yes',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        pantry: [
          { id: 'dated', name: 'قرنبيط', category: 'vegetables', addedAt: '2026-11-01T00:00:00.000Z' },
          { id: 'plain', name: 'بصل', category: 'vegetables' },
        ],
        shopping: [],
        settings: { whatsappNumber: '', reminderEnabled: false, reminderHour: 18, reminderMinute: 0 },
        cookLog: [
          { date: '2026-11-07', recipeId: 'old', recipeName: 'مقلوبة خضار' },
          { date: 'not-a-day', recipeId: 'old', recipeName: 'مقلوبة خضار' },
        ],
        plan: [
          { date: '2026-11-08', recipeId: 'old' },
          { date: '2026-11-10', recipeId: 'old', manual: false },
          { date: 'bad', recipeId: 'old' },
        ],
      }),
    );

    const repo = new Repository(storage, sequentialIds(), () => '2026-11-10T12:00:00.000Z');
    const loaded = await repo.load();
    expect(loaded.recipes.map((recipe) => recipe.name)).toEqual(['مقلوبة خضار', 'ناقصة']);
    expect(loaded.recipes[0]?.minutes).toBe(60);
    expect(loaded.recipes[0]?.servings).toBeUndefined();
    expect(loaded.recipes[0]?.kind).toBe('main');
    expect(loaded.recipes[0]?.vegetarian).toBe(true);
    expect(loaded.recipes[0]?.favorite).toBe(true);
    expect(loaded.recipes[1]?.favorite).toBeUndefined();
    expect(loaded.recipes[1]?.minutes).toBeUndefined();
    expect(loaded.recipes[1]?.kind).toBeUndefined();
    expect(loaded.pantry.find((item) => item.id === 'dated')?.addedAt).toBe('2026-11-01T00:00:00.000Z');
    expect(loaded.pantry.find((item) => item.id === 'plain')?.addedAt).toBeUndefined();
    expect(loaded.settings.weeklyGoal).toBe(3);
    expect(loaded.settings.planDays).toEqual([1, 3, 6]);
    expect(loaded.settings.planPeople).toBe(4);
    expect(loaded.settings.planDouble).toBe(false);
    expect(loaded.plan).toEqual([
      { date: '2026-11-08', recipeId: 'old', manual: true },
      { date: '2026-11-10', recipeId: 'old', manual: false },
    ]);
    expect(loaded.cookLog).toEqual([{ date: '2026-11-07', recipeId: 'old', recipeName: 'مقلوبة خضار' }]);

    const once = await repo.markCooked('old', 'مقلوبة خضار');
    const twice = await repo.markCooked('old', 'مقلوبة خضار');
    const sameDay = twice.cookLog.filter((entry) => entry.date === once.cookLog.at(-1)?.date);
    expect(sameDay).toHaveLength(1);
    expect(twice.cookLog).toHaveLength(2);
  });

  it('persists a one-tap transfer of missing ingredients', async () => {
    const repo = new Repository(new MemoryStorage(), sequentialIds(), () => '2026-04-01T00:00:00.000Z');
    const data = await repo.load();
    const link = linkRecipeToPantry(data.recipes[0], data.pantry);
    expect(formatProgress(link)).toBe('عندك 7 من 8');

    const first = await repo.addShopping(link.missing);
    expect(first.added).toBe(1);
    expect(first.data.shopping[0]?.name).toBe('باذنجان');

    const duplicate = await repo.addShopping(link.missing);
    expect(duplicate.added).toBe(0);
    expect(duplicate.data.shopping).toHaveLength(1);

    const reloaded = await repo.load();
    expect(reloaded.shopping).toHaveLength(1);
  });
});

function sequentialIds(): () => string {
  let n = 0;
  return () => `id-${++n}`;
}
