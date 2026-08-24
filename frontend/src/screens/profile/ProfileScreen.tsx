import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../theme";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import { useUserStats } from "../../hooks/useUserStats";
import Avatar from "../../components/Avatar";
import PointsBadge from "../../components/PointsBadge";
import Button from "../../components/Button";
import { ProfileStackParamList } from "../../types";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileHome">;

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const { stats, loading: statsLoading } = useUserStats(user?.id);

  return (
    <SafeAreaView style={styles.container}>
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
      <Button title="Log out" variant="secondary" onPress={logout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
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
});
