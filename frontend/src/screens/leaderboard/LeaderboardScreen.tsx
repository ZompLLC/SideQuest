import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import Avatar from '../../components/Avatar';
import PointsBadge from '../../components/PointsBadge';

export default function LeaderboardScreen() {
  const { leaderboard, loading } = useLeaderboard();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      {loading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.userId}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Avatar name={item.name} size={36} />
              <Text style={styles.name}>{item.name}</Text>
              <View style={{ flex: 1 }} />
              <PointsBadge points={item.points} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', marginBottom: spacing.md },
  loading: { color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: { color: colors.textMuted, width: 28, fontWeight: '700' },
  name: { color: colors.text, fontSize: 16, marginLeft: spacing.sm },
});
