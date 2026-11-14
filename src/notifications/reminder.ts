import { Platform } from 'react-native';
import type { Settings } from '../types';
import { reminderRequest } from '../core/reminder';

export async function syncShoppingReminder(settings: Settings): Promise<{ ok: boolean; reason?: string }> {
  const request = reminderRequest(settings);

  if (Platform.OS === 'web') {
    return { ok: !request, reason: request ? 'web' : undefined };
  }

  let Notifications: typeof import('expo-notifications');
  try {
    Notifications = await import('expo-notifications');
  } catch {
    return { ok: false, reason: 'unsupported' };
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.kind === 'shopping-reminder')
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );

  if (!request) return { ok: true };

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') return { ok: false, reason: 'denied' };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: request.title,
      body: request.body,
      data: { kind: 'shopping-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: request.hour,
      minute: request.minute,
    },
  });

  return { ok: true };
}
