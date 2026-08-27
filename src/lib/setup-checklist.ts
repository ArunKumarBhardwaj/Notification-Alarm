import { Platform } from 'react-native';
import {
  canPostNotifications,
  hasPermission,
  isIgnoringBatteryOptimizations,
} from '../../modules/notification-listener';
import { hasCompletedOnboarding, hasSkippedSetup } from '@/lib/storage';

const needsPostPermission =
  Platform.OS === 'android' && Number(Platform.Version) >= 33;

export type SetupPermissionKey =
  | 'notificationAccess'
  | 'postNotifications'
  | 'batteryUnrestricted';

export type SetupStatus = {
  notificationAccess: boolean;
  postNotifications: boolean;
  batteryUnrestricted: boolean;
  needsPostPermission: boolean;
};

export function getSetupStatus(): SetupStatus {
  return {
    notificationAccess: hasPermission(),
    postNotifications: !needsPostPermission || canPostNotifications(),
    batteryUnrestricted: isIgnoringBatteryOptimizations(),
    needsPostPermission,
  };
}

/** All required system permissions granted. */
export function isSetupReady(status: SetupStatus = getSetupStatus()): boolean {
  return (
    status.notificationAccess &&
    status.postNotifications &&
    status.batteryUnrestricted
  );
}

export function getPermissionSteps(
  status: SetupStatus = getSetupStatus()
): SetupPermissionKey[] {
  const steps: SetupPermissionKey[] = ['notificationAccess'];
  if (status.needsPostPermission) steps.push('postNotifications');
  steps.push('batteryUnrestricted');
  return steps;
}

/** First incomplete permission step, or null when all are done. */
export function getCurrentPermissionStep(
  status: SetupStatus = getSetupStatus()
): SetupPermissionKey | null {
  for (const key of getPermissionSteps(status)) {
    if (!status[key]) return key;
  }
  return null;
}

/** Full-screen checklist after onboarding until ready or skipped. */
export function shouldShowSetupScreen(): boolean {
  if (!hasCompletedOnboarding()) return false;
  if (hasSkippedSetup()) return false;
  if (isSetupReady()) return false;
  return true;
}
