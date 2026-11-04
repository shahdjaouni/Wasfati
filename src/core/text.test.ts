import { describe, expect, it } from 'vitest';
import { canonicalName, coerceCategory, namesMatch } from './text';

describe('canonical ingredient names', () => {
  it('strips the definite article, diacritics, and extra space', () => {
    expect(canonicalName('  البَندورة  ')).toBe('بندورة');
    expect(canonicalName('كمون')).toBe('كمون');
  });

  it('treats common synonyms as the same ingredient', () => {
    expect(namesMatch('طماطم', 'بندورة')).toBe(true);
    expect(namesMatch('أرز', 'رز')).toBe(true);
    expect(namesMatch('بطاطس', 'بطاطا')).toBe(true);
    expect(namesMatch('فلفل أسود', 'بهار اسود')).toBe(true);
  });

  it('matches a shorter name when it is a whole token of the longer one', () => {
    expect(namesMatch('زيت', 'زيت زيتون')).toBe(true);
    expect(namesMatch('حليب', 'كمون')).toBe(false);
    expect(namesMatch('', 'ملح')).toBe(false);
  });

  it('accepts Arabic category labels', () => {
    expect(coerceCategory('خضار')).toBe('vegetables');
    expect(coerceCategory('سوائل')).toBe('liquids');
    expect(coerceCategory('unknown')).toBe('staples');
  });
});
