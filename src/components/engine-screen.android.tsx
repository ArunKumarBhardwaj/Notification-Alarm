import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SwitchToggle } from '@/components/ui/switch-toggle';
import {
  Colors,
  Motion,
  Radius,
  Space,
  TabBar,
  Type,
  type ThemeColors,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  getAlarmSoundUri,
  getHistory,
  getSelectedApps,
  HistoryItem,
  isMonitoringEnabled,
  saveAlarmSoundFromPicker,
  saveAlarmSoundUri,
  setMonitoringEnabled,
} from '@/lib/storage';
import {
  canPostNotifications,
  hasPermission,
  isIgnoringBatteryOptimizations,
  requestIgnoreBatteryOptimizations,
  requestPermission,
  requestPostNotifications,
  testNativeAlarm,
  useAlarmStateListener,
  useNotificationListener,
} from '../../modules/notification-listener';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const needsPostPermission = Platform.OS === 'android' && Number(Platform.Version) >= 33;

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Section({
  title,
  palette,
  delay,
  reduceMotion,
  children,
}: {
  title: string;
  palette: ThemeColors;
  delay: number;
  reduceMotion: boolean;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      entering={
        reduceMotion ? undefined : FadeInDown.duration(Motion.interaction).delay(delay)
      }
      style={styles.section}
    >
      <Text style={[styles.sectionTitle, { color: palette.muted }]}>{title}</Text>
      <View
        style={[
          styles.card,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  palette,
  onPress,
  onLongPress,
  trailing,
  divider,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  palette: ThemeColors;
  onPress?: () => void;
  onLongPress?: () => void;
  trailing?: React.ReactNode;
  divider?: boolean;
}) {
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: palette.primarySoft }]}>
        <MaterialIcons name={icon} size={20} color={palette.tint} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: palette.muted }]}>{subtitle}</Text>
      </View>
      {trailing ?? <MaterialIcons name="chevron-right" size={22} color={palette.muted} />}
    </>
  );

  return (
    <>
      {divider ? <View style={[styles.divider, { backgroundColor: palette.border }]} /> : null}
      {onPress ? (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          android_ripple={{ color: `${palette.tint}18` }}
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${subtitle}`}
          style={styles.row}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.row}>{content}</View>
      )}
    </>
  );
}

function StatusPill({
  label,
  tone,
  palette,
}: {
  label: string;
  tone: 'ok' | 'todo';
  palette: ThemeColors;
}) {
  const color = tone === 'ok' ? palette.success : palette.attention;
  return (
    <View style={[styles.pill, { backgroundColor: `${color}1F` }]}>
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function EngineScreen() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = Colors[colorScheme];
  const reduceMotion = useReducedMotion();
  const [permission, setPermission] = useState(() => hasPermission());
  const [canPost, setCanPost] = useState(
    () => !needsPostPermission || canPostNotifications()
  );
  const [batteryUnrestricted, setBatteryUnrestricted] = useState(
    () => isIgnoringBatteryOptimizations()
  );
  const [monitoring, setMonitoring] = useState(() => isMonitoringEnabled());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alarmSoundUri, setAlarmSoundUri] = useState<string | null>(null);
  const [alarmSoundName, setAlarmSoundName] = useState('Default alarm');
  const [watchedCount, setWatchedCount] = useState(0);

  const refreshStatus = useCallback(() => {
    setPermission(hasPermission());
    setCanPost(!needsPostPermission || canPostNotifications());
    setBatteryUnrestricted(isIgnoringBatteryOptimizations());
    setHistory(getHistory());
    setWatchedCount(getSelectedApps().length);
  }, []);

  const askPostNotifications = async () => {
    if (!needsPostPermission) return;
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
    refreshStatus();
  };

  useFocusEffect(
    useCallback(() => {
      const uri = getAlarmSoundUri();
      setAlarmSoundUri(uri);
      setAlarmSoundName(uri ? uri.split('/').pop() ?? 'Custom sound' : 'Default alarm');
      setMonitoring(isMonitoringEnabled());
      refreshStatus();
      setLoading(false);
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') refreshStatus();
      });
      return () => sub.remove();
    }, [refreshStatus])
  );

  useNotificationListener(() => setHistory(getHistory()));
  useAlarmStateListener(() => setHistory(getHistory()));

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  const setupReady = permission && canPost && batteryUnrestricted;
  const active = monitoring && setupReady;
  const statusTitle = !monitoring
    ? 'Monitoring off'
    : setupReady
      ? 'Monitoring active'
      : 'Needs setup';
  const statusBody = !monitoring
    ? 'Notifications stay quiet until you turn monitoring on.'
    : !setupReady
      ? 'Grant the access below so it can ring in the background.'
      : watchedCount > 0
        ? `Watching ${watchedCount} app${watchedCount === 1 ? '' : 's'} — the siren rings on their next alert.`
        : 'No apps picked yet — choose them on the Apps tab.';

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(Motion.interaction)}
        style={[
          styles.hero,
          {
            backgroundColor: active ? palette.chrome : palette.surface,
            borderColor: active ? palette.chrome : palette.border,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View
            style={[
              styles.heroGlyph,
              { backgroundColor: active ? palette.tint : palette.surfaceContainer },
            ]}
          >
            <MaterialIcons
              name={active ? 'notifications-active' : monitoring ? 'error-outline' : 'bedtime'}
              size={26}
              color={active ? palette.onPrimary : monitoring ? palette.attention : palette.muted}
            />
          </View>
          <SwitchToggle
            value={monitoring}
            onValueChange={(value) => {
              setMonitoring(value);
              setMonitoringEnabled(value);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            accessibilityLabel="Monitoring"
          />
        </View>
        <View style={styles.heroCopy}>
          <Text
            numberOfLines={1}
            style={[styles.heroTitle, { color: active ? palette.onChrome : palette.text }]}
          >
            {statusTitle}
          </Text>
          {/* Two lines are always reserved so toggling never resizes the card. */}
          <Text
            numberOfLines={2}
            style={[styles.heroBody, { color: active ? palette.chromeMuted : palette.muted }]}
          >
            {statusBody}
          </Text>
        </View>
      </Animated.View>

      <Section title="Setup" palette={palette} delay={40} reduceMotion={reduceMotion}>
        <SettingsRow
          icon="notifications"
          title="Notification access"
          subtitle={permission ? 'Allowed' : 'Required to read watched alerts'}
          palette={palette}
          onPress={() => {
            Haptics.selectionAsync();
            requestPermission();
          }}
          trailing={
            permission ? (
              <StatusPill label="Allowed" tone="ok" palette={palette} />
            ) : (
              <StatusPill label="Grant" tone="todo" palette={palette} />
            )
          }
        />
        {needsPostPermission ? (
          <SettingsRow
            divider
            icon="notifications-active"
            title="Post notifications"
            subtitle={canPost ? 'Allowed' : 'Required to show the alarm'}
            palette={palette}
            onPress={() => {
              Haptics.selectionAsync();
              askPostNotifications();
            }}
            trailing={
              canPost ? (
                <StatusPill label="Allowed" tone="ok" palette={palette} />
              ) : (
                <StatusPill label="Grant" tone="todo" palette={palette} />
              )
            }
          />
        ) : null}
        <SettingsRow
          divider
          icon="battery-full"
          title="Unrestricted battery"
          subtitle={
            batteryUnrestricted ? 'Allowed' : 'Required so it still rings in the background'
          }
          palette={palette}
          onPress={() => {
            Haptics.selectionAsync();
            requestIgnoreBatteryOptimizations();
          }}
          trailing={
            batteryUnrestricted ? (
              <StatusPill label="Allowed" tone="ok" palette={palette} />
            ) : (
              <StatusPill label="Grant" tone="todo" palette={palette} />
            )
          }
        />
      </Section>

      <Section title="Alarm" palette={palette} delay={80} reduceMotion={reduceMotion}>
        <SettingsRow
          icon="music-note"
          title="Alarm sound"
          subtitle={
            alarmSoundUri
              ? `${alarmSoundName} · hold to restore default`
              : 'Phone default · tap to choose a file'
          }
          palette={palette}
          onPress={async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
              });
              if (!result.canceled && result.assets.length > 0) {
                const asset = result.assets[0];
                const storedPath = saveAlarmSoundFromPicker(asset.uri);
                if (storedPath) {
                  setAlarmSoundUri(storedPath);
                  setAlarmSoundName(asset.name ?? 'Custom sound');
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }
            } catch (e) {
              console.error('Sound picker error:', e);
            }
          }}
          onLongPress={
            alarmSoundUri
              ? () => {
                  saveAlarmSoundUri(null);
                  setAlarmSoundUri(null);
                  setAlarmSoundName('Default alarm');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              : undefined
          }
        />
        <SettingsRow
          divider
          icon="volume-up"
          title="Test alarm"
          subtitle="Ring the siren now"
          palette={palette}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            testNativeAlarm();
          }}
        />
      </Section>

      <Section title="Recent activity" palette={palette} delay={120} reduceMotion={reduceMotion}>
        {history.length === 0 ? (
          <Text style={[styles.emptyHistory, { color: palette.muted }]}>
            No alerts yet. Watched-app notifications show up here, even if this app was killed.
          </Text>
        ) : (
          history.slice(0, 20).map((item, index) => (
            <View key={item.id}>
              {index > 0 ? (
                <View style={[styles.divider, { backgroundColor: palette.border }]} />
              ) : null}
              <View style={styles.historyRow}>
                <View style={styles.rowText}>
                  <Text style={[styles.historyApp, { color: palette.tint }]}>
                    {item.packageName.split('.').pop()}
                  </Text>
                  <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.text }]}>
                    {item.title || 'Notification'}
                  </Text>
                  <Text numberOfLines={1} style={[styles.rowSubtitle, { color: palette.muted }]}>
                    {item.text || formatTime(item.timestamp)}
                  </Text>
                </View>
                <Text style={[styles.historyTime, { color: palette.muted }]}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            </View>
          ))
        )}
      </Section>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center' },
  content: {
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
    paddingBottom: TabBar.clearance,
    gap: Space.lg,
  },
  hero: {
    padding: Space.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Space.xs,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.sm,
  },
  heroGlyph: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...Type.sectionTitle,
  },
  heroBody: {
    ...Type.supporting,
    height: Type.supporting.lineHeight * 2,
  },
  heroCopy: {
    gap: Space.xs,
  },
  section: {
    gap: Space.sm,
  },
  sectionTitle: {
    ...Type.kicker,
    marginLeft: Space.xs,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingHorizontal: Space.md,
    paddingVertical: Space.md,
    minHeight: 68,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  rowTitle: {
    ...Type.rowTitle,
  },
  rowSubtitle: {
    ...Type.supporting,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Space.md + 38 + Space.md,
  },
  pill: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs,
    borderRadius: Radius.pill,
  },
  pillLabel: {
    ...Type.caption,
  },
  emptyHistory: {
    ...Type.supporting,
    padding: Space.lg,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space.md,
    paddingHorizontal: Space.md,
    paddingVertical: Space.md,
  },
  historyApp: {
    ...Type.kicker,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  historyTime: {
    ...Type.caption,
  },
});
