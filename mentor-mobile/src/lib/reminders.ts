
import { Platform } from 'react-native';
import { getOccurrences } from './api';
import { parseIso, toIso } from './dates';
import { fmt } from './format';

const CHANNEL = 'reminders';
const WINDOW_DAYS = 7;
const MAX_SCHEDULED = 60;

type NotificationsModule = typeof import('expo-notifications');

let notificationsPromise: Promise<NotificationsModule | null> | null = null;

async function getNotifications(): Promise<NotificationsModule | null> {
  // Expo Go en Android no admite el uso de expo-notifications
  // en esta configuración. Evitamos cargar el módulo.
  if (Platform.OS === 'android' && process.env.EXPO_PUBLIC_USE_NATIVE_NOTIFICATIONS !== 'true') {
    return null;
  }

  if (!notificationsPromise) {
    notificationsPromise = import('expo-notifications')
      .then((module) => module)
      .catch((error) => {
        console.warn('Notificaciones no disponibles:', error);
        return null;
      });
  }

  return notificationsPromise;
}

export function configureNotifications(): void {
  void getNotifications().then((notifications) => {
    if (!notifications || typeof notifications.setNotificationHandler !== 'function') {
      return;
    }

    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const notifications = await getNotifications();
    if (!notifications) return false;

    const permission = await notifications.getPermissionsAsync();
    if (permission.granted) return true;
    if (!permission.canAskAgain) return false;

    const requested = await notifications.requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    console.warn('No se pudo solicitar permiso de notificaciones:', error);
    return false;
  }
}

function moment(date: string, time: string): Date {
  const d = parseIso(date);
  const [hours, minutes] = time.split(':').map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export async function syncReminders(): Promise<void> {
  try {
    const notifications = await getNotifications();
    if (!notifications) return;

    const permission = await notifications.getPermissionsAsync();
    if (!permission.granted) return;

    if (Platform.OS === 'android') {
      await notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Recordatorios',
        importance: notifications.AndroidImportance.HIGH,
      });
    }

    const start = new Date();
    const end = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + WINDOW_DAYS - 1,
    );

    const occurrences = await getOccurrences(toIso(start), toIso(end));
    const now = Date.now();

    const upcoming = occurrences
      .filter((o) => o.reminderTime && o.currentValue < o.targetValue)
      .map((o) => ({
        occurrence: o,
        when: moment(o.date, o.reminderTime as string),
      }))
      .filter(({ when }) => when.getTime() > now)
      .sort((a, b) => a.when.getTime() - b.when.getTime())
      .slice(0, MAX_SCHEDULED);

    await notifications.cancelAllScheduledNotificationsAsync();

    for (const { occurrence: o, when } of upcoming) {
      await notifications.scheduleNotificationAsync({
        content: {
          title: o.taskTitle,
          body: o.currentValue > 0
            ? `Te faltan ${fmt(o.targetValue - o.currentValue)} ${o.unit} para completarla.`
            : `Meta de hoy: ${fmt(o.targetValue)} ${o.unit}.`,
          data: { taskId: o.taskId },
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: CHANNEL,
        },
      });
    }
  } catch (error) {
    console.warn('No se pudieron sincronizar los recordatorios:', error);
  }
}
