import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from '@/lib/haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  PermissionsAndroid,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Space, Type } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getCurrentPermissionStep,
  getPermissionSteps,
  getSetupStatus,
  isSetupReady,
  type SetupPermissionKey,
  type SetupStatus,
} from '@/lib/setup-checklist';
import { skipSetup } from '@/lib/storage';
import {
  requestIgnoreBatteryOptimizations,
  requestPermission,
  requestPostNotifications,
} from '../../modules/notification-listener';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const STEP_COPY: Record<
  SetupPermissionKey,
  { icon: IconName; title: string; body: string; actionLabel: string }
> = {
  notificationAccess: {
    icon: 'notifications',
    title: 'Allow notification access',
    body: 'Required to hear watched alerts, even when this app is closed.',
    actionLabel: 'Grant access',
  },
  postNotifications: {
    icon: 'notifications-active',
    title: 'Allow alarm notifications',
    body: 'Shows the dismiss notification when the siren rings.',
    actionLabel: 'Allow notifications',
  },
  batteryUnrestricted: {
    icon: 'battery-full',
    title: 'Unrestricted battery',
    body: 'Stops Android from silencing the alarm in the background.',
    actionLabel: 'Allow battery',
  },
};

export default function SetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = Colors[colorScheme];
  const [status, setStatus] = useState<SetupStatus>(() => getSetupStatus());
  const finishingRef = useRef(false);

  const refresh = useCallback(() => {
    setStatus(getSetupStatus());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });
      return () => sub.remove();
    }, [refresh])
  );

  const steps = getPermissionSteps(status);
  const currentKey = getCurrentPermissionStep(status);
  const ready = isSetupReady(status);
  const stepIndex = currentKey ? steps.indexOf(currentKey) : steps.length - 1;
  const copy = currentKey ? STEP_COPY[currentKey] : null;

  const finish = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    skipSetup();
    router.replace('/apps');
  }, [router]);

  useEffect(() => {
    if (ready) finish();
  }, [ready, finish]);

  const askPostNotifications = async () => {
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        requestPostNotifications();
      }
    } catch {
      requestPostNotifications();
    }
    refresh();
  };

  const defer = () => {
    skipSetup();
    Haptics.selectionAsync();
    router.replace('/apps');
  };

  const runCurrentStep = () => {
    if (!currentKey) return;
    Haptics.selectionAsync();
    switch (currentKey) {
      case 'notificationAccess':
        requestPermission();
        break;
      case 'postNotifications':
        void askPostNotifications();
        break;
      case 'batteryUnrestricted':
        requestIgnoreBatteryOptimizations();
        break;
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: palette.background,
          paddingTop: insets.top + Space.md,
          paddingBottom: Math.max(insets.bottom, Space.lg),
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.kicker, { color: palette.tint }]}>
          {ready
            ? 'Done'
            : `Permission ${stepIndex + 1} of ${steps.length}`}
        </Text>
        <Text style={[styles.title, { color: palette.text }]}>
          {ready ? 'You are set' : 'Allow access'}
        </Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>
          {ready
            ? 'Next, pick the apps you want to watch.'
            : 'One permission at a time so the alarm still works with the screen off.'}
        </Text>

        <View
          style={styles.progress}
          accessibilityRole="progressbar"
          accessibilityLabel={
            ready
              ? 'All permissions granted'
              : `Step ${stepIndex + 1} of ${steps.length}`
          }
        >
          {steps.map((key, index) => {
            const filled = ready || status[key] || index < stepIndex;
            return (
              <View
                key={key}
                style={[
                  styles.segment,
                  {
                    backgroundColor: filled ? palette.tint : palette.borderStrong,
                    opacity: filled ? 1 : 0.55,
                  },
                ]}
              />
            );
          })}
        </View>

        {copy && currentKey ? (
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <View style={[styles.cardIcon, { backgroundColor: palette.primarySoft }]}>
              <MaterialIcons name={copy.icon} size={32} color={palette.tint} />
            </View>
            <Text style={[styles.cardTitle, { color: palette.text }]}>
              {copy.title}
            </Text>
            <Text style={[styles.cardBody, { color: palette.muted }]}>
              {copy.body}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        {currentKey ? (
          <Pressable
            onPress={runCurrentStep}
            android_ripple={{ color: `${palette.onPrimary}22` }}
            accessibilityRole="button"
            style={[styles.primary, { backgroundColor: palette.tint }]}
          >
            <Text style={[styles.primaryLabel, { color: palette.onPrimary }]}>
              {copy?.actionLabel}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={defer}
          accessibilityRole="button"
          style={styles.secondary}
        >
          <Text style={[styles.secondaryLabel, { color: palette.muted }]}>
            Skip for now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Space.lg,
    gap: Space.md,
  },
  kicker: {
    ...Type.kicker,
  },
  title: {
    ...Type.onboardingTitle,
  },
  subtitle: {
    ...Type.body,
    marginBottom: Space.sm,
  },
  progress: {
    flexDirection: 'row',
    gap: Space.sm,
    marginBottom: Space.sm,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: Radius.pill,
  },
  card: {
    marginTop: Space.md,
    padding: Space.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Space.md,
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  cardTitle: {
    ...Type.sectionTitle,
  },
  cardBody: {
    ...Type.body,
  },
  footer: {
    paddingHorizontal: Space.lg,
    gap: Space.sm,
  },
  primary: {
    minHeight: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.lg,
  },
  primaryLabel: {
    ...Type.cta,
  },
  secondary: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    ...Type.supporting,
  },
});
