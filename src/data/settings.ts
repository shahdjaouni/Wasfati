import { defaultSettings, type Settings } from '../types';
import { clampClock } from '../core/reminder';
import { presetDays } from '../plan/plan';

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
  const weeklyGoal = Number.isInteger(goal) && goal >= 1 && goal <= 7 ? goal : 3;
  const rawDays = Array.isArray(source.planDays) ? source.planDays : [];
  const planDays = [...new Set(rawDays.map(Number))]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);
  const people = Number(source.planPeople);
  return {
    whatsappNumber: typeof source.whatsappNumber === 'string' ? source.whatsappNumber.trim() : '',
    reminderEnabled: Boolean(source.reminderEnabled),
    reminderHour: clock.hour,
    reminderMinute: clock.minute,
    aiBaseUrl: base,
    aiModel: model,
    weeklyGoal,
    planDays: planDays.length === weeklyGoal ? planDays : presetDays(weeklyGoal),
    planPeople: Number.isInteger(people) && people >= 1 && people <= 12 ? people : 4,
    planDouble: source.planDouble === true,
  };
}
