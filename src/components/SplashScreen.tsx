import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../types/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>✍️</Text>
      </View>
      <Text style={styles.title}>PlumeRelais</Text>
      <Text style={styles.subtitle}>Écriture collaborative</Text>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: { fontSize: 64 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 8, letterSpacing: 1 },
  subtitle: { fontSize: 18, color: '#e0e0ff', fontWeight: '500' },
});