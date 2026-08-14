import { NativeModule, requireNativeModule } from "expo";

import {
  NativeHistoryItem,
  NotificationListenerModuleEvents,
} from "./NotificationListener.types";

declare class NotificationListenerModule extends NativeModule<NotificationListenerModuleEvents> {
  hasPermission(): boolean;
  requestPermission(): void;
  canPostNotifications(): boolean;
  requestPostNotifications(): void;
  isIgnoringBatteryOptimizations(): boolean;
  requestIgnoreBatteryOptimizations(): void;
  getInstalledApps(): Promise<any[]>;
  getAppIcon(packageName: string): Promise<string>;
  getAppIcons(packageNames: string[]): Promise<Record<string, string>>;
  syncPref(key: string, value: string): void;
  stopNativeAlarm(): void;
  isNativeAlarmPlaying(): boolean;
  testAlarm(): void;
  copyAlarmSound(sourceUri: string): string;
  clearAlarmSound(): void;
  getNativeHistory(): NativeHistoryItem[];
  seedNativeHistory(itemsJson: string): void;
}

const fallback: NotificationListenerModule = {
  hasPermission: () => false,
  requestPermission: () => {},
  canPostNotifications: () => false,
  requestPostNotifications: () => {},
  isIgnoringBatteryOptimizations: () => false,
  requestIgnoreBatteryOptimizations: () => {},
  getInstalledApps: async () => [],
  getAppIcon: async () => "",
  getAppIcons: async () => ({}),
  syncPref: () => {},
  stopNativeAlarm: () => {},
  isNativeAlarmPlaying: () => false,
  testAlarm: () => {},
  copyAlarmSound: () => "",
  clearAlarmSound: () => {},
  getNativeHistory: () => [],
  seedNativeHistory: () => {},
  addListener: () => ({ remove: () => {} }),
  removeAllListeners: () => {},
} as unknown as NotificationListenerModule;

let notificationListenerModule: NotificationListenerModule;
try {
  notificationListenerModule = requireNativeModule<NotificationListenerModule>(
    "NotificationListener",
  );
} catch (e) {
  console.warn(
    "NotificationListener native module not found, using fallback implementation.",
    e,
  );
  notificationListenerModule = fallback;
}

export default notificationListenerModule;
