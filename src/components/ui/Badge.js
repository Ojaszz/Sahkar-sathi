import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export default function Badge({ label, color = colors.primary, variant = 'soft', icon, style }) {
  const styles = makeStyles(colors);
  const bg = variant === 'solid' ? color : `${color}18`;
  const fg = variant === 'solid' ? colors.white : color;
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {icon}
      <Text style={[typography.smallBold, { color: fg }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.round,
    gap: 4,
  },
});