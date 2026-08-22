import React from 'react';
import { Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { colors, spacing } from '../../theme';
import { useChallenges } from '../../hooks/useChallenges';
import { useAuthStore } from '../../store/authStore';
import ChallengeCard from '../../components/ChallengeCard';
import { MainTabParamList } from '../../types';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { challenges, loading } = useChallenges();
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hey{user ? `, ${user.name}` : ''}</Text>
      <Text style={styles.subtitle}>Recent activity</Text>

      {loading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onPress={() =>
                // Jumps into the Challenges tab's nested stack directly on its detail screen.
                navigation.navigate('Challenges', {
                  screen: 'ChallengeDetail',
                  params: { id: item.id },
                } as never)
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 16, marginBottom: spacing.md },
  loading: { color: colors.textMuted },
});
