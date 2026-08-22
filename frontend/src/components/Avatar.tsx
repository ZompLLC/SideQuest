import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface AvatarProps {
  name?: string;
  size?: number;
}

export default function Avatar({ name, size = 40 }: AvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initial, { fontSize: size * 0.45 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.text,
    fontWeight: '700',
  },
});
