import { getMaterialColors } from '@expo/ui/jetpack-compose';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SEED_COLOR } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { completeOnboarding } from '@/lib/storage';

const PAGES = [
  {
    icon: 'campaign' as const,
    kicker: 'The pager',
    title: 'It rings\nuntil you hear it.',
    body: 'Silent phone. App killed. A watched notification still sets off a real alarm.',
  },
  {
    icon: 'apps' as const,
    kicker: 'Your list',
    title: 'Only the apps\nyou choose.',
    body: 'WhatsApp, Slack, the one thread that can’t slip by. Everything else stays quiet.',
  },
  {
    icon: 'verified-user' as const,
    kicker: 'Once',
    title: 'Allow access.\nThen forget it.',
    body: 'Notification listener and unrestricted battery. That’s the whole setup.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = useMemo(
    () => getMaterialColors({ scheme: colorScheme, seedColor: SEED_COLOR }),
    [colorScheme]
  );
  const listRef = useRef<FlatList<(typeof PAGES)[number]>>(null);
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next !== page && next >= 0 && next < PAGES.length) {
        setPage(next);
      }
    },
    [page, width]
  );

  const advance = useCallback(() => {
    if (last) {
      completeOnboarding();
      router.replace('/apps');
      return;
    }
    listRef.current?.scrollToIndex({ index: page + 1, animated: true });
  }, [last, page, router]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(item) => item.kicker}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <View style={[styles.page, { width, minHeight: height * 0.62 }]}>
            <View style={styles.heroWrap}>
              <View
                style={[
                  styles.halo,
                  { backgroundColor: colors.primaryContainer, opacity: 0.55 },
                ]}
              />
              <View style={[styles.orb, { backgroundColor: colors.primary }]}>
                <MaterialIcons name={item.icon} size={52} color={colors.onPrimary} />
              </View>
            </View>

            <Animated.View
              key={index}
              entering={FadeInDown.duration(420).delay(40)}
              style={styles.copy}
            >
              <Text style={[styles.kicker, { color: colors.primary }]}>{item.kicker}</Text>
              <Text style={[styles.title, { color: colors.onBackground }]}>{item.title}</Text>
              <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>{item.body}</Text>
            </Animated.View>
          </View>
        )}
      />

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 20), paddingHorizontal: 24 },
        ]}
      >
        <View style={styles.dots}>
          {PAGES.map((item, index) => (
            <View
              key={item.kicker}
              style={[
                styles.dot,
                {
                  width: index === page ? 28 : 8,
                  backgroundColor: index === page ? colors.primary : colors.outlineVariant,
                },
              ]}
            />
          ))}
        </View>

        <View style={[styles.cta, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={advance}
            android_ripple={{ color: `${colors.onPrimary}33` }}
            style={styles.ctaPressable}
          >
            <Text style={[styles.ctaLabel, { color: colors.onPrimary }]}>
              {last ? 'Get started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  heroWrap: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  halo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  orb: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 12,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400',
    maxWidth: 340,
  },
  footer: {
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  cta: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  ctaPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
