import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

export default function SectionHeader({ title, subtitle, action, onAction, style }) {
  const styles = makeStyles(colors);
  return (
    <View style={[styles.row, style]}>
      <View style={styles.textWrap}>
        <Text style={[typography.h3, styles.title]}>{title}</Text>
        {subtitle ? <Text style={typography.caption}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={onAction} style={styles.action} hitSlop={8}>
          <Text style={[typography.captionMedium, { color: colors.accent }]}>{action}</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { color: colors.text },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
});