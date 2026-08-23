import React, { useEffect, useState } from "react";
import { Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../theme";
import { getGroups } from "../../api/groups";
import { GroupsStackParamList, Group } from "../../types";

type Props = NativeStackScreenProps<GroupsStackParamList, "GroupsList">;

export default function GroupsScreen({ navigation }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getGroups()
      .then((data) => {
        if (mounted) setGroups(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : groups.length === 0 ? (
        <Text style={styles.loading}>You&apos;re not in any groups yet.</Text>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("GroupDetail", { id: item.id })
              }
            >
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.memberCount} members · {item.seasonLength}-day season
              </Text>
            </TouchableOpacity>
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
  loading: { color: colors.textMuted },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.textMuted,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: "600" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  listContent: { paddingBottom: spacing.lg },
});
