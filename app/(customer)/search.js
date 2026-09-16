import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../src/components/ui';
import { WorkerCard } from '../../src/components/worker';
import { SearchBar } from '../../src/components/home';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useWorkerStore } from '../../src/store/workerStore';
import { t } from '../../src/i18n';
import { USER_LOCATION } from '../../src/utils/constants';

export default function SearchScreen() {
  const styles = makeStyles(colors);
  const router = useRouter();
  const [view, setView] = useState('list'); // list | map
  const query = useWorkerStore((s) => s.query);
  const activeCategory = useWorkerStore((s) => s.activeCategory);
  const sortBy = useWorkerStore((s) => s.sortBy);
  const minRating = useWorkerStore((s) => s.minRating);
  const onlyAvailable = useWorkerStore((s) => s.onlyAvailable);
  const { setQuery, setSortBy, setMinRating, setOnlyAvailable, clearFilters, visibleWorkers } = useWorkerStore();

  const results = useMemo(() => visibleWorkers(), [query, activeCategory, sortBy, minRating, onlyAvailable]);

  const SORTS = [
    { key: 'rating', label: t('search.sortRating') },
    { key: 'distance', label: t('search.sortDistance') },
    { key: 'price', label: t('search.sortPrice') },
  ];

  const activeFilterCount =
    (minRating > 0 ? 1 : 0) + (onlyAvailable ? 1 : 0) + (activeCategory ? 1 : 0) + (query ? 1 : 0);

  return (
    <Screen scroll={false}>
      <View style={styles.topBar}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={t('home.searchPlaceholder')}
          autoFocus={false}
          style={styles.searchWrap}
        />
        <Pressable
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => {
            // cycle min rating: 0 → 4.0 → 4.5 → 0
            const next = minRating === 0 ? 4.0 : minRating === 4.0 ? 4.5 : 0;
            setMinRating(next);
          }}
        >
          <MaterialCommunityIcons name="star-circle" size={22} color={colors.primary} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterCount}><Text style={styles.filterCountText}>{activeFilterCount}</Text></View>
          ) : null}
        </Pressable>
      </View>

      {/* Sort chips */}
      <View style={styles.chipRow}>
        {SORTS.map((s) => (
          <Chip key={s.key} active={sortBy === s.key} label={s.label} onPress={() => setSortBy(s.key)} />
        ))}
        <Chip
          active={onlyAvailable}
          label={t('home.availableNow')}
          onPress={() => setOnlyAvailable(!onlyAvailable)}
        />
      </View>

      {/* View toggle + result count */}
      <View style={styles.viewRow}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('search.results', { count: results.length })}
        </Text>
        <View style={styles.viewToggle}>
          <ToggleBtn icon="format-list-bulleted" label={t('search.list')} active={view === 'list'} onPress={() => setView('list')} />
          <ToggleBtn icon="map" label={t('search.map')} active={view === 'map'} onPress={() => setView('map')} />
        </View>
      </View>

      {results.length === 0 ? (
        <EmptyHint />
      ) : view === 'list' ? (
        <FlatList
          data={results}
          keyExtractor={(w) => w.id}
          renderItem={({ item }) => <WorkerCard worker={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      ) : (
        <MapView workers={results} onSelect={(w) => router.push(`/worker/${w.id}`)} />
      )}
    </Screen>
  );
}

function Chip({ label, active, onPress }) {
  const styles = makeStyles(colors);
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[typography.captionMedium, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

function ToggleBtn({ icon, label, active, onPress }) {
  const styles = makeStyles(colors);
  return (
    <Pressable style={[styles.toggleBtn, active && styles.toggleActive]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={15} color={active ? colors.primary : colors.textSecondary} />
      <Text style={[typography.small, { color: active ? colors.primary : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

// Lazy import map to keep other screens light even if maps fail in some runtimes.
// NOTE: react-native-maps exports MapView as the *default* export (no named .MapView),
// so we read `.default` explicitly.
function MapView({ workers, onSelect }) {
  const styles = makeStyles(colors);
  const RNMaps = require('react-native-maps');
  const NativeMapView = RNMaps.default || RNMaps;
  return (
    <NativeMapView
      style={styles.map}
      initialRegion={{
        latitude: USER_LOCATION[0],
        longitude: USER_LOCATION[1],
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }}
    >
      {workers.map((w) => (
        <RNMaps.Marker
          key={w.id}
          coordinate={{ latitude: w.location[0], longitude: w.location[1] }}
          onPress={() => onSelect(w)}
        >
          <View style={styles.marker}>
            <Text style={{ fontSize: 18 }}>{w.avatar}</Text>
          </View>
        </RNMaps.Marker>
      ))}
    </NativeMapView>
  );
}

function EmptyHint() {
  const styles = makeStyles(colors);
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons name="magnify-close" size={44} color={colors.textMuted} />
      <Text style={[typography.h3, { color: colors.text }]}>{t('search.noResults')}</Text>
      <Text style={[typography.caption, { color: colors.textMuted }]}>Try a different search or clear your filters.</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  topBar: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  searchWrap: { flex: 1 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  filterCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewToggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  toggleActive: { backgroundColor: colors.primaryLight },
  map: { flex: 1, borderRadius: radius.lg },
  marker: { backgroundColor: colors.white, borderRadius: 16, padding: 2, borderWidth: 2, borderColor: colors.primary },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl * 2, gap: spacing.sm },
});