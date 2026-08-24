import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";
import { LeaderboardEntry } from "../types";
import Avatar from "./Avatar";
import PointsBadge from "./PointsBadge";

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
}

// Renders as plain Views (not a FlatList) so it can be embedded inside
// another scrollable container, e.g. GroupDetailScreen's ScrollView --
// nesting VirtualizedLists of the same orientation breaks RN's windowing.
export default function LeaderboardList({ entries }: LeaderboardListProps) {
  return (
    <View>
      {entries.map((item, index) => (
        <View key={item.userId} style={styles.row}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <Avatar name={item.username} size={36} />
          <Text style={styles.name}>{item.username}</Text>
          <View style={{ flex: 1 }} />
          <PointsBadge points={item.points} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: { color: colors.textMuted, width: 28, fontWeight: "700" },
  name: { color: colors.text, fontSize: 16, marginLeft: spacing.sm },
});
