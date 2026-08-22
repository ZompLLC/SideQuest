import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable style={[styles.base, variant === 'secondary' && styles.secondary]} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
});
