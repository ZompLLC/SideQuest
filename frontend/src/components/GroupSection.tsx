import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";
import ChallengeCard from "./ChallengeCard";
import { Challenge, Group } from "../types";

type Props = {
  group: Group;
  challenges: Challenge[];
  onPressGroup: () => void;
  onPressChallenge: (challengeId: string) => void;
};

export default function GroupSection({
  group,
  challenges,
  onPressGroup,
  onPressChallenge,
}: Props) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={onPressGroup}
        activeOpacity={0.7}
      >
        <View>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.meta}>{group.memberCount} members</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {challenges.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          onPress={() => onPressChallenge(challenge.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.textMuted,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: "600" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  chevron: { color: colors.textMuted, fontSize: 22, fontWeight: "300" },
});
