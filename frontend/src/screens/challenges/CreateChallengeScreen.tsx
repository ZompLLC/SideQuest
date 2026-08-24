import React, { useState } from "react";
import { Text, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../theme";
import { createChallenge } from "../../api/challenges";
import Button from "../../components/Button";
import { GroupsStackParamList } from "../../types";
import { useTokenStore } from "@/store/tokenStore";

type Props = NativeStackScreenProps<GroupsStackParamList, "CreateChallenge">;

export default function CreateChallengeScreen({ route, navigation }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [dueAt, setDueAt] = useState(""); // expects "YYYY-MM-DD" for now;
  const [saving, setSaving] = useState(false);
  const token = useTokenStore((s) => s.token);

  async function handleCreate() {
    setSaving(true);
    await createChallenge(
      {
        title,
        description,
        pointValue: Number(points) || 0,
        dueAt: new Date(dueAt),
      },
      route.params.groupId,
      token!,
    );
    setSaving(false);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>New Challenge</Text>
      <TextInput
        style={styles.input}
        placeholder="Challenge title"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Points"
        placeholderTextColor={colors.textMuted}
        value={points}
        onChangeText={setPoints}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Due date (YYYY-MM-DD)"
        placeholderTextColor={colors.textMuted}
        value={dueAt}
        onChangeText={setDueAt}
      />
      <Button
        title={saving ? "Saving…" : "Create Challenge"}
        onPress={handleCreate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    color: colors.text,
    marginBottom: spacing.md,
  },
});
