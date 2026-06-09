import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Story, Turn, StoryParagraph } from '../types';
import CountdownTimer from '../components/CountdownTimer';

export default function StoryDetailScreen({ route, navigation }: any) {
  const { storyId } = route.params;
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [paragraphs, setParagraphs] = useState<StoryParagraph[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [hasProposed, setHasProposed] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [blindMode, setBlindMode] = useState(false);

  useEffect(() => {
    fetchData();
    const subscription = supabase
      .channel(`story_${storyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_paragraphs', filter: `story_id=eq.${storyId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turns', filter: `story_id=eq.${storyId}` }, () => fetchData())
      .subscribe();
    return () => subscription.unsubscribe();
  }, [storyId]);

  const fetchData = async () => {
    // Story
    const { data: storyData } = await supabase.from('stories').select('*').eq('id', storyId).single();
    setStory(storyData as Story);

    // Paragraphs
    const { data: paras } = await supabase
      .from('story_paragraphs')
      .select('*, author:profiles(username)')
      .eq('story_id', storyId)
      .order('turn_number');
    setParagraphs(paras as any || []);

    // Participant check
    const { data: participant } = await supabase
      .from('story_participants')
      .select('*')
      .eq('story_id', storyId)
      .eq('user_id', user!.id)
      .single();
    setIsParticipant(!!participant);

    // Current turn
    const { data: turn } = await supabase
      .from('turns')
      .select('*')
      .eq('story_id', storyId)
      .eq('is_closed', false)
      .maybeSingle();
    setCurrentTurn(turn as Turn || null);

    if (turn && participant) {
      const { data: proposal } = await supabase
        .from('proposals')
        .select('id')
        .eq('turn_id', turn.id)
        .eq('author_id', user!.id)
        .maybeSingle();
      const alreadyProposed = !!proposal;
      setHasProposed(alreadyProposed);
      setBlindMode(!alreadyProposed && storyData?.status !== 'finished');
    } else {
      setBlindMode(false);
    }
  };

  const joinStory = async () => {
    await supabase.from('story_participants').insert({ story_id: storyId, user_id: user!.id });
    fetchData();
  };

  const canPropose = () => {
    if (!isParticipant) return false;
    if (story?.status !== 'in_progress' && story?.status !== 'open') return false;
    if (!currentTurn || currentTurn.is_closed) return false;
    if (hasProposed) return false;
    return true;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{story?.title}</Text>
      {story?.status !== 'finished' && currentTurn && (
        <CountdownTimer endTime={currentTurn.ends_at} onExpire={fetchData} />
      )}

      <View style={styles.paragraphsContainer}>
        {blindMode ? (
          <View style={styles.blindBox}>
            <Text style={styles.blindLabel}>Dernier paragraphe uniquement (mode aveugle) :</Text>
            {paragraphs.length > 0 && (
              <>
                <Text>{paragraphs[paragraphs.length - 1].paragraph}</Text>
                <Text style={styles.author}>— {paragraphs[paragraphs.length - 1].author?.username}</Text>
              </>
            )}
          </View>
        ) : (
          paragraphs.map((p, idx) => (
            <View key={idx} style={styles.paragraph}>
              <Text>{p.paragraph}</Text>
              <Text style={styles.author}>Par {p.author?.username} (tour {p.turn_number})</Text>
            </View>
          ))
        )}
      </View>

      {!isParticipant && story?.status !== 'finished' && (
        <TouchableOpacity style={styles.button} onPress={joinStory}>
          <Text style={styles.buttonText}>Rejoindre cette histoire</Text>
        </TouchableOpacity>
      )}

      {canPropose() && (
        <TouchableOpacity style={[styles.button, { backgroundColor: '#03dac6' }]} onPress={() => navigation.navigate('Propose', { storyId, turnId: currentTurn!.id })}>
          <Text style={styles.buttonText}>Proposer une suite</Text>
        </TouchableOpacity>
      )}

      {isParticipant && currentTurn && !hasProposed && story?.status !== 'finished' && (
        <TouchableOpacity style={[styles.button, { backgroundColor: '#ffb74d' }]} onPress={() => navigation.navigate('Vote', { storyId, turnId: currentTurn!.id })}>
          <Text style={styles.buttonText}>Voir les propositions et voter</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  paragraphsContainer: { marginVertical: 16 },
  paragraph: { padding: 8, borderBottomWidth: 1, borderColor: '#ccc' },
  author: { fontSize: 12, color: 'gray', marginTop: 4 },
  blindBox: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8 },
  blindLabel: { fontStyle: 'italic', marginBottom: 8 },
  button: { backgroundColor: '#6200ee', padding: 12, borderRadius: 8, marginTop: 16, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
});