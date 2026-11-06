export type RuntimePlatform = 'web' | 'native';

/**
 * Containers follow one direction. Native uses Yoga `direction`, which mirrors
 * a row so the first child sits on the right. Web rejects that key and reads
 * `writingDirection` instead.
 */
export function containerDirectionStyle(platform: RuntimePlatform): {
  direction?: 'rtl';
  writingDirection?: 'rtl';
} {
  if (platform === 'web') return { writingDirection: 'rtl' };
  return { direction: 'rtl' };
}

/**
 * Native text must not set `writingDirection` or `textAlign: 'right'`.
 * Android ignores `writingDirection` and chooses the paragraph from the first
 * strong character (`TextLayoutManager` uses `FIRSTSTRONG_LTR`). An explicit
 * `right` alignment is the end edge once the layout is RTL, so Arabic is drawn
 * on the left and a count such as "متوفر عندك 7 من 8" reads backwards.
 * Omitting alignment keeps the line `ALIGN_NORMAL` (the start edge).
 * Web has no left/right swap, so it still needs an explicit RTL paragraph.
 */
export function paragraphTextStyle(platform: RuntimePlatform): {
  writingDirection?: 'rtl';
  textAlign?: 'right';
} {
  if (platform === 'web') return { writingDirection: 'rtl', textAlign: 'right' };
  return {};
}

/** Same decision as Android `TextLayoutManager.getTextAlignment` for one script. */
export function androidLineAlignment(options: {
  paragraphRtl: boolean;
  scriptRtl: boolean;
  textAlign?: 'left' | 'right' | 'center';
}): 'normal' | 'opposite' | 'center' {
  const swap = options.paragraphRtl !== options.scriptRtl;
  if (options.textAlign === 'center') return 'center';
  if (options.textAlign === 'right') return swap ? 'normal' : 'opposite';
  return swap ? 'opposite' : 'normal';
}

/** Reading order from the right. Do not reverse this to "fix" RTL. */
export const TAB_TITLES = ['اليوم', 'الخطة', 'وصفاتي', 'ثلاجتي', 'المشتريات'] as const;
