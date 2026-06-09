import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface Props {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

export default function Avatar({ username, avatarUrl, size = 40 }: Props) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  const initial = username?.charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: '#6200ee', justifyContent: 'center', alignItems: 'center' },
  fallbackText: { color: 'white', fontWeight: 'bold' },
});