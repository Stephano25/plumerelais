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

  // Déconnexion mémorisée pour éviter les recréations
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
            // Réinitialiser le navigateur racine
            const parent = navigation.getParent();
            if (parent) {
              parent.reset({ index: 0, routes: [{ name: 'Login' }] });
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }
          },
        },
      ]
    );
  }, [signOut, navigation]);

  // Configuration du bouton dans le header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Déconnexion</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleLogout]);

  // Récupération des histoires
  const fetchStories = useCallback(async () => {
    if (!user || !isMounted.current) return;
    try {
      const { data: participants } = await supabase
        .from('story_participants')
        .select('story_id')
        .eq('user_id', user.id);
      const pIds = participants?.map(p => p.story_id) || [];

      // Histoires participatives
      if (pIds.length) {
        const { data } = await supabase.from('stories').select('*').in('id', pIds);
        if (isMounted.current) setParticipating(data as Story[] || []);
      } else if (isMounted.current) setParticipating([]);

      // Histoires ouvertes (exclure celles rejointes)
      let openQuery = supabase
        .from('stories')
        .select('*')
        .eq('is_public', true)
        .in('status', ['open', 'in_progress']);
      if (pIds.length > 0) openQuery = openQuery.not('id', 'in', `(${pIds.join(',')})`);
      const { data: openData } = await openQuery;
      if (isMounted.current) setOpen(openData as Story[] || []);

      // Histoires terminées
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

  // Effet principal : chargement initial + temps réel
  useEffect(() => {
    isMounted.current = true;
    fetchStories();

    const subscription = supabase
      .channel('stories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
        if (isMounted.current) fetchStories();
      })
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
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: 'white', fontSize: 28, fontWeight: 'bold', lineHeight: 32 },
});