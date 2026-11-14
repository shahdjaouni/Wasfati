import type { DishSuggestion, PantryItem, Recipe } from '../types';
import { createId } from '../types';
import { localSuggestion } from '../core/suggest';
import { completeChatFlexible } from './client';
import { parseAiSuggestion } from './parse';

const SYSTEM_PROMPT = `أنت مساعد طبخ هادئ داخل تطبيق طبختي. اختر طبخة واحدة تناسب ما هو متوفر.
أجب بـ JSON فقط:
{"recipeId":"معرّف من الوصفات المحفوظة أو null","name":"اسم الطبخة إذا كانت جديدة","ingredients":[{"name":"","category":"vegetables|staples|spices|liquids","amount":""}],"steps":[""],"note":"جملة قصيرة"}
القواعد:
- فضّل recipeId من الوصفات المعطاة عندما تناسب الثلاجة، ولا تختر معرّفاً مستبعداً.
- إذا اقترحت طبخة جديدة فأعد استخدام أسماء مكونات الثلاجة حرفياً حين تستخدمها.
- category واحدة من: vegetables أو staples أو spices أو liquids.
- لا تذكر ما هو متوفر أو ناقص؛ التطبيق يحسب ذلك بنفسه.`;

export async function suggestDish(options: {
  recipes: Recipe[];
  pantry: PantryItem[];
  excludeIds?: string[];
  apiKey?: string | null;
  baseUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
  now?: string;
  createRecipeId?: () => string;
}): Promise<DishSuggestion | null> {
  const excludeIds = options.excludeIds ?? [];
  const local = localSuggestion({
    recipes: options.recipes,
    pantry: options.pantry,
    excludeIds,
    now: options.now,
  });

  const apiKey = options.apiKey?.trim();
  if (!apiKey) {
    return local ? { recipe: local.recipe, source: 'local', note: local.note, wrapped: local.wrapped } : null;
  }

  try {
    const content = await completeChatFlexible({
      apiKey,
      baseUrl: options.baseUrl?.trim() || 'https://api.openai.com/v1',
      model: options.model?.trim() || 'gpt-4o-mini',
      fetchImpl: options.fetchImpl,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            pantry: options.pantry.map((item) => ({
              name: item.name,
              category: item.category,
              amount: item.amount ?? '',
            })),
            recipes: options.recipes.map((recipe) => ({
              id: recipe.id,
              name: recipe.name,
              ingredients: recipe.ingredients,
            })),
            excludeRecipeIds: excludeIds,
          }),
        },
      ],
    });

    const payload = parseAiSuggestion(content);
    const resolved = payload
      ? resolvePayload(payload, options.recipes, excludeIds, options.now, options.createRecipeId)
      : null;
    if (resolved) return resolved;
  } catch {
    return local
      ? {
          recipe: local.recipe,
          source: 'local',
          note: local.note ?? 'تعذر الاتصال، اخترنا الأقرب محلياً',
          wrapped: local.wrapped,
        }
      : null;
  }

  return local
    ? {
        recipe: local.recipe,
        source: 'local',
        note: local.note ?? 'تعذر قراءة الاقتراح، اخترنا الأقرب محلياً',
        wrapped: local.wrapped,
      }
    : null;
}

function resolvePayload(
  payload: NonNullable<ReturnType<typeof parseAiSuggestion>>,
  recipes: Recipe[],
  excludeIds: string[],
  now: string | undefined,
  createRecipeId: (() => string) | undefined,
): DishSuggestion | null {
  if (payload.recipeId && !excludeIds.includes(payload.recipeId)) {
    const saved = recipes.find((recipe) => recipe.id === payload.recipeId);
    if (saved) return { recipe: saved, source: 'ai', note: payload.note };
  }

  if (!payload.name || payload.ingredients.length === 0) return null;
  const stamp = now ?? new Date().toISOString();
  const id = `ai-${createRecipeId?.() ?? createId()}`;
  return {
    source: 'ai',
    note: payload.note,
    recipe: {
      id,
      name: payload.name,
      ingredients: payload.ingredients,
      steps: payload.steps.length > 0 ? payload.steps : ['جهّز المكونات واطبخها على نار هادئة.'],
      photoUri: null,
      createdAt: stamp,
      updatedAt: stamp,
    },
  };
}
