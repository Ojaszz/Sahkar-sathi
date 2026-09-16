import React, { forwardRef } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const Input = forwardRef(function Input(
  { label, icon, error, hint, style, inputStyle, multiline, ...rest },
  ref
) {
  const styles = makeStyles(colors);
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={[typography.captionMedium, styles.label]}>{label}</Text> : null}
      <View style={[styles.box, error && styles.boxError, multiline && styles.multiline]}>
        {icon}
        <TextInput
          ref={ref}
          style={[styles.input, inputStyle, multiline && styles.multilineInput]}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          {...rest}
        />
      </View>
      {error ? <Text style={[typography.small, styles.error]}>{error}</Text> : null}
      {hint ? <Text style={[typography.small, styles.hint]}>{hint}</Text> : null}
    </View>
  );
});

export default Input;

const makeStyles = (colors) => StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.lg },
  label: { color: colors.textSecondary },
  box: {
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
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 0, height: '100%' },
  multiline: { height: 110, alignItems: 'flex-start', paddingVertical: spacing.md },
  multilineInput: { height: 'auto', minHeight: 80, textAlignVertical: 'top', paddingTop: 0 },
  boxError: { borderColor: colors.danger },
  error: { color: colors.danger },
  hint: { color: colors.textMuted },
});