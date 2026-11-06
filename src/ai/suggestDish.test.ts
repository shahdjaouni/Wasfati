import { describe, expect, it } from 'vitest';
import { formatProgress, linkRecipeToPantry } from '../core/match';
import { createSeedData } from '../core/seed';
import { chatCompletionsUrl } from './client';
import { parseAiSuggestion } from './parse';
import { suggestDish } from './suggestDish';
import type { PantryItem } from '../types';

const data = createSeedData(
  (() => {
    let n = 0;
    return () => `id-${++n}`;
  })(),
  () => '2026-04-01T00:00:00.000Z',
);

describe('AI suggestion provider', () => {
  it('uses local matching when no key is stored', async () => {
    const suggestion = await suggestDish({
      recipes: data.recipes,
      pantry: data.pantry,
      apiKey: '   ',
    });
    expect(suggestion?.source).toBe('local');
    expect(suggestion?.recipe.name).toBe('مقلوبة خضار');
    expect(formatProgress(linkRecipeToPantry(suggestion!.recipe, data.pantry))).toBe('عندك 7 من 8');
  });

  it('follows a saved recipe id from an OpenAI-compatible response and still links locally', async () => {
    const target = data.recipes.find((recipe) => recipe.name === 'شكشوكة')!;
    const fetchImpl = mockFetch({
      recipeId: target.id,
      note: 'مناسبة لوجبة سريعة',
    });
    const suggestion = await suggestDish({
      recipes: data.recipes,
      pantry: data.pantry,
      apiKey: 'sk-test',
      baseUrl: 'https://example.test/v1',
      model: 'test-model',
      fetchImpl,
    });

    expect(suggestion?.source).toBe('ai');
    expect(suggestion?.recipe.id).toBe(target.id);
    expect(suggestion?.note).toBe('مناسبة لوجبة سريعة');
    const link = linkRecipeToPantry(suggestion!.recipe, data.pantry);
    expect(formatProgress(link)).toBe('عندك 5 من 7');
    expect(link.missing.map((item) => item.name)).toEqual(['بندورة', 'فلفل أخضر']);
    expect(fetchImpl.urls[0]).toBe('https://example.test/v1/chat/completions');
  });

  it('links a newly generated recipe against the fridge, not against the model', async () => {
    const pantry: PantryItem[] = [{ id: 'p', name: 'بيض', category: 'staples', amount: '3' }];
    const suggestion = await suggestDish({
      recipes: [],
      pantry,
      apiKey: 'sk-test',
      now: '2026-04-01T00:00:00.000Z',
      createRecipeId: () => 'gen',
      fetchImpl: mockFetch({
        recipeId: null,
        name: 'عجة سريعة',
        ingredients: [
          { name: 'بيض', category: 'staples', amount: '3' },
          { name: 'بندورة', category: 'vegetables', amount: 'حبة' },
        ],
        steps: ['اخفق البيض واطبخه مع البندورة.'],
      }),
    });

    expect(suggestion?.recipe.name).toBe('عجة سريعة');
    expect(suggestion?.recipe.id).toBe('ai-gen');
    expect(formatProgress(linkRecipeToPantry(suggestion!.recipe, pantry))).toBe('عندك 1 من 2');
  });

  it('falls back locally when the provider rejects the call', async () => {
    const fetchImpl: typeof fetch = async () => new Response('no', { status: 401 });
    const suggestion = await suggestDish({
      recipes: data.recipes,
      pantry: data.pantry,
      apiKey: 'sk-test',
      fetchImpl,
    });
    expect(suggestion?.source).toBe('local');
    expect(suggestion?.recipe.name).toBe('مقلوبة خضار');
    expect(suggestion?.note).toContain('تعذر');
  });

  it('retries without response_format after a client error, and parses fenced JSON', async () => {
    let calls = 0;
    const target = data.recipes[1];
    const fetchImpl: typeof fetch = async (_url, init) => {
      calls += 1;
      const body = JSON.parse(String(init?.body));
      if (calls === 1) {
        expect(body.response_format).toEqual({ type: 'json_object' });
        return new Response('unsupported', { status: 400 });
      }
      expect(body.response_format).toBeUndefined();
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: '```json\n{"recipeId":"' + target.id + '","note":"من الثلاجة"}\n```',
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const suggestion = await suggestDish({
      recipes: data.recipes,
      pantry: data.pantry,
      apiKey: 'sk-test',
      fetchImpl,
    });
    expect(calls).toBe(2);
    expect(suggestion?.recipe.id).toBe(target.id);
    expect(parseAiSuggestion('not json')).toBeNull();
  });

  it('builds the chat URL from either a root or a full endpoint', () => {
    expect(chatCompletionsUrl('https://api.openai.com/v1/')).toBe('https://api.openai.com/v1/chat/completions');
    expect(chatCompletionsUrl('http://localhost:1234/v1/chat/completions')).toBe(
      'http://localhost:1234/v1/chat/completions',
    );
  });
});

function mockFetch(payload: unknown): typeof fetch & { urls: string[] } {
  const urls: string[] = [];
  const fetchImpl = (async (url: RequestInfo | URL) => {
    urls.push(String(url));
    return new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify(payload) } }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }) as typeof fetch & { urls: string[] };
  fetchImpl.urls = urls;
  return fetchImpl;
}
