import React, { useEffect, useState, useCallback } from 'react';
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

  const handleLogout = () => {
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
            // Réinitialiser toute la pile de navigation (navigateur racine)
            const parent = navigation.getParent();
            if (parent) {
              parent.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } else {
              // Fallback : reset local (moins fiable)
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Déconnexion</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchStories = useCallback(async () => {
    if (!user) return;
    const { data: participants } = await supabase
      .from('story_participants')
      .select('story_id')
      .eq('user_id', user.id);
    const pIds = participants?.map(p => p.story_id) || [];

    if (pIds.length) {
      const { data } = await supabase.from('stories').select('*').in('id', pIds);
      setParticipating(data as Story[] || []);
    } else setParticipating([]);

    let openQuery = supabase
      .from('stories')
      .select('*')
      .eq('is_public', true)
      .in('status', ['open', 'in_progress']);
    if (pIds.length > 0) openQuery = openQuery.not('id', 'in', `(${pIds.join(',')})`);
    const { data: openData } = await openQuery;
    setOpen(openData as Story[] || []);

    const { data: finishedData } = await supabase
      .from('stories')
      .select('*')
      .eq('status', 'finished')
      .order('created_at', { ascending: false });
    setFinished(finishedData as Story[] || []);
  }, [user]);

  useEffect(() => {
    fetchStories();
    const subscription = supabase
      .channel('stories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => fetchStories())
      .subscribe();
    return () => subscription.unsubscribe();
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
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderSection('Mes histoires', participating, 'Aucune histoire rejointe')}
      {renderSection('Histoires ouvertes', open, 'Aucune histoire ouverte')}
      {renderSection('Terminées', finished, 'Aucune histoire terminée')}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateStory')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginVertical: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 16, marginBottom: 8 },
  emptyText: { marginLeft: 16, color: 'gray' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#6200ee', borderRadius: 30, padding: 16 },
  fabText: { color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
});