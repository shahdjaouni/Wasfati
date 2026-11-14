import type { Settings } from '../types';

export interface DailyReminder {
  hour: number;
  minute: number;
  title: string;
  body: string;
}

export function clampClock(hour: number, minute: number): { hour: number; minute: number } {
  const safeHour = Number.isFinite(hour) ? Math.min(23, Math.max(0, Math.trunc(hour))) : 18;
  const safeMinute = Number.isFinite(minute) ? Math.min(59, Math.max(0, Math.trunc(minute))) : 0;
  return { hour: safeHour, minute: safeMinute };
}

export function reminderRequest(settings: Settings): DailyReminder | null {
  if (!settings.reminderEnabled) return null;
  const clock = clampClock(settings.reminderHour, settings.reminderMinute);
  return {
    ...clock,
    title: 'طبختي',
    body: 'راجع قائمة المشتريات وأرسلها إلى السوبرماركت',
  };
}

export function formatClock(hour: number, minute: number): string {
  const clock = clampClock(hour, minute);
  return `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`;
}
