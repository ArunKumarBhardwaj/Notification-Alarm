import { Colors, Motion, Radius, Space, Type } from '@/constants/theme';
import { useAlarm } from '@/hooks/alarm-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import React, { useEffect, useState } from 'react';
import { Animated as RNAnimated, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { IconSymbol } from './ui/icon-symbol';

function AlarmIcon({ color, reduceMotion }: { color: string; reduceMotion: boolean }) {
  'use no memo';
  const [scale] = useState(() => new RNAnimated.Value(1));

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scale, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        RNAnimated.timing(scale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, scale]);

  return (
    <RNAnimated.View
      style={[
        styles.iconContainer,
        { backgroundColor: `${color}22`, transform: [{ scale }] },
      ]}
    >
      <IconSymbol name="exclamationmark.triangle.fill" size={40} color={color} />
    </RNAnimated.View>
  );
}

export function AlarmOverlay() {
  const { isRinging, stopSiren } = useAlarm();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const reduceMotion = useReducedMotion();

  if (!isRinging) return null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(Motion.interaction)}
      style={styles.overlay}
    >
      <Animated.View
        entering={reduceMotion ? undefined : SlideInUp.duration(Motion.onboarding)}
        style={[
          styles.modal,
          { backgroundColor: colors.surface, borderColor: colors.danger },
        ]}
      >
        <AlarmIcon color={colors.danger} reduceMotion={reduceMotion} />

        <Text style={[styles.title, { color: colors.text }]}>Alarm ringing</Text>
        <Text style={[styles.desc, { color: colors.muted }]}>
          A watched app sent a notification. The alarm will keep ringing until you dismiss it.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.dismissBtn,
            { backgroundColor: colors.danger },
            pressed && !reduceMotion ? styles.dismissPressed : null,
          ]}
          onPress={stopSiren}
          accessibilityRole="button"
          accessibilityLabel="Dismiss alarm"
        >
          <Text style={[styles.dismissText, { color: colors.onPrimary }]}>Dismiss alarm</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 16, 14, 0.72)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Space.xl,
  },
  modal: {
    width: '100%',
    padding: Space.xxl,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    boxShadow: '0 10px 24px rgba(43, 22, 12, 0.28)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Space.xl,
  },
  title: {
    ...Type.screenTitle,
    marginBottom: Space.md,
    textAlign: 'center',
  },
  desc: {
    ...Type.body,
    textAlign: 'center',
    marginBottom: Space.xxl,
  },
  dismissBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissPressed: {
    transform: [{ scale: 0.98 }],
  },
  dismissText: {
    ...Type.cta,
  },
});
