import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii, typography } from '../types/theme';
import Avatar from '../components/Avatar';

export default function ProfileScreen({ navigation }: any) {
  const { user, profile, signOut, isLoggingOut } = useAuth();

  const handleLogout = () => {
    if (isLoggingOut) return;

    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Pas de navigation.replace ici : AppNavigator bascule
              // automatiquement sur la pile Login dès que `user` devient null.
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon profil</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarWrap}>
          <Avatar username={profile?.username || '?'} avatarUrl={profile?.avatar_url} size={88} />
          <Text style={styles.username}>{profile?.username || 'Auteur'}</Text>
          <View style={styles.repChip}>
            <Text style={styles.repChipText}>⭐ {profile?.reputation || 0} réputation</Text>
          </View>
        </View>

        <View style={styles.card}>
          <InfoRow label="Pseudo" value={profile?.username || 'Non défini'} />
          <InfoRow label="Email" value={user?.email || '—'} />
          <InfoRow label="Réputation" value={`⭐ ${profile?.reputation || 0}`} last />
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, isLoggingOut && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          activeOpacity={0.85}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutBtnText}>
            {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: colors.bg2,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(124,92,191,0.2)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg3,
    borderWidth: 0.5,
    borderColor: 'rgba(124,92,191,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: colors.t1,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: colors.t1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 20,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.t1,
    marginTop: 14,
  },
  repChip: {
    marginTop: 8,
    backgroundColor: 'rgba(232,197,71,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(232,197,71,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  repChipText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radii.lg,
    borderWidth: 0.5,
    borderColor: 'rgba(124,92,191,0.2)',
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  infoRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(124,92,191,0.12)',
  },
  infoLabel: {
    ...typography.label,
    color: colors.t3,
  },
  infoValue: {
    fontSize: 14,
    color: colors.t1,
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: 'rgba(232,92,106,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(232,92,106,0.35)',
    borderRadius: radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutBtnDisabled: {
    opacity: 0.5,
  },
  logoutBtnText: {
    color: colors.red,
    fontSize: 15,
    fontWeight: '700',
  },
});