import { Host } from '@expo/ui';
import {
  Card,
  Column,
  HorizontalDivider,
  Icon,
  ListItem,
  Switch,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  clickable,
  combinedClickable,
  fillMaxWidth,
  padding,
  paddingAll,
} from '@expo/ui/jetpack-compose/modifiers';
import BatteryFull from '@expo/material-symbols/battery_full.xml';
import Campaign from '@expo/material-symbols/campaign.xml';
import ChevronRight from '@expo/material-symbols/chevron_right.xml';
import MusicNote from '@expo/material-symbols/music_note.xml';
import Notifications from '@expo/material-symbols/notifications.xml';
import NotificationsActive from '@expo/material-symbols/notifications_active.xml';
import VolumeUp from '@expo/material-symbols/volume_up.xml';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import * as Updates from 'expo-updates';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  type ImageSourcePropType,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text as RNText,
  useWindowDimensions,
  View,
} from 'react-native';
import { SEED_COLOR } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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

const needsPostPermission = Platform.OS === 'android' && Number(Platform.Version) >= 33;

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const itemColors = (container: string) => ({
  containerColor: container,
});

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  onLongPress,
  colors,
  trailing,
}: {
  icon: ImageSourcePropType;
  title: string;
  subtitle: string;
  onPress?: () => void;
  onLongPress?: () => void;
  colors: ReturnType<typeof useMaterialColors>;
  trailing?: React.ReactNode;
}) {
  const modifiers = onLongPress && onPress
    ? [combinedClickable({ onClick: onPress, onLongClick: onLongPress }, { indication: false })]
    : onPress
      ? [clickable(onPress, { indication: false })]
      : undefined;

  return (
    <ListItem
      tonalElevation={0}
      shadowElevation={0}
      colors={itemColors(colors.surfaceContainer)}
      modifiers={modifiers}
    >
      <ListItem.LeadingContent>
        <Icon source={icon} size={24} tint={colors.primary} />
      </ListItem.LeadingContent>
      <ListItem.HeadlineContent>
        <Text>{title}</Text>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <Text>{subtitle}</Text>
      </ListItem.SupportingContent>
      <ListItem.TrailingContent>
        {trailing ?? (
          <Icon source={ChevronRight} size={24} tint={colors.onSurfaceVariant} />
        )}
      </ListItem.TrailingContent>
    </ListItem>
  );
}

