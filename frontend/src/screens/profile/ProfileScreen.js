import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/Avatar';
import PointsBadge from '../../components/PointsBadge';
import Button from '../../components/Button';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Avatar name={user?.name} size={64} />
        <Text style={styles.name}>{user?.name ?? 'Guest'}</Text>
        <PointsBadge points={190} />
      </View>
      <Button title="Log out" variant="secondary" onPress={logout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  name: { color: colors.text, fontSize: 22, fontWeight: '700' },
});
