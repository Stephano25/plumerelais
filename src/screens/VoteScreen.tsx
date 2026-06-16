// screens/VoteScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, StyleSheet,
  Animated, StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Proposal } from '../types';
import { colors, radii } from '../types/theme';

export default function VoteScreen({ route, navigation }: any) {
  const { turnId } = route.params;
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userVote, setUserVote]   = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchProposals = useCallback(async () => {
    if (!user) return;
    const { data: props } = await supabase
      .from('proposals')
      .select('*, author:profiles(username), vote_count')
      .eq('turn_id', turnId)
      .order('vote_count', { ascending: false });

    const list = (props as Proposal[]) || [];
    setProposals(list);
    setTotalVotes(list.reduce((acc, p) => acc + (p.vote_count || 0), 0));

    const { data: existingVote } = await supabase
      .from('votes').select('proposal_id')
      .eq('turn_id', turnId).eq('user_id', user.id).maybeSingle();
    if (existingVote) setUserVote(existingVote.proposal_id);
  }, [turnId, user]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    fetchProposals();
    const sub = supabase
      .channel(`votes_${turnId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `turn_id=eq.${turnId}` }, fetchProposals)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [turnId, fetchProposals]);

  const handleVote = async (proposalId: string) => {
    if (!user) return;
    if (userVote) { Alert.alert('Déjà voté', 'Vous avez déjà voté pour ce tour.'); return; }
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal?.author_id === user.id) {
      Alert.alert('Vote impossible', 'Vous ne pouvez pas voter pour votre propre proposition.');
      return;
    }
    const { error } = await supabase.from('votes').insert({
      proposal_id: proposalId, user_id: user.id, turn_id: turnId,
    });
    if (!error) {
      await supabase.rpc('increment_vote_count', { prop_id: proposalId });
      setUserVote(proposalId);
      fetchProposals();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voter</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Sub-header */}
      <View style={styles.subHeader}>
        <Text style={styles.subTitle}>Quelle suite choisissez-vous ?</Text>
        <Text style={styles.subSub}>{proposals.length} propositions · {totalVotes} votes au total</Text>
        {userVote && (
          <View style={styles.votedBanner}>
            <Text style={styles.votedBannerText}>✓ Vote enregistré — merci !</Text>
          </View>
        )}
      </View>

      <FlatList
        data={proposals}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <ProposalCard
            proposal={item}
            index={index}
            totalVotes={totalVotes}
            isVoted={userVote === item.id}
            isOwnProposal={item.author_id === user?.id}
            hasVoted={!!userVote}
            onVote={() => handleVote(item.id)}
          />
        )}
      />
    </View>
  );
}

function ProposalCard({ proposal, index, totalVotes, isVoted, isOwnProposal, hasVoted, onVote }: any) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const barAnim   = useRef(new Animated.Value(0)).current;
  const pct = totalVotes > 0 ? Math.round((proposal.vote_count / totalVotes) * 100) : 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(barAnim, { toValue: pct / 100, duration: 800, useNativeDriver: false }).start();
  }, [pct]);

  const authorColors = [colors.primary, colors.green, colors.blue, colors.accent, colors.red];
  const ac = authorColors[index % authorColors.length];

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.card,
          isVoted && styles.cardVoted,
          hasVoted && !isVoted && styles.cardDimmed,
          isOwnProposal && styles.cardOwn,
        ]}
        onPress={onVote}
        activeOpacity={hasVoted ? 1 : 0.8}
        disabled={hasVoted}
      >
        {/* Voted checkmark */}
        {isVoted && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}

        {/* Own proposal badge */}
        {isOwnProposal && (
          <View style={styles.ownBadge}>
            <Text style={styles.ownBadgeText}>Votre proposition</Text>
          </View>
        )}

        {/* Paragraph */}
        <Text style={styles.paraText}>{proposal.paragraph}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.authorInfo}>
            <View style={[styles.authorDot, { backgroundColor: ac }]}>
              <Text style={styles.authorInitial}>
                {proposal.author?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.authorName}>{proposal.author?.username}</Text>
          </View>
          <View style={styles.voteCountBadge}>
            <Text style={styles.voteCountText}>♥ {proposal.vote_count || 0}</Text>
            {hasVoted && <Text style={styles.pctText}>{pct}%</Text>}
          </View>
        </View>

        {/* Vote bar (visible after voting) */}
        {hasVoted && (
          <View style={styles.voteBar}>
            <Animated.View
              style={[
                styles.voteFill,
                {
                  width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  backgroundColor: isVoted ? colors.primary : colors.bg4,
                },
              ]}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
    backgroundColor: colors.bg2,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(124,92,191,0.2)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bg3,
    borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: colors.t1 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: colors.t1 },
  subHeader: {
    padding: 16, paddingBottom: 12,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(124,92,191,0.12)',
  },
  subTitle: { fontSize: 22, fontWeight: '700', color: colors.t1, marginBottom: 4 },
  subSub: { fontSize: 13, color: colors.t3 },
  votedBanner: {
    marginTop: 12, backgroundColor: 'rgba(78,203,160,0.12)',
    borderWidth: 0.5, borderColor: 'rgba(78,203,160,0.3)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  votedBannerText: { fontSize: 13, color: colors.green, fontWeight: '600' },
  card: {
    backgroundColor: colors.bg2,
    borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.2)',
    borderRadius: radii.lg, padding: 18,
    position: 'relative',
  },
  cardVoted: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(124,92,191,0.1)',
  },
  cardDimmed: { opacity: 0.55 },
  cardOwn: { borderStyle: 'dashed' },
  checkBadge: {
    position: 'absolute', top: 14, right: 14,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  ownBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,92,191,0.15)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 10,
  },
  ownBadgeText: { fontSize: 10, color: colors.primary3, fontWeight: '600' },
  paraText: {
    fontSize: 14, fontFamily: 'Georgia', fontStyle: 'italic',
    lineHeight: 23, color: colors.t1, marginBottom: 14, paddingRight: 30,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorInfo: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  authorDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  authorInitial: { color: '#fff', fontSize: 10, fontWeight: '700' },
  authorName: { fontSize: 13, color: colors.t2 },
  voteCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(124,92,191,0.1)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  voteCountText: { fontSize: 12, color: colors.primary3, fontWeight: '600' },
  pctText: { fontSize: 12, color: colors.t3 },
  voteBar: {
    height: 3, backgroundColor: colors.bg4,
    borderRadius: 2, marginTop: 12, overflow: 'hidden',
  },
  voteFill: { height: '100%', borderRadius: 2 },
});