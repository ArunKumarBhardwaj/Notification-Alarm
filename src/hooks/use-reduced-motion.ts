import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

let current = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

void AccessibilityInfo.isReduceMotionEnabled()
  .then((value) => {
    if (current === value) return;
    current = value;
    emit();
  })
  .catch(() => {});

AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
  current = value;
  emit();
});

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => current, () => false);
}