function EngineForm({
  permission,
  canPost,
  batteryUnrestricted,
  monitoring,
  history,
  alarmSoundUri,
  alarmSoundName,
  watchedCount,
  onToggleMonitoring,
  onGrantListener,
  onGrantPost,
  onGrantBattery,
  onPickSound,
  onClearSound,
  onTestAlarm,
}: {
  permission: boolean;
  canPost: boolean;
  batteryUnrestricted: boolean;
  monitoring: boolean;
  history: HistoryItem[];
  alarmSoundUri: string | null;
  alarmSoundName: string;
  watchedCount: number;
  onToggleMonitoring: (value: boolean) => void;
  onGrantListener: () => void;
  onGrantPost: () => void;
  onGrantBattery: () => void;
  onPickSound: () => void;
  onClearSound: () => void;
  onTestAlarm: () => void;
}) {
  const colors = useMaterialColors();

  return (
    <Column
      modifiers={[fillMaxWidth(), padding(16, 8, 16, 32)]}
      verticalArrangement={{ spacedBy: 16 }}
    >
      <Column verticalArrangement={{ spacedBy: 6 }}>
        <Text style={{ typography: 'labelLarge' }} color={colors.onSurfaceVariant}>
          Siren
        </Text>
        <Card modifiers={[fillMaxWidth()]} colors={{ containerColor: colors.surfaceContainer }}>
          <SettingsRow
            icon={Campaign}
            title="Monitoring"
            subtitle={
              monitoring
                ? watchedCount > 0
                  ? `Watching ${watchedCount} app${watchedCount === 1 ? '' : 's'}`
                  : 'On — pick apps under Apps'
                : 'Off — notifications stay quiet'
            }
            colors={colors}
            trailing={<Switch value={monitoring} onCheckedChange={onToggleMonitoring} />}
          />
        </Card>
      </Column>

      <Column verticalArrangement={{ spacedBy: 6 }}>
        <Text style={{ typography: 'labelLarge' }} color={colors.onSurfaceVariant}>
          Required access
        </Text>
        <Card modifiers={[fillMaxWidth()]} colors={{ containerColor: colors.surfaceContainer }}>
          <SettingsRow
            icon={Notifications}
            title="Notification access"
            subtitle={permission ? 'Allowed' : 'Required'}
            onPress={onGrantListener}
            colors={colors}
          />
          {needsPostPermission ? (
            <>
              <HorizontalDivider color={colors.outlineVariant} />
              <SettingsRow
                icon={NotificationsActive}
                title="Post notifications"
                subtitle={canPost ? 'Allowed' : 'Required'}
                onPress={onGrantPost}
                colors={colors}
              />
            </>
          ) : null}
          <HorizontalDivider color={colors.outlineVariant} />
          <SettingsRow
            icon={BatteryFull}
            title="Unrestricted battery"
            subtitle={batteryUnrestricted ? 'Allowed' : 'Required'}
            onPress={onGrantBattery}
            colors={colors}
          />
        </Card>
      </Column>

      <Column verticalArrangement={{ spacedBy: 6 }}>
        <Text style={{ typography: 'labelLarge' }} color={colors.onSurfaceVariant}>
          Sound
        </Text>
        <Card modifiers={[fillMaxWidth()]} colors={{ containerColor: colors.surfaceContainer }}>
          <SettingsRow
            icon={MusicNote}
            title="Alarm sound"
            subtitle={
              alarmSoundUri
                ? `${alarmSoundName} · hold to restore default`
                : 'Phone default · tap to choose a file'
            }
            onPress={onPickSound}
            onLongPress={alarmSoundUri ? onClearSound : undefined}
            colors={colors}
          />
          <HorizontalDivider color={colors.outlineVariant} />
          <SettingsRow
            icon={VolumeUp}
            title="Test alarm"
            subtitle="Ring the siren now"
            onPress={onTestAlarm}
            colors={colors}
          />
        </Card>
      </Column>

      <Column verticalArrangement={{ spacedBy: 6 }}>
        <Text style={{ typography: 'labelLarge' }} color={colors.onSurfaceVariant}>
          History
        </Text>
        <Card modifiers={[fillMaxWidth()]} colors={{ containerColor: colors.surfaceContainer }}>
          {history.length === 0 ? (
            <Text
              color={colors.onSurfaceVariant}
              style={{ typography: 'bodyMedium' }}
              modifiers={[fillMaxWidth(), paddingAll(20)]}
            >
              No alerts yet. Watched-app notifications show up here, even if this app was killed.
            </Text>
          ) : (
            history.slice(0, 20).map((item, index) => (
              <Column key={item.id}>
                {index > 0 ? <HorizontalDivider color={colors.outlineVariant} /> : null}
                <ListItem
                  tonalElevation={0}
                  shadowElevation={0}
                  colors={itemColors(colors.surfaceContainer)}
                >
                  <ListItem.OverlineContent>
                    <Text>{item.packageName.split('.').pop()}</Text>
                  </ListItem.OverlineContent>
                  <ListItem.HeadlineContent>
                    <Text maxLines={1} overflow="ellipsis">
                      {item.title || 'Notification'}
                    </Text>
                  </ListItem.HeadlineContent>
                  <ListItem.SupportingContent>
                    <Text maxLines={1} overflow="ellipsis">
                      {item.text || formatTime(item.timestamp)}
                    </Text>
                  </ListItem.SupportingContent>
                  <ListItem.TrailingContent>
                    <Text color={colors.onSurfaceVariant} style={{ typography: 'labelSmall' }}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </ListItem.TrailingContent>
                </ListItem>
              </Column>
            ))
          )}
        </Card>
      </Column>
    </Column>
  );
}

export default function EngineScreen() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { width } = useWindowDimensions();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build = Constants.nativeBuildVersion;
  const [permission, setPermission] = useState(hasPermission());
  const [canPost, setCanPost] = useState(!needsPostPermission || canPostNotifications());
  const [batteryUnrestricted, setBatteryUnrestricted] = useState(isIgnoringBatteryOptimizations());
  const [monitoring, setMonitoring] = useState(isMonitoringEnabled());
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

  const askPostNotifications = useCallback(async () => {
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
  }, [refreshStatus]);

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
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: colorScheme === 'dark' ? '#14100E' : '#FFF8F5',
        }}
      >
        <ActivityIndicator color={SEED_COLOR} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ width, alignItems: 'stretch', paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Host
        matchContents={{ vertical: true, horizontal: false }}
        seedColor={SEED_COLOR}
        colorScheme={colorScheme}
        style={{ width }}
      >
        <EngineForm
          permission={permission}
          canPost={canPost}
          batteryUnrestricted={batteryUnrestricted}
          monitoring={monitoring}
          history={history}
          alarmSoundUri={alarmSoundUri}
          alarmSoundName={alarmSoundName}
          watchedCount={watchedCount}
          onToggleMonitoring={(val) => {
            setMonitoring(val);
            setMonitoringEnabled(val);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onGrantListener={() => {
            Haptics.selectionAsync();
            requestPermission();
          }}
          onGrantPost={() => {
            Haptics.selectionAsync();
            askPostNotifications();
          }}
          onGrantBattery={() => {
            Haptics.selectionAsync();
            requestIgnoreBatteryOptimizations();
          }}
          onPickSound={async () => {
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
          onClearSound={() => {
            saveAlarmSoundUri(null);
            setAlarmSoundUri(null);
            setAlarmSoundName('Default alarm');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onTestAlarm={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            testNativeAlarm();
          }}
        />
      </Host>
      <RNText
        style={{
          marginTop: 16,
          textAlign: 'center',
          fontSize: 12,
          lineHeight: 16,
          color: colorScheme === 'dark' ? '#C9A794' : '#8B5A42',
        }}
      >
        Notification Alarm {version}
        {build ? ` (${build})` : ''}
        {Updates.channel ? ` · ${Updates.channel}` : ''}
      </RNText>
    </ScrollView>
  );
}
