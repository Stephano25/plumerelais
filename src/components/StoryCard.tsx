import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Story } from '../types';

interface Props {
  story: Story;
  onPress: () => void;
}

export default function StoryCard({ story, onPress }: Props) {
  // Sur le web, les images distantes fonctionnent normalement
  const imageSource = story.cover_image ? { uri: story.cover_image } : null;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {imageSource ? (
        <Image source={imageSource} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.placeholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{story.title}</Text>
        <Text style={styles.status}>Statut : {story.status === 'open' ? 'Ouverte' : story.status === 'in_progress' ? 'En cours' : 'Terminée'}</Text>
        <Text style={styles.turns}>Tours : {story.current_turn}/{story.max_contributions}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: 160, marginHorizontal: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', elevation: 2, ...(Platform.OS === 'web' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } : {}) },
  cover: { width: '100%', height: 100 },
  placeholder: { backgroundColor: '#ddd' },
  info: { padding: 8 },
  title: { fontWeight: 'bold', fontSize: 14 },
  status: { fontSize: 11, color: 'gray', marginTop: 2 },
  turns: { fontSize: 11, color: 'gray' },
});