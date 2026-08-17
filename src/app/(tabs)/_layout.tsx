import Tabs from 'expo-router/js-tabs';
import React from 'react';

import { AppTabBar } from '@/components/app-tab-bar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = Colors[colorScheme];

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      {/* Redirect route: it has no icon, so the custom bar skips it. */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="apps" options={{ title: 'Apps' }} />
      <Tabs.Screen name="alarm" options={{ title: 'Alarm' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
