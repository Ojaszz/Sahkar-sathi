import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { t } from '../../i18n';
import Modal from './Modal';
import { PUNE_AREAS, randomArea } from '../../utils/puneAreas';
import { getCurrentArea } from '../../utils/geo';

// Select-style field: tapping it opens a menu of Pune areas (with pincodes).
// Shows a 🎲 button for a random area and (optionally) a 📡 button to use the
// device's GPS to auto-pick the nearest area.  `onChange(area, pincode)` is
// called with the chosen area; the pincode is derived so callers don't have to
// look it up.
export default function AreaPicker({
  label,
  value, // selected area name ('' = nothing chosen)
  onChange, // (area, pincode)
  placeholder = 'Choose area',
  showRandom = true,
  showLocation = true, // "📡 Use my current location" button
}) {
  const styles = makeStyles(colors);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const selected = PUNE_AREAS.find((a) => a.area === value);
  const ph = placeholder ?? t('bookings.chooseArea');

  const choose = (area) => {
    onChange(area.area, area.pincode);
    setOpen(false);
  };

  const pickRandom = () => {
    const area = randomArea();
    onChange(area.area, area.pincode);
    setOpen(false);
  };

  const useCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const result = await getCurrentArea();
      if (result) {
        onChange(result.area, result.pincode);
        setOpen(false);
      }
    } finally {
      setLocating(false);
    }
  };

  return (
    <>
      <View style={styles.wrap}>
        {label ? <Text style={[typography.captionMedium, styles.label]}>{label}</Text> : null}
        <View style={styles.row}>
          <Pressable style={styles.field} onPress={() => setOpen(true)}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldText, !selected && { color: colors.textMuted }]} numberOfLines={1}>
                {selected ? `${selected.area}  •  ${selected.pincode}` : ph}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textMuted} />
          </Pressable>
          {showRandom ? (
            <Pressable style={styles.dice} onPress={pickRandom}>
              <MaterialCommunityIcons name="dice-multiple" size={22} color={colors.accent} />
            </Pressable>
          ) : null}
        </View>
        {selected ? (
          <Text style={[typography.small, styles.pin]}>
            {t('bookings.pincodeNote', { pincode: selected.pincode, area: selected.area })}
          </Text>
        ) : null}
      </View>

      <Modal visible={open} onClose={() => setOpen(false)} title={t('bookings.selectArea')}>
        {showLocation ? (
          <Pressable style={styles.locBtn} onPress={useCurrentLocation}>
            {locating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.primary} />
            )}
            <Text style={[typography.captionMedium, { color: colors.primary }]}>
              {locating ? t('bookings.locating') : t('bookings.useCurrentLocation')}
            </Text>
          </Pressable>
        ) : null}
        <FlatList
          data={PUNE_AREAS}
          keyExtractor={(a) => a.area}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          renderItem={({ item }) => {
            const active = item.area === value;
            return (
              <Pressable
                style={[styles.option, active && styles.optionActive]}
                onPress={() => choose(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, active && { color: colors.primary }]}>{item.area}</Text>
                </View>
                <Text style={[typography.small, { color: colors.textMuted }]}>
                  {item.pincode}
                  {active ? '  ✓' : ''}
                </Text>
              </Pressable>
            );
          }}
        />
      </Modal>
    </>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.lg },
  label: { color: colors.textSecondary },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    gap: spacing.sm,
  },
  fieldText: { color: colors.text, fontSize: 16 },
  dice: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: { color: colors.success },
  list: { maxHeight: '65%' },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionActive: { backgroundColor: colors.infoLight, borderRadius: radius.md },
});