import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../theme";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import { useUserStats } from "../../hooks/useUserStats";
import { useGroups } from "../../hooks/useGroups";
import Avatar from "../../components/Avatar";
import PointsBadge from "../../components/PointsBadge";
import Button from "../../components/Button";
import { ProfileStackParamList } from "../../types";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileHome">;

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const { stats, loading: statsLoading } = useUserStats(user?.id);
  const { groups, loading: groupsLoading } = useGroups();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Avatar name={user?.username} size={64} />
          <Text style={styles.name}>{user?.username ?? "Guest"}</Text>
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
          <PointsBadge points={190} />

          {statsLoading ? (
            <Text style={styles.statsLoading}>Loading stats…</Text>
          ) : (
            stats && (
              <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.currentStreak}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {Math.round(stats.completionRate * 100)}%
                    </Text>
                    <Text style={styles.statLabel}>Completion</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {stats.totalPointsAllTime}
                    </Text>
                    <Text style={styles.statLabel}>Total Points</Text>
                  </View>
                </View>
                {stats.badges.length > 0 && (
                  <View style={styles.badgesRow}>
                    {stats.badges.map((badge) => (
                      <View key={badge} style={styles.badgeChip}>
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )
          )}

          <Button
            title="Edit Profile"
            variant="secondary"
            onPress={() => navigation.navigate("EditProfile")}
          />
        </View>

        <Text style={styles.sectionLabel}>My Groups</Text>
        {groupsLoading ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : groups.length === 0 ? (
          <Text style={styles.loading}>You&apos;re not in any groups yet.</Text>
        ) : (
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              activeOpacity={0.7}
              onPress={() =>
                // Profile's nav prop is scoped to ProfileStackParamList, so
                // jumping to the sibling Groups tab needs an escape hatch
                // (unlike HomeScreen, whose tab-level prop already includes it).
                (navigation.navigate as (...args: any[]) => void)("Groups", {
                  screen: "GroupDetail",
                  params: { id: group.id },
                })
              }
            >
              <Text style={styles.groupTitle}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                {group.memberCount} members · {group.seasonLength}-day season
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <Button title="Log out" variant="secondary" onPress={logout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  scrollContent: { paddingBottom: spacing.lg },
  header: { alignItems: "center", marginTop: spacing.xl, gap: spacing.sm },
  name: { color: colors.text, fontSize: 22, fontWeight: "700" },
  email: { color: colors.textMuted, fontSize: 14 },
  statsLoading: { color: colors.textMuted, marginTop: spacing.sm },
  statsCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { color: colors.text, fontSize: 20, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },
  badgeChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  badgeText: { color: colors.text, fontSize: 12 },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  loading: { color: colors.textMuted },
  groupCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.textMuted,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  groupTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  groupMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
});
