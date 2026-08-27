import * as ExpoHaptics from 'expo-haptics';
import { isHapticsEnabled } from '@/lib/storage';

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

export function selectionAsync() {
  if (!isHapticsEnabled()) return Promise.resolve();
  return ExpoHaptics.selectionAsync();
}

export function impactAsync(style: ExpoHaptics.ImpactFeedbackStyle) {
  if (!isHapticsEnabled()) return Promise.resolve();
  return ExpoHaptics.impactAsync(style);
}

export function notificationAsync(type: ExpoHaptics.NotificationFeedbackType) {
  if (!isHapticsEnabled()) return Promise.resolve();
  return ExpoHaptics.notificationAsync(type);
}

/** Always plays once — used when turning haptics back on so the change is felt. */
export function selectionForcedAsync() {
  return ExpoHaptics.selectionAsync();
}
