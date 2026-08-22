import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { getChallengeById } from '../../api/challenges';
import PointsBadge from '../../components/PointsBadge';

export default function ChallengeDetailScreen({ route }) {
  const { id } = route.params;
  const [challenge, setChallenge] = useState(null);

  useEffect(() => {
    getChallengeById(id).then(setChallenge);
  }, [id]);

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.title}>{challenge.title}</Text>
        <PointsBadge points={challenge.points} />
      </View>
      <Text style={styles.detail}>
        {challenge.challenger} vs {challenge.opponent}
      </Text>
      <Text style={styles.status}>Status: {challenge.status}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  detail: { color: colors.textMuted, fontSize: 16, marginTop: spacing.sm },
  status: { color: colors.primary, fontSize: 14, marginTop: spacing.sm, textTransform: 'uppercase' },
  loading: { color: colors.textMuted },
});
