// screens/StoryDetailScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Story, Turn, StoryParagraph } from '../types';
import CountdownTimer from '../components/CountdownTimer';
import { colors, radii } from '../types/theme';

export default function StoryDetailScreen({ route, navigation }: any) {
  const { storyId } = route.params;
  const { user } = useAuth();
  const [story, setStory]             = useState<Story | null>(null);
  const [paragraphs, setParagraphs]   = useState<StoryParagraph[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [hasProposed, setHasProposed] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [blindMode, setBlindMode]     = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: storyData } = await supabase.from('stories').select('*').eq('id', storyId).single();
    setStory(storyData as Story);

    const { data: paras } = await supabase
      .from('story_paragraphs')
      .select('*, author:profiles(username)')
      .eq('story_id', storyId)
      .order('turn_number');
    setParagraphs(paras as any || []);

    const { data: participant } = await supabase
      .from('story_participants').select('*')
      .eq('story_id', storyId).eq('user_id', user.id).single();
    setIsParticipant(!!participant);

    const { data: turn } = await supabase
      .from('turns').select('*')
      .eq('story_id', storyId).eq('is_closed', false).maybeSingle();
    setCurrentTurn(turn as Turn || null);

    if (turn && participant) {
      const { data: proposal } = await supabase
        .from('proposals').select('id')
        .eq('turn_id', turn.id).eq('author_id', user.id).maybeSingle();
      const proposed = !!proposal;
      setHasProposed(proposed);
      setBlindMode(!proposed && storyData?.status !== 'finished');
    } else {
      setBlindMode(false);
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [storyId, user]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    fetchData();
    const sub = supabase
      .channel(`story_${storyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_paragraphs', filter: `story_id=eq.${storyId}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turns', filter: `story_id=eq.${storyId}` }, fetchData)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [storyId, fetchData]);

  const joinStory = async () => {
    if (!user) return;
    await supabase.from('story_participants').insert({ story_id: storyId, user_id: user.id });
    fetchData();
  };

  const canPropose = () =>
    isParticipant &&
    (story?.status === 'in_progress' || story?.status === 'open') &&
    !!currentTurn && !currentTurn.is_closed &&
    !hasProposed;

  const authorColor = (idx: number) => {
    const palette = [colors.primary, colors.green, colors.blue, colors.accent, colors.red];
    return palette[idx % palette.length];
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{story?.title || '...'}</Text>
        {story?.status !== 'finished' && currentTurn && (
          <View style={styles.timerBadge}>
            <View style={styles.timerDot} />
            <CountdownTimer 
              endTime={currentTurn.ends_at} 
              onExpire={fetchData} 
              compact={true}
            />
          </View>
        )}
        {story?.status === 'finished' && (
          <View style={[styles.timerBadge, styles.finishedBadge]}>
            <Text style={styles.finishedBadgeText}>Terminée</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Blind mode banner */}
          {blindMode && (
            <View style={styles.blindBanner}>
              <Text style={styles.blindIcon}>🙈</Text>
              <View style={styles.blindContent}>
                <Text style={styles.blindTitle}>Mode aveugle activé</Text>
                <Text style={styles.blindDesc}>
                  Proposez votre suite pour débloquer l'histoire complète.
                </Text>
              </View>
            </View>
          )}

          {/* Paragraphs */}
          <View style={styles.paragraphsWrap}>
            {blindMode ? (
              paragraphs.length > 0 && (
                <ParagraphCard
                  p={paragraphs[paragraphs.length - 1]}
                  idx={paragraphs.length - 1}
                  accentColor={authorColor(paragraphs.length - 1)}
                  isLast
                />
              )
            ) : (
              paragraphs.map((p, idx) => (
                <ParagraphCard
                  key={idx}
                  p={p}
                  idx={idx}
                  accentColor={authorColor(idx)}
                  isLast={idx === paragraphs.length - 1}
                />
              ))
            )}
          </View>

          {/* Participants info */}
          {story?.status !== 'finished' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                {currentTurn ? `Tour ${currentTurn.turn_number}` : 'En attente'}
              </Text>
              <Text style={styles.infoText}>
                {paragraphs.length} paragraphe{paragraphs.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        {!isParticipant && story?.status !== 'finished' && (
          <TouchableOpacity style={[styles.btn, styles.btnJoin]} onPress={joinStory} activeOpacity={0.85}>
            <Text style={styles.btnJoinText}>Rejoindre cette histoire</Text>
          </TouchableOpacity>
        )}
        {canPropose() && (
          <TouchableOpacity
            style={[styles.btn, styles.btnPropose]}
            onPress={() => navigation.navigate('Propose', { storyId, turnId: currentTurn!.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.btnProposeText}>✍️  Proposer une suite</Text>
          </TouchableOpacity>
        )}
        {isParticipant && currentTurn && story?.status !== 'finished' && (
          <TouchableOpacity
            style={[styles.btn, styles.btnVote]}
            onPress={() => navigation.navigate('Vote', { storyId, turnId: currentTurn!.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.btnVoteText}>🗳️  Voir les propositions & voter</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ParagraphCard({ p, idx, accentColor, isLast }: any) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay: idx * 80, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[paraStyles.wrap, isLast && paraStyles.lastWrap, { opacity: anim }]}>
      <View style={[paraStyles.accent, { backgroundColor: accentColor }]} />
      <View style={paraStyles.body}>
        <Text style={paraStyles.text}>{p.paragraph}</Text>
        <View style={paraStyles.meta}>
          <View style={[paraStyles.authorDot, { backgroundColor: accentColor }]}>
            <Text style={paraStyles.authorInitial}>
              {p.author?.username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={paraStyles.authorName}>{p.author?.username}</Text>
          <View style={paraStyles.turnChip}>
            <Text style={paraStyles.turnText}>Tour {p.turn_number}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
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
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.t1 },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(232,197,71,0.12)',
    borderWidth: 0.5, borderColor: 'rgba(232,197,71,0.35)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  timerDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent,
  },
  finishedBadge: {
    backgroundColor: 'rgba(78,203,160,0.12)',
    borderColor: 'rgba(78,203,160,0.35)',
  },
  finishedBadgeText: { fontSize: 12, color: colors.green, fontWeight: '600' },
  content: { flex: 1 },
  blindBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    margin: 16,
    backgroundColor: 'rgba(124,92,191,0.1)',
    borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.3)',
    borderRadius: radii.lg, padding: 16,
  },
  blindIcon: { fontSize: 24 },
  blindContent: { flex: 1 },
  blindTitle: { fontSize: 14, fontWeight: '600', color: colors.primary3, marginBottom: 4 },
  blindDesc: { fontSize: 13, color: colors.t3, lineHeight: 19 },
  paragraphsWrap: { padding: 16, gap: 0 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  infoText: { fontSize: 12, color: colors.t3 },
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, gap: 10,
    backgroundColor: 'rgba(14,11,26,0.97)',
    borderTopWidth: 0.5, borderTopColor: 'rgba(124,92,191,0.2)',
  },
  btn: { paddingVertical: 14, borderRadius: radii.md, alignItems: 'center' },
  btnPropose: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 6,
  },
  btnProposeText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnVote: {
    backgroundColor: 'rgba(78,203,160,0.1)',
    borderWidth: 0.5, borderColor: 'rgba(78,203,160,0.35)',
  },
  btnVoteText: { color: colors.green, fontSize: 15, fontWeight: '600' },
  btnJoin: {
    backgroundColor: 'rgba(91,174,245,0.1)',
    borderWidth: 0.5, borderColor: 'rgba(91,174,245,0.35)',
  },
  btnJoinText: { color: colors.blue, fontSize: 15, fontWeight: '600' },
});

const paraStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', marginBottom: 16,
    backgroundColor: colors.bg2,
    borderRadius: 0,
    borderTopRightRadius: radii.md,
    borderBottomRightRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderLeftWidth: 0,
    borderColor: 'rgba(124,92,191,0.15)',
  },
  lastWrap: { borderColor: 'rgba(232,197,71,0.25)' },
  accent: { width: 3, flexShrink: 0 },
  body: { flex: 1, padding: 16 },
  text: {
    fontSize: 15, lineHeight: 26, color: colors.t1,
    fontFamily: 'Georgia', fontStyle: 'italic',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  authorDot: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  authorInitial: { color: '#fff', fontSize: 10, fontWeight: '700' },
  authorName: { fontSize: 12, color: colors.t2, flex: 1 },
  turnChip: {
    backgroundColor: 'rgba(124,92,191,0.15)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  turnText: { fontSize: 10, color: colors.primary3, fontWeight: '600' },
});