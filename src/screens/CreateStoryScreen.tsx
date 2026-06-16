// screens/CreateStoryScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Switch, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Animated, StatusBar,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { isWeb } from '../utils/platform';
import { colors, radii, typography } from '../types/theme';

export default function CreateStoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [title, setTitle]                     = useState('');
  const [openingParagraph, setOpeningParagraph] = useState('');
  const [maxContributions, setMaxContributions] = useState('8');
  const [turnDuration, setTurnDuration]         = useState('10');
  const [isPublic, setIsPublic]                 = useState(true);
  const [coverImage, setCoverImage]             = useState<string | null>(null);
  const [loading, setLoading]                   = useState(false);
  const [focusedField, setFocusedField]         = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleWebImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const pickImage = async () => {
    if (isWeb) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setCoverImage(result.assets[0].uri);
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `${Date.now()}.jpg`;
    const { data, error } = await supabase.storage.from('covers').upload(fileName, blob);
    if (error) { Alert.alert('Erreur', "Impossible d'uploader l'image"); return null; }
    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleCreate = async () => {
    if (!title.trim() || !openingParagraph.trim()) {
      Alert.alert('Erreur', 'Titre et premier paragraphe requis');
      return;
    }
    setLoading(true);
    let coverUrl = null;
    if (coverImage) coverUrl = await uploadImage(coverImage);

    const { data: story, error } = await supabase
      .from('stories').insert({
        title,
        opening_paragraph: openingParagraph,
        max_contributions: parseInt(maxContributions),
        turn_duration_minutes: parseInt(turnDuration),
        is_public: isPublic,
        created_by: user!.id,
        cover_url: coverUrl,
        status: 'open',
      }).select().single();

    if (error) { Alert.alert('Erreur', error.message); setLoading(false); return; }

    await supabase.from('story_participants').insert({ story_id: story.id, user_id: user!.id });
    await supabase.from('story_paragraphs').insert({
      story_id: story.id, turn_number: 0, author_id: user!.id, paragraph: openingParagraph,
    });
    const endsAt = new Date(Date.now() + parseInt(turnDuration) * 60000);
    await supabase.from('turns').insert({ story_id: story.id, turn_number: 1, ends_at: endsAt.toISOString() });

    setLoading(false);
    navigation.goBack();
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle histoire</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Titre de l'histoire</Text>
            <TextInput
              style={inputStyle('title')}
              value={title}
              onChangeText={setTitle}
              placeholder="Un titre qui donne envie..."
              placeholderTextColor={colors.t3}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Opening paragraph */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Incipit — Premier paragraphe</Text>
            <TextInput
              style={[inputStyle('opening'), styles.textArea]}
              value={openingParagraph}
              onChangeText={setOpeningParagraph}
              placeholder="Il était une fois, dans une ville que le temps avait oubliée..."
              placeholderTextColor={colors.t3}
              multiline
              numberOfLines={5}
              onFocus={() => setFocusedField('opening')}
              onBlur={() => setFocusedField(null)}
            />
            <Text style={styles.charCount}>{openingParagraph.length} caractères</Text>
          </View>

          {/* Row: max contributions + turn duration */}
          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Max contributions</Text>
              <TextInput
                style={[inputStyle('maxc'), styles.numInput]}
                value={maxContributions}
                onChangeText={setMaxContributions}
                keyboardType="numeric"
                onFocus={() => setFocusedField('maxc')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Durée d'un tour (min)</Text>
              <TextInput
                style={[inputStyle('turn'), styles.numInput]}
                value={turnDuration}
                onChangeText={setTurnDuration}
                keyboardType="numeric"
                onFocus={() => setFocusedField('turn')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Public toggle */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Histoire publique</Text>
              <Text style={styles.switchSub}>Visible par toute la communauté</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: colors.bg4, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Image upload */}
          {!isWeb ? (
            <TouchableOpacity style={styles.uploadArea} onPress={pickImage} activeOpacity={0.7}>
              <Text style={styles.uploadIcon}>{coverImage ? '✅' : '🖼️'}</Text>
              <Text style={styles.uploadText}>
                {coverImage ? 'Image sélectionnée — Changer' : 'Ajouter une image de couverture'}
              </Text>
              <Text style={styles.uploadSub}>Optionnel · JPEG ou PNG</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.uploadArea}>
              <Text style={styles.uploadIcon}>{coverImage ? '✅' : '🖼️'}</Text>
              <Text style={styles.uploadText}>
                {coverImage ? 'Image sélectionnée' : 'Ajouter une image de couverture'}
              </Text>
              {/* @ts-ignore web only */}
              <input type="file" accept="image/*" onChange={handleWebImageUpload} style={{ marginTop: 8 }} />
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btnCreate, loading && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnCreateText}>Lancer l'histoire ✨</Text>
            )}
          </TouchableOpacity>
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
  form: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 20 },
  fieldLabel: { ...typography.label, color: colors.primary3, marginBottom: 8 },
  input: {
    backgroundColor: colors.bg2,
    borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.25)',
    borderRadius: radii.md,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: colors.t1,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.bg3 },
  textArea: {
    minHeight: 120, textAlignVertical: 'top', lineHeight: 24,
    fontStyle: 'italic',
  },
  charCount: { fontSize: 11, color: colors.t3, textAlign: 'right', marginTop: 5 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  numInput: { textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.primary3 },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.2)',
    borderRadius: radii.md, padding: 16, marginBottom: 20,
  },
  switchLabel: { fontSize: 15, fontWeight: '500', color: colors.t1 },
  switchSub: { fontSize: 12, color: colors.t3, marginTop: 2 },
  uploadArea: {
    borderWidth: 1.5, borderColor: 'rgba(124,92,191,0.3)',
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    paddingVertical: 32, paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(124,92,191,0.04)',
    marginBottom: 24,
  },
  uploadIcon: { fontSize: 36, marginBottom: 10 },
  uploadText: { fontSize: 15, fontWeight: '500', color: colors.t2, marginBottom: 4 },
  uploadSub: { fontSize: 12, color: colors.t3 },
  btnCreate: {
    backgroundColor: colors.primary,
    paddingVertical: 16, borderRadius: radii.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 8,
  },
  btnCreateText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});