// screens/HomeScreen.tsx
import React, { useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Animated, ScrollView, StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useStories } from '../contexts/StoriesContext';
import { Story } from '../types';
import StoryCard from '../components/StoryCard';
import { colors, radii } from '../types/theme';

export default function HomeScreen({ navigation }: any) {
  const { user, profile, signOut } = useAuth();
  const { participatingStories, openStories, finishedStories, refreshStories } = useStories();

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(fabScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter', style: 'destructive',
          onPress: async () => { await signOut(); navigation.replace('Login'); },
        },
      ]
    );
  }, [signOut, navigation]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    refreshStories();
  }, []);

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : '?';

  const renderSection = (
    title: string,
    stories: Story[],
    emptyMsg: string,
    badgeColor?: string
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {stories.length > 0 && (
          <TouchableOpacity>
            <Text style={styles.seeAll}>Voir tout ›</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        horizontal
        data={stories}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <Animated.View 
            style={[
              { opacity: contentOpacity },
              { transform: [{ translateX: contentAnim }] }
            ]}
          >
            <StoryCard
              story={item}
              onPress={() => navigation.navigate('StoryDetail', { storyId: item.id })}
              style={{ marginRight: 12 }}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{emptyMsg}</Text>
          </View>
        }
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View>
          <Text style={styles.brand}>🪶 Plume Relais</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
            <Text style={styles.logoutIconText}>⏻</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Hero greeting */}
        <Animated.View
          style={[
            styles.hero,
            { opacity: contentOpacity, transform: [{ translateY: contentAnim }] },
          ]}
        >
          <Text style={styles.greeting}>
            Bonjour, <Text style={styles.greetingName}>{profile?.username || 'Auteur'}</Text> ✨
          </Text>
          <Text style={styles.greetingSubtitle}>
            {openStories.length > 0
              ? `${openStories.length} histoires attendent votre plume`
              : 'Créez la première histoire du jour'}
          </Text>
        </Animated.View>

        {/* Stats chips */}
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.statsRow, { opacity: contentOpacity }]}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
        >
          <StatChip value={participatingStories.length} label="Mes histoires" />
          <StatChip value={openStories.length} label="Ouvertes" color={colors.green} />
          <StatChip value={profile?.reputation || 0} label="Réputation" color={colors.accent} prefix="⭐ " />
        </Animated.ScrollView>

        {/* Sections */}
        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentAnim }] }}>
          {renderSection('📚 Mes histoires', participatingStories, 'Rejoignez une histoire pour commencer')}
          {renderSection('🌍 Histoires ouvertes', openStories, 'Aucune histoire ouverte pour le moment')}
          {renderSection('🏁 Terminées', finishedStories, 'Aucune histoire terminée')}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateStory')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <BottomNavItem icon="🏠" label="Accueil" active />
        <BottomNavItem icon="🌍" label="Explorer" onPress={() => {}} />
        <BottomNavItem icon="👤" label="Profil" onPress={() => navigation.navigate('Profile')} />
      </View>
    </View>
  );
}

function StatChip({ value, label, color = colors.primary3, prefix = '' }: any) {
  return (
    <View style={chipStyles.wrap}>
      <Text style={[chipStyles.num, { color }]}>{prefix}{value}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

function BottomNavItem({ icon, label, active = false, onPress }: any) {
  return (
    <TouchableOpacity style={bnStyles.item} onPress={onPress} activeOpacity={0.7}>
      <Text style={[bnStyles.icon, active && bnStyles.iconActive]}>{icon}</Text>
      <Text style={[bnStyles.label, active && bnStyles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
    backgroundColor: colors.bg,
  },
  brand: { fontSize: 20, fontWeight: '700', color: colors.primary3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(232,92,106,0.12)',
    borderWidth: 0.5, borderColor: 'rgba(232,92,106,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoutIconText: { fontSize: 16, color: colors.red },
  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(196,168,240,0.3)',
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  hero: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  greeting: { fontSize: 28, fontWeight: '700', color: colors.t1, marginBottom: 4 },
  greetingName: { color: colors.primary3 },
  greetingSubtitle: { fontSize: 14, color: colors.t3 },
  statsRow: { marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.t1 },
  seeAll: { fontSize: 13, color: colors.primary3 },
  emptyWrap: { paddingLeft: 16 },
  emptyText: { fontSize: 14, color: colors.t3, fontStyle: 'italic' },
  fabWrap: {
    position: 'absolute', bottom: 76, right: 20,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300', marginTop: -2 },
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 64,
    flexDirection: 'row',
    backgroundColor: 'rgba(14,11,26,0.95)',
    borderTopWidth: 0.5, borderTopColor: 'rgba(124,92,191,0.2)',
  },
});

const chipStyles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg2,
    borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.25)',
    borderRadius: 40, paddingHorizontal: 16, paddingVertical: 9,
    flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8,
  },
  num: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 12, color: colors.t3 },
});

const bnStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 22, opacity: 0.5 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, color: colors.t3 },
  labelActive: { color: colors.primary3 },
});