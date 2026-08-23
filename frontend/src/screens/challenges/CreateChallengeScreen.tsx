import React, { useState } from "react";
import { Text, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../theme";
import { createChallenge } from "../../api/challenges";
import Button from "../../components/Button";
import { ChallengesStackParamList } from "../../types";

type Props = NativeStackScreenProps<
  ChallengesStackParamList,
  "CreateChallenge"
>;

export default function CreateChallengeScreen({ navigation }: Props) {
  const [title, setTitle] = useState("");
  const [opponent, setOpponent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);
    await createChallenge({
      title,
      opponent,
      challenger: "You",
      points: 10,
      groupId: "g1",
    });
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
        placeholder="Opponent's name"
        placeholderTextColor={colors.textMuted}
        value={opponent}
        onChangeText={setOpponent}
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
