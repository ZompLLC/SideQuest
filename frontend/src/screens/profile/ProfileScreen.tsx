import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../../theme";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../../components/Avatar";
import PointsBadge from "../../components/PointsBadge";
import Button from "../../components/Button";
import { ProfileStackParamList } from "../../types";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileHome">;

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Avatar name={user?.username} size={64} />
        <Text style={styles.name}>{user?.username ?? "Guest"}</Text>
        {user?.email && <Text style={styles.email}>{user.email}</Text>}
        <PointsBadge points={190} />
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
});
