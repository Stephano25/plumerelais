// screens/HomeScreen.tsx
import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useStories } from '../contexts/StoriesContext';
import { Story } from '../types';
import StoryCard from '../components/StoryCard';

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { participatingStories, openStories, finishedStories, refreshStories } = useStories();

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
            navigation.replace('Login');
          },
        },
      ]
    );
  }, [signOut, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Déconnexion</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleLogout]);

  useEffect(() => {
    refreshStories();
  }, [refreshStories]);

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
      {renderSection('📚 Mes histoires', participatingStories, 'Aucune histoire rejointe')}
      {renderSection('🌍 Histoires ouvertes', openStories, 'Aucune histoire ouverte')}
      {renderSection('🏁 Terminées', finishedStories, 'Aucune histoire terminée')}
      
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
    marginBottom: 80,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: { color: 'white', fontSize: 28, fontWeight: 'bold', lineHeight: 32 },
});