import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

export default function EmptyState({ icon = 'inbox-outline', title, note, action }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={42} color={colors.textMuted} />
      </View>
      <Text style={[typography.h3, styles.title]}>{title}</Text>
      {note ? <Text style={[typography.caption, styles.note]}>{note}</Text> : null}
      {action}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { textAlign: 'center' },
  note: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});