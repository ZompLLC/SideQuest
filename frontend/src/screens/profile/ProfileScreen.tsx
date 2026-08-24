import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../../components/Avatar";
import PointsBadge from "../../components/PointsBadge";
import Button from "../../components/Button";

type ActiveForm = "none" | "username" | "password" | "email";

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const {
    logout,
    updateUsername,
    loading,
    error,
    changePassword,
    changingPassword,
    changePasswordError,
    changeEmail,
    changingEmail,
    changeEmailError,
  } = useAuth();

  const [activeForm, setActiveForm] = useState<ActiveForm>("none");
  const [username, setUsername] = useState(user?.username ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  function startEditingUsername() {
    setUsername(user?.username ?? "");
    setActiveForm("username");
  }

  function startChangingPassword() {
    setCurrentPassword("");
    setNewPassword("");
    setActiveForm("password");
  }

  function startChangingEmail() {
    setCurrentPasswordForEmail("");
    setNewEmail(user?.email ?? "");
    setActiveForm("email");
  }

  async function saveUsername() {
    if (loading) return;
    const ok = await updateUsername(username);
    if (ok) setActiveForm("none");
  }

  async function savePassword() {
    if (changingPassword) return;
    const ok = await changePassword(currentPassword, newPassword);
    if (ok) {
      setCurrentPassword("");
      setNewPassword("");
      setActiveForm("none");
    }
  }

  async function saveEmail() {
    if (changingEmail) return;
    const ok = await changeEmail(currentPasswordForEmail, newEmail);
    if (ok) {
      setCurrentPasswordForEmail("");
      setActiveForm("none");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Avatar name={user?.username} size={64} />

        {activeForm === "username" && (
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
                onPress={() => setActiveForm("none")}
              />
              <Button
                title={loading ? "Saving..." : "Save"}
                onPress={saveUsername}
              />
            </View>
          </View>
        )}

        {activeForm === "password" && (
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            {changePasswordError && (
              <Text style={styles.error}>{changePasswordError}</Text>
            )}
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setActiveForm("none")}
              />
              <Button
                title={changingPassword ? "Saving..." : "Save"}
                onPress={savePassword}
              />
            </View>
          </View>
        )}

        {activeForm === "email" && (
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={currentPasswordForEmail}
              onChangeText={setCurrentPasswordForEmail}
              placeholder="Current password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="New email"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {changeEmailError && (
              <Text style={styles.error}>{changeEmailError}</Text>
            )}
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setActiveForm("none")}
              />
              <Button
                title={changingEmail ? "Saving..." : "Save"}
                onPress={saveEmail}
              />
            </View>
          </View>
        )}

        {activeForm === "none" && (
          <>
            <Text style={styles.name}>{user?.username ?? "Guest"}</Text>
            {user?.email && <Text style={styles.email}>{user.email}</Text>}
            <PointsBadge points={190} />
            <View style={styles.actionsColumn}>
              <Button
                title="Edit Profile"
                variant="secondary"
                onPress={startEditingUsername}
              />
              <Button
                title="Change Password"
                variant="secondary"
                onPress={startChangingPassword}
              />
              <Button
                title="Change Email"
                variant="secondary"
                onPress={startChangingEmail}
              />
            </View>
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
  email: { color: colors.textMuted, fontSize: 14 },
  editRow: { width: "100%", alignItems: "center", gap: spacing.sm },
  actionsColumn: { width: "100%", gap: spacing.sm, marginTop: spacing.sm },
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
