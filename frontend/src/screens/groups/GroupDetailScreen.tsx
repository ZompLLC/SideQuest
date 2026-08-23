import React, { useEffect, useState } from "react";
import { Text, View, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../theme";
import { getGroupById } from "../../api/groups";
import { getChallengesByGroup } from "../../api/challenges";
import ChallengeCard from "../../components/ChallengeCard";
import { GroupsStackParamList, Group, Challenge } from "../../types";

type Props = NativeStackScreenProps<GroupsStackParamList, "GroupDetail">;

export default function GroupDetailScreen({ route, navigation }: Props) {
  const { id, openChallengeId } = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getGroupById(id), getChallengesByGroup(id)])
      .then(([groupData, challengeData]) => {
        if (!mounted) return;
        setGroup(groupData);
        setChallenges(challengeData);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  // If we arrived here on the way to a specific challenge (e.g. tapped
  // straight from Home), push into it so back returns here.
  useEffect(() => {
    if (openChallengeId) {
      navigation.navigate("ChallengeDetail", { id: openChallengeId });
    }
  }, [openChallengeId, navigation]);

  if (loading || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{group.name}</Text>
        <Text style={styles.meta}>
          {group.memberCount} members · {group.seasonLength}-day season
        </Text>
        <Text style={styles.inviteCode}>Invite code: {group.inviteCode}</Text>
      </View>

      <Text style={styles.sectionLabel}>Challenges</Text>

      {challenges.length === 0 ? (
        <Text style={styles.loading}>No challenges in this group yet.</Text>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onPress={() =>
                navigation.navigate("ChallengeDetail", { id: item.id })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: { marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: 26, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  inviteCode: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  loading: { color: colors.textMuted },
  listContent: { paddingBottom: spacing.lg },
});
