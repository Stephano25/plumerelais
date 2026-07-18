import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Story } from '../types';
import { colors } from '../types/theme';

interface Props {
  story: Story;
  onPress: () => void;
  style?: any;
}

export default function StoryCard({ story, onPress, style }: Props) {
  // Utiliser cover_url ou cover_image
  const imageUrl = story.cover_url || story.cover_image;
  const imageSource = imageUrl ? { uri: imageUrl } : null;
  
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
      {imageSource ? (
        <Image source={imageSource} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.placeholder]}>
          <Text style={styles.placeholderIcon}>📖</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{story.title || 'Sans titre'}</Text>
        <Text style={styles.status}>
          {story.status === 'open' ? 'Ouverte' : story.status === 'in_progress' ? 'En cours' : 'Terminée'}
        </Text>
        <Text style={styles.turns}>Tours : {story.current_turn || 0}/{story.max_contributions || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.bg2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cover: { 
    width: '100%', 
    height: 100,
    backgroundColor: colors.bg3,
  },
  placeholder: { 
    backgroundColor: colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    color: colors.t3,
  },
  info: { 
    padding: 10,
  },
  title: { 
    fontWeight: '600', 
    fontSize: 13, 
    color: colors.t1,
    marginBottom: 4,
  },
  status: { 
    fontSize: 10, 
    color: colors.t3, 
    marginBottom: 2,
  },
  turns: { 
    fontSize: 10, 
    color: colors.t3,
  },
});