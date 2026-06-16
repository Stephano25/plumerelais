// screens/ProposeScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Animated, ScrollView, StatusBar,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii } from '../types/theme';

export default function ProposeScreen({ route, navigation }: any) {
  const { storyId, turnId } = route.params;
  const { user } = useAuth();
  const [paragraph, setParagraph] = useState('');
  const [loading, setLoading]     = useState(false);
  const [context, setContext]     = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Fetch last paragraph for context
    (async () => {
      const { data } = await supabase
        .from('story_paragraphs')
        .select('paragraph')
        .eq('story_id', storyId)
        .order('turn_number', { ascending: false })
        .limit(1)
        .single();
      if (data) setContext(data.paragraph);
    })();
  }, []);

  const wordCount = paragraph.trim() ? paragraph.trim().split(/\s+/).length : 0;

  const handleSubmit = async () => {
    if (!paragraph.trim()) {
      Alert.alert('Erreur', 'Veuillez écrire une suite');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('proposals').insert({
      turn_id: turnId,
      author_id: user!.id,
      paragraph: paragraph.trim(),
    });
    setLoading(false);
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      navigation.goBack();
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
        <Text style={styles.headerTitle}>Proposer une suite</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Votre suite</Text>
            <Text style={styles.heroSub}>
              Continuez l'histoire en un seul paragraphe. Vos pairs voteront pour leur suite préférée.
            </Text>
          </View>

          {/* Context box (last paragraph) */}
          {context !== '' && (
            <View style={styles.contextBox}>
              <Text style={styles.contextLabel}>Dernier paragraphe</Text>
              <Text style={styles.contextText}>{`"${context}"`}</Text>
            </View>
          )}

          {/* Writing area */}
          <View style={styles.writingBox}>
            <TextInput
              style={styles.writingInput}
              multiline
              value={paragraph}
              onChangeText={setParagraph}
              placeholder={
                'Elle s\'avança lentement, le cœur battant à la cadence des vagues...\n\nÉcrivez votre suite ici.'
              }
              placeholderTextColor={colors.t3}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.writingFooter}>
              <View style={styles.writingToolbar}>
                <TouchableOpacity style={styles.toolBtn}><Text style={styles.toolBtnText}>«»</Text></TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn}><Text style={styles.toolBtnText}>—</Text></TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn}><Text style={styles.toolBtnText}>...</Text></TouchableOpacity>
              </View>
              <Text style={styles.wordCount}>
                <Text style={[styles.wordCountNum, wordCount > 0 && { color: colors.primary3 }]}>
                  {wordCount}
                </Text>
                {' mots'}
              </Text>
            </View>
          </View>

          {/* Submit */}
          <View style={styles.submitWrap}>
            <TouchableOpacity
              style={[styles.btnSubmit, (!paragraph.trim() || loading) && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!paragraph.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSubmitText}>Soumettre ma proposition ✈️</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
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
  scroll: { flex: 1 },
  hero: {
    padding: 20, paddingBottom: 16,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(124,92,191,0.15)',
  },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.t1, marginBottom: 6 },
  heroSub: { fontSize: 14, color: colors.t3, lineHeight: 20 },
  contextBox: {
    margin: 16,
    backgroundColor: 'rgba(232,197,71,0.06)',
    borderWidth: 0.5, borderColor: 'rgba(232,197,71,0.2)',
    borderRadius: radii.lg, padding: 16,
  },
  contextLabel: {
    fontSize: 11, fontWeight: '600', color: colors.accent,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  contextText: {
    fontSize: 14, fontFamily: 'Georgia', fontStyle: 'italic',
    color: colors.t2, lineHeight: 22,
  },
  writingBox: {
    margin: 16, marginTop: 0,
    backgroundColor: colors.bg2,
    borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.3)',
    borderRadius: radii.lg, overflow: 'hidden',
  },
  writingInput: {
    minHeight: 240, padding: 20,
    fontSize: 16, fontFamily: 'Georgia', fontStyle: 'italic',
    lineHeight: 28, color: colors.t1,
  },
  writingFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 0.5, borderTopColor: 'rgba(124,92,191,0.15)',
    backgroundColor: colors.bg3,
  },
  writingToolbar: { flexDirection: 'row', gap: 8 },
  toolBtn: {
    backgroundColor: 'transparent',
    borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.2)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  toolBtnText: { fontSize: 13, color: colors.t2 },
  wordCount: { fontSize: 12, color: colors.t3 },
  wordCountNum: { fontWeight: '700', color: colors.t3 },
  submitWrap: { padding: 16, paddingTop: 0 },
  btnSubmit: {
    backgroundColor: colors.primary,
    paddingVertical: 16, borderRadius: radii.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 18, elevation: 7,
  },
  btnDisabled: { opacity: 0.45 },
  btnSubmitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});