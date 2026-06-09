import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { StoryParagraph } from '../types';

export default function FinishedStoryScreen({ route }: any) {
  const { storyId } = route.params;
  const [paragraphs, setParagraphs] = useState<StoryParagraph[]>([]);
  const [storyTitle, setStoryTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStory();
  }, []);

  const fetchStory = async () => {
    const { data: story } = await supabase.from('stories').select('title').eq('id', storyId).single();
    setStoryTitle(story?.title || '');
    const { data: paras } = await supabase
      .from('story_paragraphs')
      .select('*, author:profiles(username)')
      .eq('story_id', storyId)
      .order('turn_number');
    setParagraphs(paras as any || []);
    setLoading(false);
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{storyTitle}</Text>
      {paragraphs.map((p, idx) => (
        <View key={idx} style={styles.paragraphCard}>
          <Text style={styles.paragraphText}>{p.paragraph}</Text>
          <Text style={styles.author}>— {p.author?.username}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  paragraphCard: { marginBottom: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 },
  paragraphText: { fontSize: 16, lineHeight: 24 },
  author: { marginTop: 8, fontSize: 12, color: 'gray', textAlign: 'right' },
});