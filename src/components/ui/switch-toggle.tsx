import { Pressable, StyleSheet } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { Colors, Motion, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 26;
const TRACK_PADDING = 3;

type SwitchToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function SwitchToggle({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: SwitchToggleProps) {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  const layout = reduceMotion
    ? undefined
    : LinearTransition.duration(Motion.fast);

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.hit,
        { opacity: disabled ? 0.45 : pressed ? 0.88 : 1 },
      ]}
    >
      <Animated.View
        layout={layout}
        style={[
          styles.track,
          {
            backgroundColor: value ? palette.tint : palette.borderStrong,
          },
        ]}
      >
        <Animated.View
          layout={layout}
          style={[
            styles.thumb,
            {
              backgroundColor: value ? palette.onPrimary : palette.surface,
              alignSelf: value ? 'flex-end' : 'flex-start',
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    justifyContent: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: Radius.pill,
    padding: TRACK_PADDING,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.pill,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.16)',
  },
});
