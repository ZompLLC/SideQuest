import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing } from '../theme';
import PointsBadge from './PointsBadge';

// Used on both HomeScreen (recent activity) and ChallengesScreen (full list) —
// the trigger for pulling this out of a screen file and into components/.
export default function ChallengeCard({ challenge, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.title}>{challenge.title}</Text>
        <PointsBadge points={challenge.points} />
      </View>
      <Text style={styles.subtitle}>
        {challenge.challenger} vs {challenge.opponent}
      </Text>
      <Text style={styles.status}>{challenge.status}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  status: {
    color: colors.primary,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
