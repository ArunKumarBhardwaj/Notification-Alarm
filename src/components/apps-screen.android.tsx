import { Host } from '@expo/ui';
import {
  Column,
  FilterChip,
  getMaterialColors,
  Icon,
  Row,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import Apps from '@expo/material-symbols/apps.xml';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LegendList } from '@legendapp/list/react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import React, {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text as RNText,
  useWindowDimensions,
  View,
} from 'react-native';
import { SEED_COLOR } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSelectedApps, saveSelectedApps } from '@/lib/storage';
import {
  AppInfo,
  getAppIcons,
  getInstalledApps,
} from '../../modules/notification-listener';

const ROW_HEIGHT = 72;
const HEADER_SIZE = 96;
const ICON_BATCH = 96;
// Buffer roughly a screen of rows above and below the viewport. Rows are cheap
// (one cached image plus two labels), so a wide buffer beats blank space.
const DRAW_DISTANCE = ROW_HEIGHT * 14;

let cachedApps: AppInfo[] | null = null;
const iconCache = new Map<string, string>();

type Palette = {
  ripple: string;
  primary: string;
  onSurface: string;
  onSurfaceVariant: string;
  outlineVariant: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
};

function sameAppList(a: AppInfo[], b: AppInfo[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (app, i) => app.packageName === b[i].packageName && app.name === b[i].name
  );
}

// Rows are pure: icons are resolved in bulk before render, so scrolling never
// kicks off per-row state updates or native calls.
const AppRow = memo(function AppRow({
  item,
  isSelected,
  iconUri,
  palette,
  onToggle,
}: {
  item: AppInfo;
  isSelected: boolean;
  iconUri: string | undefined;
  palette: Palette;
  onToggle: (packageName: string) => void;
}) {
  const onPress = useCallback(() => onToggle(item.packageName), [onToggle, item.packageName]);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: palette.ripple }}
      style={[
        styles.row,
        {
          backgroundColor: isSelected ? palette.primaryContainer : 'transparent',
          borderBottomColor: palette.outlineVariant,
        },
      ]}
    >
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
        <View
          style={[styles.icon, styles.iconFallback, { backgroundColor: palette.outlineVariant }]}
        >
          <RNText style={[styles.iconInitial, { color: palette.onSurfaceVariant }]}>
            {item.name.charAt(0)}
          </RNText>
        </View>
      )}

      <View style={styles.rowText}>
        <RNText
          numberOfLines={1}
          style={[
            styles.appName,
            { color: isSelected ? palette.onPrimaryContainer : palette.onSurface },
          ]}
        >
          {item.name}
        </RNText>
        <RNText numberOfLines={1} style={[styles.appPackage, { color: palette.onSurfaceVariant }]}>
          {item.packageName}
        </RNText>
      </View>

      <View
        style={[
          styles.check,
          {
            backgroundColor: isSelected ? palette.primary : 'transparent',
            borderColor: isSelected ? palette.primary : palette.onSurfaceVariant,
          },
        ]}
      >
        {isSelected ? <MaterialIcons name="check" size={16} color={palette.onPrimary} /> : null}
      </View>
    </Pressable>
  );
});

function FilterBar({
  watchingOnly,
  watchedCount,
  totalCount,
  onSelectAll,
  onSelectWatching,
}: {
  watchingOnly: boolean;
  watchedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onSelectWatching: () => void;
}) {
  const colors = useMaterialColors();
  const watchingLabel =
    watchedCount > 0 ? `Watching · ${watchedCount}` : 'Watching';

  return (
    <Column
      modifiers={[fillMaxWidth(), padding(16, 4, 16, 8)]}
      verticalArrangement={{ spacedBy: 10 }}
    >
      <Text color={colors.onSurfaceVariant} style={{ typography: 'bodyMedium' }}>
        {watchedCount > 0
          ? `${watchedCount} of ${totalCount} apps will ring the alarm`
          : 'Choose the apps that should never go unnoticed'}
      </Text>
      <Row horizontalArrangement={{ spacedBy: 8 }} verticalAlignment="center">
        <FilterChip selected={!watchingOnly} onClick={onSelectAll}>
          <FilterChip.Label>
            <Text>All</Text>
          </FilterChip.Label>
        </FilterChip>
        <FilterChip selected={watchingOnly} onClick={onSelectWatching}>
          <FilterChip.Label>
            <Text>{watchingLabel}</Text>
          </FilterChip.Label>
        </FilterChip>
      </Row>
    </Column>
  );
}

const getRowSize = () => ROW_HEIGHT;

