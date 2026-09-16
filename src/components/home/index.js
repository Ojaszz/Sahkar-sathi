import React from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

// Grid of service categories with icon + label
export function CategoryGrid({ categories, onSelect, activeId }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.grid}>
      {categories.map((cat) => {
        const active = cat.id === activeId;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(active ? null : cat.id)}
            style={[styles.catItem, active && styles.catActive]}
          >
            <View style={[styles.catIcon, { backgroundColor: active ? colors.primary : `${cat.color}22` }]}>
              <MaterialCommunityIcons
                name={cat.icon}
                size={22}
                color={active ? colors.white : colors.textSecondary}
              />
            </View>
            <Text numberOfLines={1} style={[typography.small, styles.catLabel, active && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SearchBar({ value, onChange, placeholder, onSubmit, autoFocus }) {
  const styles = makeStyles(colors);
  return (
    <Pressable style={styles.searchWrap} onPress={onSubmit}>
      <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  catItem: { width: '18%', alignItems: 'center', gap: 6 },
  catIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catActive: { opacity: 1 },
  catLabel: { color: colors.textSecondary, fontSize: 10, textAlign: 'center' },
  catLabelActive: { color: colors.primary, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
});