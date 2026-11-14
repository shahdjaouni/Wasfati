import type { Ingredient, IngredientCategory } from '../types';
import { cleanText, coerceCategory } from '../core/text';

export interface AiPayload {
  recipeId: string | null;
  name?: string;
  ingredients: Ingredient[];
  steps: string[];
  note?: string;
}

export function parseAiSuggestion(content: string): AiPayload | null {
  const jsonText = extractJson(content);
  if (!jsonText) return null;

  let value: unknown;
  try {
    value = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const recipeId = typeof record.recipeId === 'string' && record.recipeId.trim() ? record.recipeId.trim() : null;
  const name = typeof record.name === 'string' ? cleanText(record.name) : '';
  const ingredients = Array.isArray(record.ingredients) ? record.ingredients.map(readIngredient).filter((item) => item.name) : [];
  const steps = Array.isArray(record.steps)
    ? record.steps.filter((step): step is string => typeof step === 'string').map((step) => cleanText(step)).filter(Boolean)
    : [];
  const note = typeof record.note === 'string' ? cleanText(record.note) : undefined;

  if (!recipeId && !name) return null;
  return { recipeId, name: name || undefined, ingredients, steps, note };
}

function readIngredient(value: unknown): Ingredient {
  if (!value || typeof value !== 'object') return { name: '', category: 'staples' };
  const record = value as Record<string, unknown>;
  const category: IngredientCategory = coerceCategory(record.category);
  const amount = typeof record.amount === 'string' ? cleanText(record.amount) : undefined;
  return {
    name: typeof record.name === 'string' ? cleanText(record.name) : '',
    category,
    amount: amount || undefined,
  };
}

function extractJson(content: string): string | null {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}
