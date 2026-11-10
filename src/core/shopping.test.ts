import { describe, expect, it } from 'vitest';
import { buildWhatsAppUrl, normalizePhone } from './phone';
import { buildShoppingMessage, mergeIntoShopping } from './shopping';
import { reminderRequest } from './reminder';
import type { ShoppingItem } from '../types';

describe('shopping list', () => {
  it('adds missing ingredients once, even across synonyms', () => {
    let n = 0;
    const existing: ShoppingItem[] = [
      {
        id: 's1',
        name: 'بندورة',
        category: 'vegetables',
        checked: false,
        createdAt: 't',
      },
    ];
    const first = mergeIntoShopping(
      existing,
      [
        { name: 'طماطم', category: 'vegetables' },
        { name: 'حليب', category: 'liquids', amount: 'لتر' },
      ],
      '2026-04-01T00:00:00.000Z',
      () => `new-${++n}`,
    );
    expect(first.added).toBe(1);
    expect(first.items.map((item) => item.name)).toEqual(['بندورة', 'حليب']);

    const second = mergeIntoShopping(first.items, [{ name: 'حليب', category: 'liquids' }], 't', () => 'x');
    expect(second.added).toBe(0);
  });

  it('writes a neat Arabic message and a wa.me link, skipping checked rows', () => {
    const items: ShoppingItem[] = [
      { id: '1', name: 'باذنجان', category: 'vegetables', amount: 'حبة', checked: false, createdAt: 't' },
      { id: '2', name: 'خبز', category: 'staples', checked: true, createdAt: 't' },
    ];
    const message = buildShoppingMessage(items);
    expect(message).toContain('السلام عليكم');
    expect(message).toContain('1. باذنجان (خضار) — حبة');
    expect(message).not.toContain('خبز');
    expect(message).toContain('عدد الأصناف: 1 صنف');

    expect(buildWhatsAppUrl('+966 55 111 2233', message!)).toBe(
      `https://wa.me/966551112233?text=${encodeURIComponent(message!)}`,
    );
    expect(normalizePhone('٠٥٥١١١٢٢٣٣')).toBeNull();
    expect(normalizePhone('+٩٦٦٥٠٠٠٠٠٠٠٠')).toBe('966500000000');
    expect(buildShoppingMessage(items.map((item) => ({ ...item, checked: true })))).toBeNull();
  });

  it('schedules the shopping reminder only when the user asks for it', () => {
    expect(
      reminderRequest({
        whatsappNumber: '',
        reminderEnabled: false,
        reminderHour: 18,
        reminderMinute: 0,
        aiBaseUrl: 'https://api.openai.com/v1',
        aiModel: 'gpt-4o-mini',
        weeklyGoal: 3,
      }),
    ).toBeNull();

    expect(
      reminderRequest({
        whatsappNumber: '',
        reminderEnabled: true,
        reminderHour: 26,
        reminderMinute: -4,
        aiBaseUrl: 'https://api.openai.com/v1',
        aiModel: 'gpt-4o-mini',
        weeklyGoal: 3,
      }),
    ).toMatchObject({
      hour: 23,
      minute: 0,
      title: 'طبختي',
      body: 'راجع قائمة المشتريات وأرسلها إلى السوبرماركت',
    });
  });
});
