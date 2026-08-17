import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Motion, Radius, Space, Type, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { completeOnboarding } from '@/lib/storage';

type SceneName = 'apps' | 'siren' | 'control';

const PAGES: {
  key: string;
  scene: SceneName;
  kicker: string;
  title: string;
  body: string;
}[] = [
  {
    key: 'apps',
    scene: 'apps',
    kicker: 'Step one',
    title: 'Pick the apps that matter',
    body: 'WhatsApp, Slack, the one thread that cannot slip by. Everything else stays quiet.',
  },
  {
    key: 'siren',
    scene: 'siren',
    kicker: 'Step two',
    title: 'A notification becomes a siren',
    body: 'Silent phone, app killed, screen off — a watched alert still sets off a real alarm.',
  },
  {
    key: 'control',
    scene: 'control',
    kicker: 'Step three',
    title: 'Allow access, then forget it',
    body: 'Notification access and unrestricted battery. Turn monitoring off whenever you want.',
  },
];

/** Mini app list with one row selected, echoing the Apps tab. */
function AppsScene({ palette }: { palette: ThemeColors }) {
  const rows = [0, 1, 2];
  return (
    <View style={styles.sceneStack}>
      {rows.map((row) => {
        const selected = row === 1;
        return (
          <View
            key={row}
            style={[
              styles.miniRow,
              {
                backgroundColor: selected ? `${palette.tint}2E` : `${palette.onChrome}0F`,
                borderColor: selected ? palette.tint : 'transparent',
              },
            ]}
          >
            <View style={[styles.miniIcon, { backgroundColor: `${palette.onChrome}24` }]} />
            <View style={styles.miniLines}>
              <View
                style={[
                  styles.miniBar,
                  { width: selected ? 96 : 78, backgroundColor: `${palette.onChrome}3D` },
                ]}
              />
              <View
                style={[
                  styles.miniBarSmall,
                  { width: selected ? 56 : 44, backgroundColor: `${palette.onChrome}24` },
                ]}
              />
            </View>
            <View
              style={[
                styles.miniCheck,
                {
                  backgroundColor: selected ? palette.tint : 'transparent',
                  borderColor: selected ? palette.tint : `${palette.onChrome}3D`,
                },
              ]}
            >
              {selected ? (
                <MaterialIcons name="check" size={14} color={palette.onPrimary} />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Ember rings radiating from a bell badge. */
function SirenScene({ palette }: { palette: ThemeColors }) {
  return (
    <View style={styles.sceneCenter}>
      {[
        { size: 210, alpha: '14' },
        { size: 164, alpha: '24' },
        { size: 120, alpha: '3D' },
      ].map((ring) => (
        <View
          key={ring.size}
          style={[
            styles.ring,
            {
              width: ring.size,
              height: ring.size,
              borderRadius: ring.size / 2,
              borderColor: `${palette.tint}${ring.alpha}`,
            },
          ]}
        />
      ))}
      <View style={[styles.sirenBadge, { backgroundColor: palette.tint }]}>
        <MaterialIcons name="notifications-active" size={36} color={palette.onPrimary} />
      </View>
    </View>
  );
}

/** Checklist plus a switch, mirroring the Alarm tab controls. */
function ControlScene({ palette }: { palette: ThemeColors }) {
  return (
    <View style={styles.sceneStack}>
      {['Notification access', 'Unrestricted battery'].map((label) => (
        <View key={label} style={[styles.miniRow, { backgroundColor: `${palette.onChrome}0F` }]}>
          <View style={[styles.miniCheckFilled, { backgroundColor: palette.tint }]}>
            <MaterialIcons name="check" size={14} color={palette.onPrimary} />
          </View>
          <Text numberOfLines={1} style={[styles.miniLabel, { color: palette.onChrome }]}>
            {label}
          </Text>
        </View>
      ))}
      <View
        style={[
          styles.miniRow,
          { backgroundColor: `${palette.tint}2E`, borderColor: palette.tint },
        ]}
      >
        <Text numberOfLines={1} style={[styles.miniLabel, { color: palette.onChrome }]}>
          Monitoring
        </Text>
        <View style={[styles.miniTrack, { backgroundColor: palette.tint }]}>
          <View style={[styles.miniThumb, { backgroundColor: palette.onPrimary }]} />
        </View>
      </View>
    </View>
  );
}

function Scene({ scene, palette }: { scene: SceneName; palette: ThemeColors }) {
  if (scene === 'apps') return <AppsScene palette={palette} />;
  if (scene === 'siren') return <SirenScene palette={palette} />;
  return <ControlScene palette={palette} />;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = Colors[colorScheme];
  const listRef = useRef<FlatList<(typeof PAGES)[number]>>(null);
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const reduceMotion = useReducedMotion();

  // Clamped so the card never squeezes the copy on short screens.
  const cardHeight = Math.min(Math.max(height * 0.4, 260), 340);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== page && next >= 0 && next < PAGES.length) {
      setPage(next);
    }
  };

  const finish = () => {
    completeOnboarding();
    router.replace('/apps');
  };

  const advance = () => {
    if (last) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: page + 1, animated: !reduceMotion });
  };

  return (
    <View
      style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top }]}
    >
      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item, index }) => (
          <View style={[styles.page, { width }]}>
            <Animated.View
              key={`card-${index}`}
              entering={reduceMotion ? undefined : FadeIn.duration(Motion.interaction)}
              style={[styles.card, { height: cardHeight, backgroundColor: palette.chrome }]}
            >
              {/* Decorative ember bloom behind the scene. */}
              <View style={[styles.bloom, { backgroundColor: `${palette.tint}1F` }]} />
              <Scene scene={item.scene} palette={palette} />
            </Animated.View>

            <Animated.View
              key={`copy-${index}`}
              entering={
                reduceMotion ? undefined : FadeInDown.duration(Motion.interaction).delay(60)
              }
              style={styles.copy}
            >
              <Text style={[styles.kicker, { color: palette.tint }]}>{item.kicker}</Text>
              {/* Fixed line counts keep every page the same height. */}
              <Text numberOfLines={2} style={[styles.title, { color: palette.text }]}>
                {item.title}
              </Text>
              <Text numberOfLines={3} style={[styles.body, { color: palette.muted }]}>
                {item.body}
              </Text>
            </Animated.View>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Space.lg) }]}>
        <View
          style={styles.progress}
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${page + 1} of ${PAGES.length}`}
        >
          {PAGES.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.segment,
                {
                  backgroundColor: index <= page ? palette.tint : palette.borderStrong,
                  opacity: index <= page ? 1 : 0.6,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <View style={styles.skipSlot}>
            {last ? null : (
              <Pressable
                onPress={finish}
                accessibilityRole="button"
                accessibilityLabel="Skip onboarding"
                hitSlop={8}
                style={({ pressed }) => [pressed ? styles.pressedText : null]}
              >
                <Text style={[styles.skipLabel, { color: palette.muted }]}>Skip</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={advance}
            android_ripple={{ color: `${palette.onPrimary}33` }}
            accessibilityRole="button"
            accessibilityLabel={last ? 'Get started' : 'Next'}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: palette.tint },
              pressed && !reduceMotion ? styles.ctaPressed : null,
            ]}
          >
            <Text style={[styles.ctaLabel, { color: palette.onPrimary }]}>
              {last ? 'Get started' : 'Next'}
            </Text>
            <MaterialIcons
              name={last ? 'check' : 'arrow-forward'}
              size={20}
              color={palette.onPrimary}
            />
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
    paddingHorizontal: Space.xl,
    paddingTop: Space.lg,
    gap: Space.xl,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Space.xl,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bloom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -90,
    right: -70,
  },
  sceneStack: {
    gap: Space.md,
  },
  sceneCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    height: 56,
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  miniIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
  },
  miniLines: {
    flex: 1,
    gap: 6,
  },
  miniBar: {
    height: 8,
    borderRadius: Radius.pill,
  },
  miniBarSmall: {
    height: 6,
    borderRadius: Radius.pill,
  },
  miniLabel: {
    ...Type.caption,
    flex: 1,
  },
  miniCheck: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCheckFilled: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTrack: {
    width: 40,
    height: 24,
    borderRadius: Radius.pill,
    padding: 3,
    alignItems: 'flex-end',
  },
  miniThumb: {
    width: 18,
    height: 18,
    borderRadius: Radius.pill,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  sirenBadge: {
    width: 84,
    height: 84,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: Space.sm,
  },
  kicker: {
    ...Type.kicker,
  },
  title: {
    ...Type.display,
    height: Type.display.lineHeight * 2,
  },
  body: {
    ...Type.body,
    height: Type.body.lineHeight * 3,
    maxWidth: 380,
  },
  footer: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.lg,
    gap: Space.lg,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: Radius.pill,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.lg,
  },
  skipSlot: {
    flex: 1,
    justifyContent: 'center',
  },
  skipLabel: {
    ...Type.cta,
  },
  pressedText: {
    opacity: 0.6,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    height: 56,
    minWidth: 160,
    paddingHorizontal: Space.xl,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaLabel: {
    ...Type.cta,
  },
});
