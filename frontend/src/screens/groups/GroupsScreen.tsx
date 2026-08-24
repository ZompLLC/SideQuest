import React, { useState } from "react";
import {
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../theme";
import { useGroups } from "../../hooks/useGroups";
import Button from "../../components/Button";
import { GroupsStackParamList } from "../../types";

type Props = NativeStackScreenProps<GroupsStackParamList, "GroupsList">;

export default function GroupsScreen({ navigation }: Props) {
  const { groups, loading, createGroup, creating, createError } = useGroups();
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [name, setName] = useState("");

  async function handleCreate() {
    if (creating) return;
    await createGroup(name);
    setName("");
    setCreatingOpen(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      {creatingOpen ? (
        <View style={styles.createForm}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Group name"
            placeholderTextColor={colors.textMuted}
          />
          {createError && <Text style={styles.error}>{createError}</Text>}
          <View style={styles.createActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setCreatingOpen(false)}
            />
            <Button
              title={creating ? "Creating..." : "Create"}
              onPress={handleCreate}
            />
          </View>
        </View>
      ) : (
        <Button title="+ Add Group" onPress={() => setCreatingOpen(true)} />
      )}

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
    gap: spacing.md,
  },
  loading: { color: colors.textMuted },
  createForm: { gap: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    color: colors.text,
  },
  createActions: { flexDirection: "row", gap: spacing.sm },
  error: { color: colors.warning, fontSize: 13 },
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
