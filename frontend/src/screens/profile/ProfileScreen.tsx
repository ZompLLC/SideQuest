import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../../components/Avatar";
import PointsBadge from "../../components/PointsBadge";
import Button from "../../components/Button";

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const { logout, updateUsername, loading, error } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username ?? "");

  function startEditing() {
    setUsername(user?.username ?? "");
    setEditing(true);
  }

  async function save() {
    if (loading) return;
    await updateUsername(username);
    setEditing(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Avatar name={user?.username} size={64} />
        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setEditing(false)}
              />
              <Button
                title={loading ? "Saving..." : "Save"}
                onPress={save}
              />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.name}>{user?.username ?? "Guest"}</Text>
            <PointsBadge points={190} />
            <Button
              title="Edit Profile"
              variant="secondary"
              onPress={startEditing}
            />
          </>
        )}
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
  editRow: { width: "100%", alignItems: "center", gap: spacing.sm },
  input: {
    width: "100%",
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  editActions: { flexDirection: "row", gap: spacing.sm },
  error: { color: colors.warning, fontSize: 13 },
});
