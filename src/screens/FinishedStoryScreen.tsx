import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  Animated, TouchableOpacity, StatusBar,
} from 'react-native';
import { supabase } from '../services/supabase';
import { StoryParagraph } from '../types';
import { colors, radii } from '../types/theme';

export default function FinishedStoryScreen({ route, navigation }: any) {
  const { storyId } = route.params;
  const [paragraphs, setParagraphs] = useState<StoryParagraph[]>([]);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyMeta, setStoryMeta] = useState<{ authors: number; date: string }>({ authors: 0, date: '' });
  const [loading, setLoading] = useState(true);

  const trophyAnim = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(30)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    fetchStory();
  }, []);

  const fetchStory = async () => {
    const { data: story } = await supabase.from('stories').select('title, updated_at').eq('id', storyId).single();
    setStoryTitle(story?.title || '');

    const { data: paras } = await supabase
      .from('story_paragraphs')
      .select('*, author:profiles(username)')
      .eq('story_id', storyId)
      .order('turn_number');

    const list = (paras as any) || [];
    setParagraphs(list);

    const uniqueAuthors = new Set(list.map((p: any) => p.author_id)).size;
    const date = story?.updated_at ? new Date(story.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';
    setStoryMeta({ authors: uniqueAuthors, date });

    setLoading(false);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(trophyAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(heroOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(listAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(listOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de l'histoire...</Text>
      </View>
    );
  }

  const authorColors = [colors.primary, colors.green, colors.blue, colors.accent, colors.red, colors.primary3];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
        <Text style={styles.headerLabel}>Histoire terminée</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
          <Animated.Text style={[styles.trophy, { transform: [{ scale: trophyAnim }, { rotate: trophyAnim.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) }] }]}>🏆</Animated.Text>
          <Text style={styles.heroTitle}>{storyTitle}</Text>
          <Text style={styles.heroSub}>Terminée le {storyMeta.date}</Text>
          <View style={styles.heroStats}>
            <StatPill value={storyMeta.authors} label="Auteurs" />
            <StatPill value={paragraphs.length} label="Paragraphes" />
            <StatPill value={paragraphs.length - 1} label="Tours" />
          </View>
        </Animated.View>

        <Text style={styles.flourish}>✦ ✦ ✦</Text>

        <Animated.View style={{ opacity: listOpacity, transform: [{ translateY: listAnim }] }}>
          {paragraphs.map((p: any, idx) => (
            <View key={idx} style={styles.paraCard}>
              <View style={[styles.paraAccentBar, { backgroundColor: authorColors[idx % authorColors.length] }]} />
              <View style={styles.paraBody}>
                <Text style={styles.paraText}>{p.paragraph}</Text>
              </View>
              <View style={styles.paraFooter}>
                <View style={styles.authorRow}>
                  <View style={[styles.authorDot, { backgroundColor: authorColors[idx % authorColors.length] }]}>
                    <Text style={styles.authorInitial}>{p.author?.username?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.authorName}>{p.author?.username}</Text>
                    <Text style={styles.authorSub}>Auteur</Text>
                  </View>
                </View>
                <View style={styles.turnBadge}>
                  <Text style={styles.turnBadgeText}>{idx === 0 ? 'Incipit' : `Tour ${p.turn_number}`}</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={styles.endSection}>
          <Text style={styles.endFlourish}>✦ Fin ✦</Text>
          <Text style={styles.endText}>Merci à tous les auteurs qui ont contribué à cette histoire.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <View style={pillStyles.wrap}>
      <Text style={pillStyles.num}>{value}</Text>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loadingRoot: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: colors.t3, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, backgroundColor: 'transparent' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg2, borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.3)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: colors.t1 },
  headerLabel: { flex: 1, textAlign: 'center', fontSize: 14, color: colors.t3, fontWeight: '500' },
  scroll: { flex: 1 },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, borderBottomWidth: 0.5, borderBottomColor: 'rgba(232,197,71,0.15)' },
  trophy: { fontSize: 60, marginBottom: 20 },
  heroTitle: { fontSize: 26, fontWeight: '700', textAlign: 'center', color: colors.t1, marginBottom: 8, lineHeight: 32 },
  heroSub: { fontSize: 14, color: colors.t3, marginBottom: 20 },
  heroStats: { flexDirection: 'row', gap: 10 },
  flourish: { textAlign: 'center', color: colors.primary3, fontSize: 16, letterSpacing: 8, paddingVertical: 24 },
  paraCard: { marginHorizontal: 16, marginBottom: 18, backgroundColor: colors.bg2, borderRadius: radii.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.15)' },
  paraAccentBar: { height: 2 },
  paraBody: { padding: 20, paddingBottom: 16 },
  paraText: { fontSize: 16, fontFamily: 'Georgia', fontStyle: 'italic', lineHeight: 28, color: colors.t1 },
  paraFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(124,92,191,0.12)' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  authorInitial: { color: '#fff', fontSize: 12, fontWeight: '700' },
  authorName: { fontSize: 13, fontWeight: '600', color: colors.t2 },
  authorSub: { fontSize: 11, color: colors.t3 },
  turnBadge: { backgroundColor: 'rgba(124,92,191,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  turnBadgeText: { fontSize: 11, color: colors.primary3, fontWeight: '600' },
  endSection: { alignItems: 'center', padding: 32 },
  endFlourish: { fontSize: 18, color: colors.accent, letterSpacing: 6, marginBottom: 12 },
  endText: { fontSize: 13, color: colors.t3, textAlign: 'center', lineHeight: 20 },
});

const pillStyles = StyleSheet.create({
  wrap: { backgroundColor: colors.bg3, borderWidth: 0.5, borderColor: 'rgba(232,197,71,0.2)', borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  num: { fontSize: 22, fontWeight: '700', color: colors.accent },
  label: { fontSize: 11, color: colors.t3, marginTop: 2 },
});