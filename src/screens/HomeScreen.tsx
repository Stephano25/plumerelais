import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Story } from '../types';
import StoryCard from '../components/StoryCard';

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [participating, setParticipating] = useState<Story[]>([]);
  const [open, setOpen] = useState<Story[]>([]);
  const [finished, setFinished] = useState<Story[]>([]);
  const isMounted = useRef(true);

  // Déconnexion : on remplace la route Login dans le même navigateur
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // Retour à Login
            navigation.replace('Login');
          },
        },
      ]
    );
  }, [signOut, navigation]);

  // Ajout d’un bouton dans l’en-tête (optionnel, mais le bouton principal sera dans le contenu)
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Déconnexion</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleLogout]);

  const fetchStories = useCallback(async () => {
    if (!user || !isMounted.current) return;
    try {
      const { data: participants } = await supabase
        .from('story_participants')
        .select('story_id')
        .eq('user_id', user.id);
      const pIds = participants?.map(p => p.story_id) || [];

      if (pIds.length) {
        const { data } = await supabase.from('stories').select('*').in('id', pIds);
        if (isMounted.current) setParticipating(data as Story[] || []);
      } else if (isMounted.current) setParticipating([]);

      let openQuery = supabase
        .from('stories')
        .select('*')
        .eq('is_public', true)
        .in('status', ['open', 'in_progress']);
      if (pIds.length > 0) openQuery = openQuery.not('id', 'in', `(${pIds.join(',')})`);
      const { data: openData } = await openQuery;
      if (isMounted.current) setOpen(openData as Story[] || []);

      const { data: finishedData } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'finished')
        .order('created_at', { ascending: false });
      if (isMounted.current) setFinished(finishedData as Story[] || []);
    } catch (error) {
      console.error('Erreur fetchStories:', error);
    }
  }, [user]);

  useEffect(() => {
    isMounted.current = true;
    fetchStories();
    const subscription = supabase
      .channel('stories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => fetchStories())
      .subscribe();
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchStories]);

  const renderSection = (title: string, stories: Story[], emptyMsg: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={stories}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <StoryCard story={item} onPress={() => navigation.navigate('StoryDetail', { storyId: item.id })} />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyMsg}</Text>}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderSection('📚 Mes histoires', participating, 'Aucune histoire rejointe')}
      {renderSection('🌍 Histoires ouvertes', open, 'Aucune histoire ouverte')}
      {renderSection('🏁 Terminées', finished, 'Aucune histoire terminée')}
      
      {/* Bouton de déconnexion principal, bien visible */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateStory')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { marginVertical: 12 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 16, marginBottom: 10, color: '#333' },
  emptyText: { marginLeft: 16, fontSize: 14, color: '#999', fontStyle: 'italic' },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 80, // pour ne pas cacher le FAB
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6200ee',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.3)',
    elevation: 5,
  },
  fabText: { color: 'white', fontSize: 28, fontWeight: 'bold', lineHeight: 32 },
});