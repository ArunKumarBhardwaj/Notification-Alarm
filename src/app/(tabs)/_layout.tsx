import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <NativeTabs
      tintColor={Colors[colorScheme].tint}
      backgroundColor={Colors[colorScheme].background}
      indicatorColor={Colors[colorScheme].surfaceContainer}
      rippleColor="transparent"
    >
      <NativeTabs.Trigger name="apps">
        <NativeTabs.Trigger.Label>Apps</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="apps" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Alarm</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="alarm" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