export default function AppsScreen() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { width, height } = useWindowDimensions();
  const colors = useMemo(
    () => getMaterialColors({ scheme: colorScheme, seedColor: SEED_COLOR }),
    [colorScheme]
  );
  const palette = useMemo<Palette>(
    () => ({
      ripple: `${colors.primary.slice(0, 7)}33`,
      primary: colors.primary,
      onSurface: colors.onSurface,
      onSurfaceVariant: colors.onSurfaceVariant,
      outlineVariant: colors.outlineVariant,
      primaryContainer: colors.primaryContainer,
      onPrimary: colors.onPrimary,
      onPrimaryContainer: colors.onPrimaryContainer,
    }),
    [colors]
  );

  const [apps, setApps] = useState<AppInfo[]>(cachedApps ?? []);
  const [refreshing, setRefreshing] = useState(!cachedApps);
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
    const missing = list
      .map((app) => app.packageName)
      .filter((packageName) => !iconCache.has(packageName));

    for (let i = 0; i < missing.length; i += ICON_BATCH) {
      const icons = await getAppIcons(missing.slice(i, i + ICON_BATCH));
      const added: string[] = [];
      for (const [packageName, uri] of Object.entries(icons)) {
        if (!uri) continue;
        iconCache.set(packageName, uri);
        added.push(uri);
      }
      if (!mountedRef.current) return;
      if (added.length === 0) continue;
      // Warm the decode cache so recycled rows never wait on a disk read.
      Image.prefetch(added, { cachePolicy: 'memory-disk' }).catch(() => {});
      setIconVersion((version) => version + 1);
    }
  }, []);

  const loadApps = useCallback(async () => {
    try {
      const allApps = await getInstalledApps();
      cachedApps = allApps;
      for (const app of allApps) {
        if (app.icon) iconCache.set(app.packageName, app.icon);
      }
      if (!mountedRef.current) return;
      setApps((prev) => (sameAppList(prev, allApps) ? prev : allApps));
      setSelectedPackages(new Set(getSelectedApps()));
      setIconVersion((version) => version + 1);
      hydrateIcons(allApps);
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [hydrateIcons]);

  useEffect(() => {
    if (!cachedApps) {
      loadApps();
      return;
    }
    hydrateIcons(cachedApps);
  }, [loadApps, hydrateIcons]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadApps();
  }, [loadApps]);

  const deferredSearch = useDeferredValue(search);

  const searchedApps = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return apps;
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(query) ||
        app.packageName.toLowerCase().includes(query)
    );
  }, [apps, deferredSearch]);

  // Keeping the watching filter separate means toggling an app in "All" mode
  // returns the same array reference, so the list skips a full re-layout.
  const filteredApps = useMemo(() => {
    if (!watchingOnly) return searchedApps;
    return searchedApps.filter((app) => selectedPackages.has(app.packageName));
  }, [searchedApps, watchingOnly, selectedPackages]);

  const toggleApp = useCallback((packageName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(packageName)) next.delete(packageName);
      else next.add(packageName);
      saveSelectedApps(Array.from(next));
      return next;
    });
  }, []);

  const selectedRef = useRef(selectedPackages);
  selectedRef.current = selectedPackages;

  const renderItem = useCallback(
    ({ item }: { item: AppInfo }) => (
      <AppRow
        item={item}
        isSelected={selectedRef.current.has(item.packageName)}
        iconUri={iconCache.get(item.packageName)}
        palette={palette}
        onToggle={toggleApp}
      />
    ),
    [palette, toggleApp]
  );

  const extraData = useMemo(
    () => ({ selectedPackages, iconVersion }),
    [selectedPackages, iconVersion]
  );

  const listSize = useMemo(() => ({ width, height }), [width, height]);

  const listHeader = useMemo(
    () => (
      <Host
        matchContents={{ vertical: true, horizontal: false }}
        seedColor={SEED_COLOR}
        colorScheme={colorScheme}
        style={{ width }}
      >
        <FilterBar
          watchingOnly={watchingOnly}
          watchedCount={selectedPackages.size}
          totalCount={apps.length}
          onSelectAll={() => setWatchingOnly(false)}
          onSelectWatching={() => setWatchingOnly(true)}
        />
      </Host>
    ),
    [colorScheme, width, watchingOnly, selectedPackages.size, apps.length]
  );

  const listEmpty = useMemo(
    () => (
      <Host
        matchContents={{ vertical: true, horizontal: false }}
        seedColor={SEED_COLOR}
        colorScheme={colorScheme}
        style={{ width }}
      >
        <Column
          modifiers={[fillMaxWidth(), padding(32, 48, 32, 32)]}
          horizontalAlignment="center"
          verticalArrangement={{ spacedBy: 8 }}
        >
          <Icon source={Apps} size={40} tint={colors.onSurfaceVariant} />
          <Text
            color={colors.onSurface}
            style={{ typography: 'titleMedium', textAlign: 'center' }}
          >
            {deferredSearch
              ? 'No matching apps'
              : watchingOnly
                ? 'Nothing watched yet'
                : 'No apps found'}
          </Text>
          <Text
            color={colors.onSurfaceVariant}
            style={{ typography: 'bodyMedium', textAlign: 'center' }}
          >
            {deferredSearch
              ? 'Try a different name or package.'
              : watchingOnly
                ? 'Switch to All and tap the apps that should wake you.'
                : 'Launcher apps appear here. Anything that notifies you is added automatically.'}
          </Text>
        </Column>
      </Host>
    ),
    [
      colorScheme,
      width,
      colors.onSurface,
      colors.onSurfaceVariant,
      deferredSearch,
      watchingOnly,
    ]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerTitle: 'Apps',
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.onSurface,
          headerSearchBarOptions: {
            placeholder: 'Search apps',
            onChangeText: (event) => setSearch(event.nativeEvent.text),
            onCancelButtonPress: () => setSearch(''),
            textColor: colors.onSurface,
            hintTextColor: colors.onSurfaceVariant,
            headerIconColor: colors.onSurfaceVariant,
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
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.surface}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingBottom: 40 },
  listContentEmpty: { flexGrow: 1, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    paddingHorizontal: 16,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  iconFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInitial: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  appName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  appPackage: {
    fontSize: 12,
    lineHeight: 16,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
