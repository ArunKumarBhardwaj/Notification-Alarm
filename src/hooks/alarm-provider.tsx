import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import {
  hasPermission,
  stopNativeAlarm,
  isNativeAlarmPlaying,
  useAlarmStateListener,
} from '../../modules/notification-listener';
import { migrateHistoryIfNeeded } from '../lib/storage';

type AlarmContextValue = {
  permission: boolean;
  isRinging: boolean;
  stopSiren: () => void;
};

const AlarmContext = createContext<AlarmContextValue>({
  permission: false,
  isRinging: false,
  stopSiren: () => {},
});

const stopSiren = () => {
  try {
    stopNativeAlarm();
  } catch {
    // Native module may be unavailable during dev hot reload.
  }
};

export function AlarmProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] = useState(() => hasPermission());
  const [isRinging, setIsRinging] = useState(() => isNativeAlarmPlaying());

  useEffect(() => {
    migrateHistoryIfNeeded();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setPermission(hasPermission());
        setIsRinging(isNativeAlarmPlaying());
      }
    });

    return () => {
      appStateSub.remove();
    };
  }, []);

  useAlarmStateListener((playing) => {
    setIsRinging(playing);
  });

  return (
    <AlarmContext.Provider value={{ permission, isRinging, stopSiren }}>
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  return use(AlarmContext);
}
