import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { user, profile, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // La navigation s'occupe du reste
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.label}>Pseudo : {profile?.username}</Text>
      <Text style={styles.label}>Email : {user?.email}</Text>
      <Text style={styles.label}>Réputation : {profile?.reputation || 0}</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  label: { fontSize: 16, marginBottom: 12 },
  button: { backgroundColor: '#dc3545', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});