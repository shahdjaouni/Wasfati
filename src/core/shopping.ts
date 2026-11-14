import type { Ingredient, ShoppingItem } from '../types';
import { createId } from '../types';
import { categoryLabel, canonicalName, cleanText } from './text';

export function mergeIntoShopping(
  shopping: ShoppingItem[],
  incoming: Ingredient[],
  now: string,
  ids: () => string = createId,
): { items: ShoppingItem[]; added: number } {
  const seen = new Set(shopping.map((item) => canonicalName(item.name)));
  const items = [...shopping];
  let added = 0;

  for (const ingredient of incoming) {
    const name = cleanText(ingredient.name);
    const key = canonicalName(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: ids(),
      name,
      category: ingredient.category,
      amount: ingredient.amount ? cleanText(ingredient.amount) : undefined,
      checked: false,
      createdAt: now,
    });
    added += 1;
  }

  return { items, added };
}

export function buildShoppingMessage(items: ShoppingItem[]): string | null {
  const pending = items.filter((item) => !item.checked);
  if (pending.length === 0) return null;

  const lines = pending.map((item, index) => {
    const amount = item.amount ? ` — ${item.amount}` : '';
    return `${index + 1}. ${item.name} (${categoryLabel(item.category)})${amount}`;
  });
  const noun = pending.length === 1 ? 'صنف' : 'أصناف';

  return [
    'السلام عليكم',
    'نرجو تجهيز الأصناف التالية:',
    '',
    ...lines,
    '',
    `عدد الأصناف: ${pending.length} ${noun}`,
    'شكراً لكم',
  ].join('\n');
}
