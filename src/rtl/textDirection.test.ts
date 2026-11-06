import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { availabilityLabel, formatArabicDate } from '../home/today';
import {
  TAB_TITLES,
  androidLineAlignment,
  containerDirectionStyle,
  paragraphTextStyle,
} from './textDirection';

const require = createRequire(import.meta.url);
const { ensureAndroidRtl } = require('../../plugins/withAndroidRtl.js') as {
  ensureAndroidRtl: (contents: string) => string;
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') || path.endsWith('.tsx') ? [path] : [];
  });
}

describe('native RTL text', () => {
  it('does not force writingDirection or textAlign right on native', () => {
    expect(paragraphTextStyle('native')).toEqual({});
    expect(containerDirectionStyle('native')).toEqual({ direction: 'rtl' });
  });

  it('keeps an Arabic line on the start edge instead of the reversed end edge', () => {
    const native = paragraphTextStyle('native');
    expect(
      androidLineAlignment({
        paragraphRtl: true,
        scriptRtl: true,
        textAlign: native.textAlign,
      }),
    ).toBe('normal');

    expect(androidLineAlignment({ paragraphRtl: true, scriptRtl: true, textAlign: 'right' })).toBe('opposite');
  });

  it('keeps counts and the date in logical order with western digits', () => {
    expect(availabilityLabel(7, 8)).toBe('متوفر عندك 7 من 8');
    expect(formatArabicDate(new Date(2026, 10, 6))).toBe('الجمعة، 6 تشرين الثاني');
    expect(availabilityLabel(7, 8)).not.toMatch(/[٠-٩]/);
  });

  it('lists the five tabs from the right without reversing the array', () => {
    expect(TAB_TITLES).toEqual(['اليوم', 'الخطة', 'وصفاتي', 'ثلاجتي', 'المشتريات']);
  });

  it('still gives web an explicit RTL paragraph', () => {
    expect(paragraphTextStyle('web')).toEqual({ writingDirection: 'rtl', textAlign: 'right' });
    expect(containerDirectionStyle('web')).toEqual({ writingDirection: 'rtl' });
  });

  it('does not pin screen text to the physical right edge', () => {
    const hits = sourceFiles('app')
      .concat(sourceFiles('src/components'))
      .filter((file) => /textAlign:\s*['"]right['"]/.test(readFileSync(file, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('keeps tab screens in reading order and does not reverse the row', () => {
    const tabs = readFileSync('app/(tabs)/_layout.tsx', 'utf8');
    const names = ['name="index"', 'name="plan"', 'name="recipes"', 'name="fridge"', 'name="shopping"'];
    const positions = names.map((name) => tabs.indexOf(name));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(tabs).not.toContain('row-reverse');
    expect(tabs).not.toContain('scaleX');
  });

  it('applies RTL before React starts and does not reload or wipe storage', () => {
    const layout = readFileSync('app/_layout.tsx', 'utf8');
    expect(layout).toContain('I18nManager.forceRTL(true)');
    expect(layout).not.toContain('DevSettings');
    expect(layout).not.toContain('reload(');
    expect(layout).not.toContain('AsyncStorage');

    const sample = `package com.tabkha.app\n\nimport com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative\n\nfun onCreate() {\n    loadReactNative(this)\n}\n`;
    const once = ensureAndroidRtl(sample);
    const twice = ensureAndroidRtl(once);
    const hook = once.indexOf('I18nUtil.instance.forceRTL(this, true)');
    const start = once.indexOf('loadReactNative(this)');
    expect(hook).toBeGreaterThan(-1);
    expect(hook).toBeLessThan(start);
    expect(once).toContain('import com.facebook.react.modules.i18nmanager.I18nUtil');
    expect(twice).toBe(once);
  });
});
