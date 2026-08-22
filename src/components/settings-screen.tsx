import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SwitchToggle } from '@/components/ui/switch-toggle';
import {
  Colors,
  Radius,
  Space,
  TabBar,
  Type,
  type ThemeColors,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  clearHistory,
  getHistory,
  isQuietHoursEnabled,
  isVibrationEnabled,
  setQuietHoursEnabled,
  setVibrationEnabled,
} from '@/lib/storage';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

function PreferenceRow({
  icon,
  title,
  subtitle,
  palette,
  onPress,
  trailing,
  divider,
  destructive,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  palette: ThemeColors;
  onPress?: () => void;
  trailing?: React.ReactNode;
  divider?: boolean;
  destructive?: boolean;
}) {
  return (
    <>
      {divider ? <View style={[styles.divider, { backgroundColor: palette.border }]} /> : null}
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        android_ripple={{ color: `${palette.tint}18` }}
        accessibilityRole={onPress ? 'button' : undefined}
        style={styles.row}
      >
        <View
          style={[
            styles.icon,
            { backgroundColor: destructive ? `${palette.danger}16` : palette.primarySoft },
          ]}
        >
          <MaterialIcons
            name={icon}
            size={20}
            color={destructive ? palette.danger : palette.tint}
          />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: destructive ? palette.danger : palette.text }]}>
            {title}
          </Text>
          <Text style={[styles.rowSubtitle, { color: palette.muted }]}>{subtitle}</Text>
        </View>
        {trailing ??
          (onPress ? <MaterialIcons name="chevron-right" size={22} color={palette.muted} /> : null)}
      </Pressable>
    </>
  );
}

async function checkAndApplyUpdate(setIsCheckingUpdate: (checking: boolean) => void) {
  if (__DEV__) {
    Alert.alert('Development Mode', 'OTA updates are disabled in development mode.');
    return;
  }
  try {
    setIsCheckingUpdate(true);
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Update Downloaded! 🎉',
        'A new OTA update has been fetched. Would you like to restart the app to apply it now?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Restart Now',
            onPress: () => {
              void Updates.reloadAsync();
            },
          },
        ]
      );
    } else {
      Alert.alert('Up to Date ✨', 'You are running the latest OTA version.');
    }
  } catch (error) {
    Alert.alert('Update Check', error instanceof Error ? error.message : String(error));
  } finally {
    setIsCheckingUpdate(false);
  }
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = Colors[colorScheme];
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build = Constants.nativeBuildVersion;
  const [quietHours, setQuietHours] = useState(() => isQuietHoursEnabled());
  const [vibration, setVibration] = useState(() => isVibrationEnabled());

  const toggleQuietHours = (value: boolean) => {
    setQuietHours(value);
    setQuietHoursEnabled(value);
    Haptics.selectionAsync();
  };

  const toggleVibration = (value: boolean) => {
    setVibration(value);
    setVibrationEnabled(value);
    Haptics.selectionAsync();
  };

  const shareHistory = async () => {
    const history = getHistory();
    if (history.length === 0) {
      Alert.alert('No activity yet', 'Watched notifications will appear here after they arrive.');
      return;
    }
    const lines = history.map((item) => {
      const time = new Date(item.timestamp).toLocaleString();
      return `${time} · ${item.packageName}\n${item.title || 'Notification'}\n${item.text}`;
    });
    await Share.share({
      title: 'Notification Alarm activity',
      message: `Notification Alarm activity\n\n${lines.join('\n\n')}`,
    });
  };

  const confirmClearHistory = () => {
    Alert.alert(
      'Clear recent activity?',
      'This permanently removes notification history stored by Alertify.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const handleCheckUpdate = () => void checkAndApplyUpdate(setIsCheckingUpdate);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.intro,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <View style={[styles.introIcon, { backgroundColor: palette.primarySoft }]}>
          <MaterialIcons name="tune" size={26} color={palette.tint} />
        </View>
        <Text style={[styles.introTitle, { color: palette.text }]}>Make it yours</Text>
        <Text style={[styles.introBody, { color: palette.muted }]}>
          Control when alarms can interrupt you and how they get your attention.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.muted }]}>Over-The-Air (OTA) Updates</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <PreferenceRow
            icon="bolt"
            title="OTA Test: JS Live Update ✅"
            subtitle={
              Updates.isEmbeddedLaunch
                ? 'Running embedded Play Store binary'
                : `Active OTA Update: ${Updates.updateId ? Updates.updateId.slice(0, 8) : 'Running Latest'}`
            }
            palette={palette}
          />
          <PreferenceRow
            divider
            icon="sync"
            title={isCheckingUpdate ? 'Checking for updates...' : 'Check for OTA Update'}
            subtitle="Fetch and apply latest JS update immediately"
            palette={palette}
            onPress={isCheckingUpdate ? undefined : () => void handleCheckUpdate()}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.muted }]}>Alarm preferences</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <PreferenceRow
            icon="bedtime"
            title="Quiet hours"
            subtitle="Suppress the siren from 10 PM to 7 AM"
            palette={palette}
            trailing={
              <SwitchToggle
                value={quietHours}
                onValueChange={toggleQuietHours}
                accessibilityLabel="Quiet hours"
              />
            }
          />
          <PreferenceRow
            divider
            icon="vibration"
            title="Vibration"
            subtitle="Vibrate continuously while the alarm rings"
            palette={palette}
            trailing={
              <SwitchToggle
                value={vibration}
                onValueChange={toggleVibration}
                accessibilityLabel="Vibration"
              />
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.muted }]}>Data</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <PreferenceRow
            icon="ios-share"
            title="Share activity"
            subtitle="Export recent alerts as readable text"
            palette={palette}
            onPress={() => void shareHistory()}
          />
          <PreferenceRow
            divider
            icon="delete-outline"
            title="Clear activity"
            subtitle="Remove all locally stored alert history"
            palette={palette}
            onPress={confirmClearHistory}
            destructive
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.muted }]}>About</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <PreferenceRow
            icon="info-outline"
            title="Notification Alarm"
            subtitle={`Version ${version}${build ? ` (${build})` : ''}${
              Updates.channel ? ` · ${Updates.channel}` : ''
            }`}
            palette={palette}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
    paddingBottom: TabBar.clearance,
    gap: Space.lg,
  },
  intro: {
    padding: Space.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Space.xs,
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.sm,
  },
  introTitle: {
    ...Type.sectionTitle,
  },
  introBody: {
    ...Type.supporting,
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
  icon: {
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
});
