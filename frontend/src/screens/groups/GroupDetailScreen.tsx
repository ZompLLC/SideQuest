import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing } from "../../theme";
import { getGroupById } from "../../api/groups";
import { getChallengesByGroup } from "../../api/challenges";
import { useLeaderboard } from "../../hooks/useLeaderboard";
import ChallengeCard from "../../components/ChallengeCard";
import LeaderboardList from "../../components/LeaderboardList";
import { GroupsStackParamList, Group, Challenge } from "../../types";

type Props = NativeStackScreenProps<GroupsStackParamList, "GroupDetail">;

export default function GroupDetailScreen({ route, navigation }: Props) {
  const { id, openChallengeId } = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard();

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

  // Refetch challenges whenever this screen regains focus (e.g. coming back
  // from CreateChallenge), since it stays mounted across that navigation.
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getChallengesByGroup(id).then((challengeData) => {
        if (mounted) setChallenges(challengeData);
      });
      return () => {
        mounted = false;
      };
    }, [id]),
  );

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.meta}>
            {group.memberCount} members · {group.seasonLength}-day season
          </Text>
          {group.inviteCode && (
            <Text style={styles.inviteCode}>
              Invite code: {group.inviteCode}
            </Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>Leaderboard</Text>
        {leaderboardLoading ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : (
          <LeaderboardList entries={leaderboard} />
        )}

        <View style={styles.challengesHeaderRow}>
          <Text style={[styles.sectionLabel, styles.challengesLabel]}>
            Challenges
          </Text>
          <TouchableOpacity
            style={styles.createChallengeButton}
            onPress={() =>
              navigation.navigate("CreateChallenge", { groupId: group.id })
            }
            accessibilityRole="button"
            accessibilityLabel="Create a new challenge for this group"
          >
            <Text style={styles.createChallengeButtonText}>
              + New Challenge
            </Text>
          </TouchableOpacity>
        </View>

        {challenges.length === 0 ? (
          <Text style={styles.loading}>No challenges in this group yet.</Text>
        ) : (
          challenges.map((item) => (
            <ChallengeCard
              key={item.id}
              challenge={item}
              onPress={() =>
                navigation.navigate("ChallengeDetail", { id: item.id })
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
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
  challengesLabel: { marginTop: spacing.lg },
  loading: { color: colors.textMuted },
  challengesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  createChallengeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#2563eb", // swap for your theme color
  },
  createChallengeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
