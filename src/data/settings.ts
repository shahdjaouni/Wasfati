import { defaultSettings, type Settings } from '../types';
import { clampClock } from '../core/reminder';

export function sanitizeSettings(settings: Partial<Settings> | undefined): Settings {
  const source = settings ?? {};
  const clock = clampClock(Number(source.reminderHour), Number(source.reminderMinute));
  const base = typeof source.aiBaseUrl === 'string' && source.aiBaseUrl.trim()
    ? source.aiBaseUrl.trim()
    : defaultSettings().aiBaseUrl;
  const model = typeof source.aiModel === 'string' && source.aiModel.trim()
    ? source.aiModel.trim()
    : defaultSettings().aiModel;
  const goal = Number(source.weeklyGoal);
  return {
    whatsappNumber: typeof source.whatsappNumber === 'string' ? source.whatsappNumber.trim() : '',
    reminderEnabled: Boolean(source.reminderEnabled),
    reminderHour: clock.hour,
    reminderMinute: clock.minute,
    aiBaseUrl: base,
    aiModel: model,
    weeklyGoal: Number.isInteger(goal) && goal >= 1 && goal <= 7 ? goal : 3,
  };
}
