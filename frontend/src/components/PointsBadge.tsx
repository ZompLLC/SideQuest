import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

interface PointsBadgeProps {
  points: number;
}

export default function PointsBadge({ points }: PointsBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{points} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  text: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 13,
  },
});
