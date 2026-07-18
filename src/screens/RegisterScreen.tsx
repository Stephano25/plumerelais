import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii, typography } from '../types/theme';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !username) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, username);
    setLoading(false);
    if (error) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } else {
      Alert.alert('Succès !', 'Compte créé. Vérifiez votre email si nécessaire.');
      navigation.navigate('Login');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.root} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.logoWrap}>
            <Text style={styles.pen}>✍️</Text>
            <Text style={styles.brandName}>Créer mon compte</Text>
            <Text style={styles.tagline}>Rejoignez la communauté d'auteurs</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Pseudo</Text>
              <TextInput
                style={styles.input}
                placeholder="votre_pseudo"
                placeholderTextColor={colors.t3}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="vous@exemple.com"
                placeholderTextColor={colors.t3}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Au moins 6 caractères"
                placeholderTextColor={colors.t3}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.strengthBar}>
              <View style={[styles.strengthFill, { 
                width: `${Math.min((password.length / 12) * 100, 100)}%`,
                backgroundColor: password.length < 6 ? colors.red : password.length < 10 ? colors.accent : colors.green,
              }]} />
            </View>
            <Text style={styles.strengthLabel}>
              {password.length === 0 ? '' : password.length < 6 ? 'Trop court' : password.length < 10 ? 'Correct' : 'Fort ✓'}
            </Text>

            <TouchableOpacity 
              style={[styles.btnPrimary, loading && styles.btnDisabled]} 
              onPress={handleRegister} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Créer mon compte ✨</Text>}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Déjà un compte ? Se connecter →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  pen: { fontSize: 56, marginBottom: 10 },
  brandName: { fontSize: 30, fontWeight: '700', color: colors.primary3, marginBottom: 6 },
  tagline: { fontSize: 14, color: colors.t3 },
  card: {
    width: '100%',
    backgroundColor: colors.bg2,
    borderRadius: radii.xl,
    padding: 28,
    borderWidth: 0.5,
    borderColor: 'rgba(124,92,191,0.3)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 40,
    elevation: 10,
  },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { ...typography.label, color: colors.t3, marginBottom: 7 },
  input: {
    backgroundColor: colors.bg3,
    borderWidth: 0.5,
    borderColor: 'rgba(124,92,191,0.25)',
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.t1,
  },
  strengthBar: {
    height: 3,
    backgroundColor: colors.bg4,
    borderRadius: 2,
    marginBottom: 4,
    marginTop: -8,
    overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 2 },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  divider: { height: 0.5, backgroundColor: 'rgba(124,92,191,0.2)', marginVertical: 22 },
  link: { textAlign: 'center', color: colors.primary3, fontSize: 14, fontWeight: '500' },
});