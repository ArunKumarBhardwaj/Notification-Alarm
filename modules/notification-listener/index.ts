import { useEffect, useEffectEvent } from 'react';
import NotificationListenerModule from './src/NotificationListenerModule';
import {
  AlarmStatePayload,
  NativeHistoryItem,
  NotificationReceivedPayload,
} from './src/NotificationListener.types';

export function useNotificationListener(listener: (event: NotificationReceivedPayload) => void) {
  const onNotification = useEffectEvent(listener);

  useEffect(() => {
    const subscription = NotificationListenerModule.addListener(
      'onNotificationReceived',
      onNotification
    );
    return () => {
      subscription.remove();
    };
  }, []);
}

export function useAlarmStateListener(listener: (playing: boolean) => void) {
  const onAlarmStateChanged = useEffectEvent((event: AlarmStatePayload) => {
    listener(!!event.playing);
  });

  useEffect(() => {
    const subscription = NotificationListenerModule.addListener(
      'onAlarmStateChanged',
      onAlarmStateChanged
    );
    return () => {
      subscription.remove();
    };
  }, []);
}

export function hasPermission(): boolean {
  return NotificationListenerModule.hasPermission();
}

export function requestPermission(): void {
  NotificationListenerModule.requestPermission();
}

export function canPostNotifications(): boolean {
  try {
    return NotificationListenerModule.canPostNotifications();
  } catch {
    return false;
  }
}

export function requestPostNotifications(): void {
  try {
    NotificationListenerModule.requestPostNotifications();
  } catch {
    // Native module may be unavailable during dev hot reload.
  }
}

export function isIgnoringBatteryOptimizations(): boolean {
  try {
    return NotificationListenerModule.isIgnoringBatteryOptimizations();
  } catch {
    return false;
  }
}

export function requestIgnoreBatteryOptimizations(): void {
  try {
    NotificationListenerModule.requestIgnoreBatteryOptimizations();
  } catch {
    // Native module may be unavailable during dev hot reload.
  }
}

export interface AppInfo {
  packageName: string;
  name: string;
  icon?: string;
}

export async function getInstalledApps(): Promise<AppInfo[]> {
  return NotificationListenerModule.getInstalledApps();
}

export async function getAppIcon(packageName: string): Promise<string | null> {
  try {
    const uri = await NotificationListenerModule.getAppIcon(packageName);
    return uri || null;
  } catch {
    return null;
  }
}

export async function getAppIcons(
  packageNames: string[]
): Promise<Record<string, string>> {
  if (packageNames.length === 0) return {};
  try {
    return await NotificationListenerModule.getAppIcons(packageNames);
  } catch {
    return {};
  }
}

export function syncPref(key: string, value: string): void {
  NotificationListenerModule.syncPref(key, value);
}

export function stopNativeAlarm(): void {
  NotificationListenerModule.stopNativeAlarm();
}

export function isNativeAlarmPlaying(): boolean {
  return NotificationListenerModule.isNativeAlarmPlaying();
}

export function testNativeAlarm(): void {
  NotificationListenerModule.testAlarm();
}

export function copyAlarmSound(sourceUri: string): string {
  return NotificationListenerModule.copyAlarmSound(sourceUri);
}

export function clearNativeAlarmSound(): void {
  NotificationListenerModule.clearAlarmSound();
}

export function getNativeHistory(): NativeHistoryItem[] {
  try {
    return NotificationListenerModule.getNativeHistory() ?? [];
  } catch {
    return [];
  }
}

export function seedNativeHistory(itemsJson: string): void {
  try {
    NotificationListenerModule.seedNativeHistory(itemsJson);
  } catch {
    // Ignore if native module is unavailable.
  }
}

export function clearNativeHistory(): void {
  try {
    NotificationListenerModule.clearNativeHistory();
  } catch {
    // Ignore if native module is unavailable.
  }
}

export * from './src/NotificationListener.types';
