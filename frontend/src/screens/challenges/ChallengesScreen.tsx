import React from 'react';
import { Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme';
import { useChallenges } from '../../hooks/useChallenges';
import ChallengeCard from '../../components/ChallengeCard';
import Button from '../../components/Button';
import { ChallengesStackParamList } from '../../types';

type Props = NativeStackScreenProps<ChallengesStackParamList, 'ChallengesList'>;

export default function ChallengesScreen({ navigation }: Props) {
  const { challenges, loading } = useChallenges();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Challenges</Text>
      <Button title="+ New Challenge" onPress={() => navigation.navigate('CreateChallenge')} />
      {loading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : (
        <FlatList
          style={{ marginTop: spacing.md }}
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onPress={() => navigation.navigate('ChallengeDetail', { id: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', marginBottom: spacing.md },
  loading: { color: colors.textMuted, marginTop: spacing.md },
});
