import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Proposal } from '../types';

export default function VoteScreen({ route }: any) {
  const { turnId } = route.params;
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    if (!user) return;

    const { data: props } = await supabase
      .from('proposals')
      .select('*, author:profiles(username), vote_count')
      .eq('turn_id', turnId)
      .order('vote_count', { ascending: false });
    setProposals(props as Proposal[] || []);

    const { data: existingVote } = await supabase
      .from('votes')
      .select('proposal_id')
      .eq('turn_id', turnId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (existingVote) setUserVote(existingVote.proposal_id);
  }, [turnId, user]);

  useEffect(() => {
    fetchProposals();
    const subscription = supabase
      .channel(`votes_${turnId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `turn_id=eq.${turnId}` }, () => {
        fetchProposals();
      })
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [turnId, fetchProposals]);

  const handleVote = async (proposalId: string) => {
    if (!user) return;
    if (userVote) {
      Alert.alert('Vous avez déjà voté pour ce tour');
      return;
    }
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal?.author_id === user.id) {
      Alert.alert('Vous ne pouvez pas voter pour votre propre proposition');
      return;
    }
    const { error } = await supabase.from('votes').insert({
      proposal_id: proposalId,
      user_id: user.id,
      turn_id: turnId,
    });
    if (!error) {
      await supabase.rpc('increment_vote_count', { prop_id: proposalId });
      setUserVote(proposalId);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Votez pour la meilleure suite</Text>
      <FlatList
        data={proposals}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.proposalCard, userVote === item.id && styles.votedCard]}
            onPress={() => handleVote(item.id)}
          >
            <Text>{item.paragraph}</Text>
            <Text style={styles.proposalMeta}>Par {item.author?.username} — {item.vote_count} votes</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  proposalCard: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginVertical: 4, backgroundColor: '#fff' },
  votedCard: { backgroundColor: '#c8e6ff', borderColor: '#6200ee' },
  proposalMeta: { fontSize: 12, color: 'gray', marginTop: 4 },
});