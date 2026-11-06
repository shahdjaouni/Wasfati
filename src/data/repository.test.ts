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
