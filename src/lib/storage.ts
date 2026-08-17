import { createMMKV } from 'react-native-mmkv';
import {
  syncPref,
  copyAlarmSound,
  clearNativeAlarmSound,
  getNativeHistory,
  seedNativeHistory,
  clearNativeHistory,
} from '../../modules/notification-listener';

export const storage = createMMKV();

export const StorageKeys = {
  SELECTED_APPS: 'alertify_selected_apps',
  HISTORY: 'alertify_history',
  ALARM_SOUND_URI: 'alertify_alarm_sound_uri',
  MONITORING_ENABLED: 'alertify_monitoring_enabled',
  ONBOARDED: 'alertify_onboarded',
  QUIET_HOURS_ENABLED: 'alertify_quiet_hours_enabled',
  VIBRATION_ENABLED: 'alertify_vibration_enabled',
};

const syncToNative = (key: string, value: string) => {
  try { syncPref(key, value); } catch {}
};

export const getSelectedApps = (): string[] => {
  const data = storage.getString(StorageKeys.SELECTED_APPS);
  return data ? JSON.parse(data) : [];
};

export const saveSelectedApps = (apps: string[]) => {
  const json = JSON.stringify(apps);
  storage.set(StorageKeys.SELECTED_APPS, json);
  syncToNative('selected_apps', json);
};

export const getAlarmSoundUri = (): string | null => {
  return storage.getString(StorageKeys.ALARM_SOUND_URI) ?? null;
};

export const saveAlarmSoundUri = (uri: string | null) => {
  if (uri) {
    storage.set(StorageKeys.ALARM_SOUND_URI, uri);
    syncToNative('alarm_sound_uri', uri);
  } else {
    storage.remove(StorageKeys.ALARM_SOUND_URI);
    syncToNative('alarm_sound_uri', '');
    try {
      clearNativeAlarmSound();
    } catch {
      // Ignore if native module is unavailable.
    }
  }
};

export const saveAlarmSoundFromPicker = (pickerUri: string): string | null => {
  try {
    const storedPath = copyAlarmSound(pickerUri);
    if (!storedPath) return null;
    saveAlarmSoundUri(storedPath);
    return storedPath;
  } catch {
    return null;
  }
};

export const hasCompletedOnboarding = (): boolean => {
  return storage.getString(StorageKeys.ONBOARDED) === 'true';
};

export const completeOnboarding = () => {
  storage.set(StorageKeys.ONBOARDED, 'true');
};

export const isMonitoringEnabled = (): boolean => {
  const val = storage.getString(StorageKeys.MONITORING_ENABLED);
  return val !== 'false';
};

export const setMonitoringEnabled = (enabled: boolean) => {
  const val = enabled ? 'true' : 'false';
  storage.set(StorageKeys.MONITORING_ENABLED, val);
  syncToNative('monitoring_enabled', val);
};

export const isQuietHoursEnabled = (): boolean => {
  return storage.getString(StorageKeys.QUIET_HOURS_ENABLED) === 'true';
};

export const setQuietHoursEnabled = (enabled: boolean) => {
  const val = enabled ? 'true' : 'false';
  storage.set(StorageKeys.QUIET_HOURS_ENABLED, val);
  syncToNative('quiet_hours_enabled', val);
};

export const isVibrationEnabled = (): boolean => {
  return storage.getString(StorageKeys.VIBRATION_ENABLED) !== 'false';
};

export const setVibrationEnabled = (enabled: boolean) => {
  const val = enabled ? 'true' : 'false';
  storage.set(StorageKeys.VIBRATION_ENABLED, val);
  syncToNative('vibration_enabled', val);
};

export interface HistoryItem {
  id: string;
  title: string;
  text: string;
  packageName: string;
  timestamp: number;
}

function normalizeHistory(raw: unknown[]): HistoryItem[] {
  return raw.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? ''),
      title: String(row.title ?? ''),
      text: String(row.text ?? ''),
      packageName: String(row.packageName ?? ''),
      timestamp: Number(row.timestamp ?? 0),
    };
  });
}

export const getHistory = (): HistoryItem[] => {
  try {
    const native = getNativeHistory();
    if (Array.isArray(native) && native.length > 0) {
      return normalizeHistory(native);
    }
  } catch {
    // Fall through to MMKV for older installs.
  }

  const data = storage.getString(StorageKeys.HISTORY);
  return data ? JSON.parse(data) : [];
};

export const migrateHistoryIfNeeded = () => {
  try {
    const native = getNativeHistory();
    if (Array.isArray(native) && native.length > 0) return;
    const data = storage.getString(StorageKeys.HISTORY);
    if (data) seedNativeHistory(data);
  } catch {
    // Ignore if native module is unavailable.
  }
};

export const clearHistory = () => {
  storage.remove(StorageKeys.HISTORY);
  try {
    clearNativeHistory();
  } catch {
    // Ignore if native module is unavailable.
  }
};

