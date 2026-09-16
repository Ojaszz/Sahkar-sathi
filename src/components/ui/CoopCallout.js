import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

// Highlights the cooperative differentiator: fair wages + worker welfare
export default function CoopCallout({ title, note, icon = 'hand-coin', style }) {
  const styles = makeStyles(colors);
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  title: { ...typography.captionMedium, color: colors.primaryDark },
  note: { ...typography.small, color: colors.primaryDark, opacity: 0.75, lineHeight: 16 },
});