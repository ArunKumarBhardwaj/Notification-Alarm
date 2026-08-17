import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Space, TabBar, Type } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Also acts as the allow-list: routes without an entry (the redirect index) are
// never drawn in the bar.
const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  apps: { active: 'apps', inactive: 'apps' },
  alarm: { active: 'notifications-active', inactive: 'notifications-none' },
  settings: { active: 'settings', inactive: 'settings' },
};

const BAR_HEIGHT = TabBar.height;
const PILL_INSET = TabBar.inset;

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  'use no memo';
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [barWidth, setBarWidth] = useState(0);
  const tabs = state.routes.filter((route) => ICONS[route.name] !== undefined);
  const activeTab = Math.max(
    0,
    tabs.findIndex((route) => route.key === state.routes[state.index]?.key)
  );
  const [progress] = useState(() => new Animated.Value(activeTab));

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(activeTab);
      return;
    }
    const animation = Animated.spring(progress, {
      toValue: activeTab,
      useNativeDriver: true,
      damping: 18,
      stiffness: 190,
      mass: 0.7,
    });
    animation.start();
    return () => animation.stop();
  }, [activeTab, progress, reduceMotion]);

  const slotWidth = barWidth > 0 ? (barWidth - PILL_INSET * 2) / tabs.length : 0;
  const translateX = progress.interpolate({
    inputRange: tabs.length > 1 ? tabs.map((_, index) => index) : [0, 1],
    outputRange:
      tabs.length > 1
        ? tabs.map((_, index) => PILL_INSET + index * slotWidth)
        : [PILL_INSET, PILL_INSET],
  });

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, Space.md),
          backgroundColor: palette.background,
        },
      ]}
    >
      <View
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
        style={[styles.bar, { backgroundColor: palette.chrome }]}
      >
        {slotWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              { width: slotWidth, backgroundColor: palette.tint, transform: [{ translateX }] },
            ]}
          />
        ) : null}

        {tabs.map((route, index) => {
          const focused = index === activeTab;
          const options = descriptors[route.key]?.options;
          const label =
            typeof options?.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options?.title ?? route.name);
          const icons = ICONS[route.name];

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                Haptics.selectionAsync();
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
              }}
              style={styles.tab}
            >
              <MaterialIcons
                name={focused ? icons.active : icons.inactive}
                size={22}
                color={focused ? palette.onPrimary : palette.chromeMuted}
              />
              <Text
                numberOfLines={1}
                style={[styles.label, { color: focused ? palette.onPrimary : palette.chromeMuted }]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT,
    borderRadius: Radius.pill,
    paddingHorizontal: PILL_INSET,
    overflow: 'hidden',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.18)',
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: PILL_INSET,
    bottom: PILL_INSET,
    borderRadius: Radius.pill,
  },
  tab: {
    flex: 1,
    height: BAR_HEIGHT - PILL_INSET * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    ...Type.tabLabel,
  },
});
