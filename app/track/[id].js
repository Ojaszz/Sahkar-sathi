import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useBookingStore } from '../../src/store/bookingStore';
import { useTrackingStore } from '../../src/store/trackingStore';
import { getWorker } from '../../src/data/workers';
import { getService } from '../../src/data/services';
import { customerLocationFor, roadPathFor } from '../../src/utils/geo';
import TrackingCard from '../../src/components/tracking/TrackingCard';
import { t } from '../../src/i18n';

export default function TrackScreen() {
  const styles = makeStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rawId = useLocalSearchParams().id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const booking = useBookingStore((s) => (id ? s.getById(id) : null));
  const { startTracking, stopTracking } = useTrackingStore();
  const tracking = useTrackingStore((s) => (booking ? s.live[booking.id] : null));

  const worker = booking ? getWorker(booking.workerId) : null;

  // Run the live simulation while the worker is on their way (inProgress)
  useEffect(() => {
    if (booking && booking.status === 'inProgress') startTracking(booking);
    return () => stopTracking(id);
  }, [booking?.status, id]);

  const customer = useMemo(() => (booking ? customerLocationFor(booking) : null), [booking?.id]);

  // Build the road route + fit the map to it. Safe fallbacks keep the hook count
  // constant while the booking is still resolving (no conditional-hooks violation).
  const start = worker?.location || [18.5204, 73.8567]; // FC Road, Pune fallback
  const dest = customer || start;
  const route = useMemo(() => roadPathFor(start, dest), [booking?.id]);
  const region = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const p of route) {
      if (p[0] < minLat) minLat = p[0];
      if (p[0] > maxLat) maxLat = p[0];
      if (p[1] < minLng) minLng = p[1];
      if (p[1] > maxLng) maxLng = p[1];
    }
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5 + 0.006,
      longitudeDelta: (maxLng - minLng) * 1.5 + 0.006,
    };
  }, [booking?.id]);

  if (!booking || !worker || !customer) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={[typography.h2, { color: colors.text }]}>Booking not found</Text>
      </SafeAreaView>
    );
  }

  const workerPos = tracking?.workerPos || worker.location;
  const service = getService(booking.service);

  return (
    <View style={styles.container}>
      {/* Map gets a definite flex height (flex:1) — absolute fill in a flex parent is a
          common cause of a blank/white react-native-maps view. */}
      <View style={styles.mapWrap}>
        <MapView
          region={region}
          route={route}
          workerPos={workerPos}
          customer={customer}
          service={service}
          avatar={worker.avatar}
        />
      </View>

      {/* Top bar — offset below the dynamic island / notch via safe-area insets */}
      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={[typography.h3, { color: colors.white }]} numberOfLines={1}>
            {t('tracking.title')}
          </Text>
        </View>
        <View style={styles.closeBtn} />
      </View>

      <TrackingCard booking={booking} worker={worker} tracking={tracking} />
    </View>
  );
}

// Lazy import map to keep other screens light even if maps fail in some runtimes.
// NOTE: react-native-maps exports MapView as the *default* export (no named .MapView),
// so we read `.default` explicitly.
function MapView({ region, route, workerPos, customer, service, avatar }) {
  const styles = makeStyles(colors);
  const RNMaps = require('react-native-maps');
  const NativeMapView = RNMaps.default || RNMaps;
  const routeCoords = (route || []).map((p) => ({ latitude: p[0], longitude: p[1] }));
  return (
    <NativeMapView style={styles.map} initialRegion={region}>
      {/* Full road route polyline */}
      {routeCoords.length > 1 && (
        <RNMaps.Polyline
          coordinates={routeCoords}
          strokeColor={service.color}
          strokeWidth={4}
        />
      )}
      {/* Customer (destination) */}
      <RNMaps.Marker coordinate={{ latitude: customer[0], longitude: customer[1] }}>
        <View style={[styles.destMarker, { borderColor: service.color }]}>
          <MaterialCommunityIcons name="home" size={14} color={service.color} />
        </View>
      </RNMaps.Marker>
      {/* Worker (moving along route) */}
      <RNMaps.Marker
        coordinate={{ latitude: workerPos[0], longitude: workerPos[1] }}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.marker}>
          <Text style={{ fontSize: 20 }}>{avatar}</Text>
        </View>
      </RNMaps.Marker>
    </NativeMapView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: 'rgba(11, 24, 17, 0.55)',
    alignItems: 'center',
  },
  marker: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 3,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destMarker: {
    backgroundColor: colors.white,
    borderRadius: 14,
    width: 28,
    height: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
