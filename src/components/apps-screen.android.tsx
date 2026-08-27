import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LegendList } from '@legendapp/list/react-native';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Colors,
  Radius,
  Space,
  TabBar,
  Type,
  type ThemeColors,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from '@/lib/haptics';
import { getSelectedApps, saveSelectedApps } from '@/lib/storage';
import {
  AppInfo,
  getAppIcons,
  getInstalledApps,
} from '../../modules/notification-listener';

const CARD_HEIGHT = 68;
const ROW_HEIGHT = CARD_HEIGHT + Space.sm;
const HEADER_SIZE = 208;
// Buffer roughly a screen of rows above and below the viewport. Rows are cheap
// (one cached image plus two labels), so a wide buffer beats blank space.
const DRAW_DISTANCE = ROW_HEIGHT * 14;

let cachedApps: AppInfo[] | null = null;
const iconCache = new Map<string, string>();

function sameAppList(a: AppInfo[], b: AppInfo[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (app, i) => app.packageName === b[i].packageName && app.name === b[i].name
  );
}

// Rows are pure: icons are resolved in bulk before render, so scrolling never
// kicks off per-row state updates or native calls.
function AppRow({
  item,
  isSelected,
  iconUri,
  palette,
  onToggle,
}: {
  item: AppInfo;
  isSelected: boolean;
  iconUri: string | undefined;
  palette: ThemeColors;
  onToggle: (packageName: string) => void;
}) {
  return (
    <View style={styles.rowSlot}>
      <Pressable
        onPress={() => onToggle(item.packageName)}
        android_ripple={{ color: `${palette.tint}22`, borderless: false }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${item.name}${isSelected ? ', watched' : ''}`}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isSelected ? palette.primarySoft : palette.surface,
            borderColor: isSelected ? palette.tint : palette.border,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: palette.surfaceContainer }]}>
          {iconUri ? (
            <Image
              source={{ uri: iconUri }}
              style={styles.icon}
              recyclingKey={item.packageName}
              cachePolicy="memory-disk"
              transition={0}
              contentFit="contain"
            />
          ) : (
            <Text style={[styles.iconInitial, { color: palette.muted }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.rowText}>
          <Text numberOfLines={1} style={[styles.appName, { color: palette.text }]}>
            {item.name}
          </Text>
          <Text numberOfLines={1} style={[styles.appPackage, { color: palette.muted }]}>
            {isSelected ? 'Rings the alarm' : item.packageName}
          </Text>
        </View>

        <View
          style={[
            styles.check,
            {
              backgroundColor: isSelected ? palette.tint : 'transparent',
              borderColor: isSelected ? palette.tint : palette.borderStrong,
            },
          ]}
        >
          {isSelected ? (
            <MaterialIcons name="check" size={16} color={palette.onPrimary} />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

function ListHeader({
  palette,
  watchedCount,
  totalCount,
  watchingOnly,
  onSelectAll,
  onSelectWatching,
}: {
  palette: ThemeColors;
  watchedCount: number;
  totalCount: number;
  watchingOnly: boolean;
  onSelectAll: () => void;
  onSelectWatching: () => void;
}) {
  const active = watchedCount > 0;

  return (
    <View style={styles.header}>
      <View
        style={[
          styles.summary,
          {
            backgroundColor: active ? palette.chrome : palette.surface,
            borderColor: active ? palette.chrome : palette.border,
          },
        ]}
      >
        <View style={styles.summaryText}>
          <Text
            style={[styles.kicker, { color: active ? palette.tint : palette.muted }]}
          >
            {active ? 'On watch' : 'Not watching'}
          </Text>
          <Text
            style={[styles.metric, { color: active ? palette.onChrome : palette.text }]}
          >
            {watchedCount}
          </Text>
          <Text
            style={[
              styles.summaryCaption,
              { color: active ? palette.chromeMuted : palette.muted },
            ]}
          >
            {active
              ? `of ${totalCount} apps can ring the alarm`
              : 'Tap an app below to make it ring'}
          </Text>
        </View>
        <View
          style={[
            styles.summaryGlyph,
            { backgroundColor: active ? palette.tint : palette.surfaceContainer },
          ]}
        >
          <MaterialIcons
            name={active ? 'notifications-active' : 'notifications-off'}
            size={26}
            color={active ? palette.onPrimary : palette.muted}
          />
        </View>
      </View>

      <View style={[styles.segment, { backgroundColor: palette.surfaceContainer }]}>
        {[
          { key: 'all', label: 'All apps', selected: !watchingOnly, onPress: onSelectAll },
          {
            key: 'watching',
            label: active ? `Watching · ${watchedCount}` : 'Watching',
            selected: watchingOnly,
            onPress: onSelectWatching,
          },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={tab.onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: tab.selected }}
            style={[
              styles.segmentItem,
              tab.selected ? { backgroundColor: palette.surface } : null,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.segmentLabel,
                { color: tab.selected ? palette.text : palette.muted },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const getRowSize = () => ROW_HEIGHT;

export default function AppsScreen() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { width, height } = useWindowDimensions();
  const palette = Colors[colorScheme];

  const [apps, setApps] = useState<AppInfo[]>(cachedApps ?? []);
  const [isInitialLoading, setIsInitialLoading] = useState(() => !cachedApps);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [watchingOnly, setWatchingOnly] = useState(false);
  const [iconVersion, setIconVersion] = useState(0);
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(
    () => new Set(getSelectedApps())
  );

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hydrateIcons = useCallback(async (list: AppInfo[]) => {
    const missing: string[] = [];
    for (const app of list) {
      if (!iconCache.has(app.packageName)) missing.push(app.packageName);
    }

    if (missing.length === 0) return;
    const icons = await getAppIcons(missing);
    const added: string[] = [];
    for (const [packageName, uri] of Object.entries(icons)) {
      if (!uri) continue;
      iconCache.set(packageName, uri);
      added.push(uri);
    }
    if (!mountedRef.current || added.length === 0) return;
    // Warm the decode cache so recycled rows never wait on a disk read.
    Image.prefetch(added, { cachePolicy: 'memory-disk' }).catch(() => {});
    setIconVersion((version) => version + 1);
  }, []);

  const loadApps = useCallback(async (isManualRefresh = false) => {
    const allApps = await getInstalledApps().catch(() => null);
    if (!allApps) {
      if (mountedRef.current) {
        setIsRefreshing(false);
        setIsInitialLoading(false);
      }
      return;
    }

    cachedApps = allApps;
    for (const app of allApps) {
      if (app.icon) iconCache.set(app.packageName, app.icon);
    }
    if (!mountedRef.current) return;
    setApps((prev) => (sameAppList(prev, allApps) ? prev : allApps));
    setSelectedPackages(new Set(getSelectedApps()));
    setIconVersion((version) => version + 1);
    void hydrateIcons(allApps);
    setIsRefreshing(false);
    setIsInitialLoading(false);
    if (isManualRefresh) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [hydrateIcons]);

  useEffect(() => {
    const appsToHydrate = cachedApps;
    if (!appsToHydrate) {
      void loadApps(false);
      return;
    }
    const hydrateCachedIcons = async () => {
      await hydrateIcons(appsToHydrate);
    };
    void hydrateCachedIcons();
  }, [loadApps, hydrateIcons]);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    void loadApps(true);
  };

  const deferredSearch = useDeferredValue(search);

  const searchedApps = (() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return apps;
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(query) ||
        app.packageName.toLowerCase().includes(query)
    );
  })();

  // Keeping the watching filter separate means toggling an app in "All" mode
  // returns the same array reference, so the list skips a full re-layout.
  const filteredApps = watchingOnly
    ? searchedApps.filter((app) => selectedPackages.has(app.packageName))
    : searchedApps;

  const toggleApp = (packageName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set(selectedPackages);
    if (next.has(packageName)) next.delete(packageName);
    else next.add(packageName);
    saveSelectedApps(Array.from(next));
    setSelectedPackages(next);
  };

  const renderItem = ({ item }: { item: AppInfo }) => (
    <AppRow
      item={item}
      isSelected={selectedPackages.has(item.packageName)}
      iconUri={iconCache.get(item.packageName)}
      palette={palette}
      onToggle={toggleApp}
    />
  );

  // `palette` is part of extraData because recycled rows only re-render when
  // data or extraData changes; without it they keep the previous scheme's text
  // colors after a light/dark switch.
  const extraData = { selectedPackages, iconVersion, palette };

  const listSize = { width, height };

  const isLoading = isInitialLoading && apps.length === 0;

  const emptyTitle = isLoading
    ? 'Loading apps'
    : deferredSearch
      ? 'No matching apps'
      : watchingOnly
        ? 'Nothing watched yet'
        : 'No apps found';
  const emptyBody = isLoading
    ? 'Installed apps will appear here in a moment.'
    : deferredSearch
      ? 'Try a different name or package.'
      : watchingOnly
        ? 'Switch to All apps and tap the ones that should wake you.'
        : 'Launcher apps appear here. Anything that notifies you is added automatically.';

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Screen
        options={{
          headerTitle: 'Apps',
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text,
          headerSearchBarOptions: {
            placeholder: 'Search apps',
            onChangeText: (event) => setSearch(event.nativeEvent.text),
            onCancelButtonPress: () => setSearch(''),
            textColor: palette.text,
            hintTextColor: palette.muted,
            headerIconColor: palette.muted,
          },
        }}
      />

      <LegendList
        data={filteredApps}
        keyExtractor={(item) => item.packageName}
        renderItem={renderItem}
        estimatedItemSize={ROW_HEIGHT}
        getFixedItemSize={getRowSize}
        estimatedHeaderSize={HEADER_SIZE}
        estimatedListSize={listSize}
        extraData={extraData}
        recycleItems
        drawDistance={DRAW_DISTANCE}
        contentContainerStyle={
          filteredApps.length === 0 ? styles.listContentEmpty : styles.listContent
        }
        ListHeaderComponent={
          <ListHeader
            palette={palette}
            watchedCount={selectedPackages.size}
            totalCount={apps.length}
            watchingOnly={watchingOnly}
            onSelectAll={() => setWatchingOnly(false)}
            onSelectWatching={() => setWatchingOnly(true)}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading ? (
              <View style={[styles.emptyGlyph, { backgroundColor: palette.primarySoft }]}>
                <ActivityIndicator size="small" color={palette.tint} />
              </View>
            ) : (
              <View style={[styles.emptyGlyph, { backgroundColor: palette.surfaceContainer }]}>
                <MaterialIcons
                  name={deferredSearch ? 'search-off' : watchingOnly ? 'notifications-off' : 'apps'}
                  size={28}
                  color={palette.muted}
                />
              </View>
            )}
            <Text style={[styles.emptyTitle, { color: palette.text }]}>{emptyTitle}</Text>
            <Text style={[styles.emptyBody, { color: palette.muted }]}>{emptyBody}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[palette.tint, palette.chrome, palette.primarySoft, palette.attention]}
            tintColor={palette.tint}
            progressBackgroundColor={palette.surface}
            progressViewOffset={Space.md}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingBottom: TabBar.clearance },
  listContentEmpty: { flexGrow: 1, paddingBottom: TabBar.clearance },
  header: {
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
    paddingBottom: Space.md,
    gap: Space.md,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Space.lg,
    padding: Space.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  kicker: {
    ...Type.kicker,
  },
  metric: {
    ...Type.metric,
  },
  summaryCaption: {
    ...Type.supporting,
  },
  summaryGlyph: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.pill,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.md,
  },
  segmentLabel: {
    ...Type.caption,
    fontSize: 13,
  },
  rowSlot: {
    height: ROW_HEIGHT,
    paddingHorizontal: Space.lg,
    paddingBottom: Space.sm,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingHorizontal: Space.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    width: 30,
    height: 30,
  },
  iconInitial: {
    ...Type.rowTitle,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  appName: {
    ...Type.rowTitle,
  },
  appPackage: {
    ...Type.caption,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.xl,
    gap: Space.sm,
  },
  emptyGlyph: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  emptyTitle: {
    ...Type.sectionTitle,
    textAlign: 'center',
  },
  emptyBody: {
    ...Type.supporting,
    textAlign: 'center',
  },
});
