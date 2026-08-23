import React, { useEffect, useMemo, useState } from "react";
import { Text, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { colors, spacing } from "../../theme";
import { useChallenges } from "../../hooks/useChallenges";
import { useAuthStore } from "../../store/authStore";
import { getGroups } from "../../api/groups";
import GroupSection from "../../components/GroupSection";
import { MainTabParamList, Group, Challenge } from "../../types";

type Props = BottomTabScreenProps<MainTabParamList, "Home">;

type GroupWithChallenges = {
  group: Group;
  challenges: Challenge[];
};

const UNGROUPED: Group = {
  id: "ungrouped",
  name: "Other challenges",
  ownerId: "",
  inviteCode: "",
  memberCount: 0,
  seasonLength: 0,
};

export default function HomeScreen({ navigation }: Props) {
  const { challenges, loading } = useChallenges();
  const user = useAuthStore((s) => s.user);

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getGroups()
      .then((data) => {
        if (mounted) setGroups(data);
      })
      .finally(() => {
        if (mounted) setGroupsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const groupedSections: GroupWithChallenges[] = useMemo(() => {
    const groupsById = new Map(groups.map((g) => [g.id, g]));
    const byGroup = new Map<string, GroupWithChallenges>();

    for (const challenge of challenges) {
      const group = groupsById.get(challenge.groupId) ?? UNGROUPED;

      if (!byGroup.has(group.id)) {
        byGroup.set(group.id, { group, challenges: [] });
      }
      byGroup.get(group.id)!.challenges.push(challenge);
    }

    return Array.from(byGroup.values());
  }, [challenges, groups]);

  const isLoading = loading || groupsLoading;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hey{user ? `, ${user.username}` : ""}</Text>
      <Text style={styles.subtitle}>Recent activity</Text>

      {isLoading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : groupedSections.length === 0 ? (
        <Text style={styles.loading}>
          No challenges yet — start one with a group!
        </Text>
      ) : (
        <FlatList
          data={groupedSections}
          keyExtractor={(item) => item.group.id}
          renderItem={({ item }) => (
            <GroupSection
              group={item.group}
              challenges={item.challenges}
              onPressGroup={() =>
                navigation.navigate("Groups", {
                  screen: "GroupDetail",
                  params: { id: item.group.id },
                } as never)
              }
              onPressChallenge={(challengeId) =>
                // Route through the group first, then straight into the challenge —
                // back navigation lands you on the group page, not Home.
                navigation.navigate("Groups", {
                  screen: "GroupDetail",
                  params: { id: item.group.id, openChallengeId: challengeId },
                } as never)
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
  title: { color: colors.text, fontSize: 28, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 16, marginBottom: spacing.md },
  loading: { color: colors.textMuted },
  listContent: {
    paddingBottom: spacing.lg,
  },
});
