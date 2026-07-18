import React, { useState } from 'react';
import {
  View, Text, TextInput, Switch, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { isWeb, kavBehavior } from '../utils/platform';
import { colors, radii, typography } from '../types/theme';
import ScreenContainer from '../components/ScreenContainer';
import ScrollBox from '../components/ScrollBox';

export default function CreateStoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [openingParagraph, setOpeningParagraph] = useState('');
  const [maxContributions, setMaxContributions] = useState('8');
  const [turnDuration, setTurnDuration] = useState('10');
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('covers').upload(fileName, blob, {
        contentType: 'image/jpeg',
      });
      if (error) {
        console.error('Erreur upload Storage:', error.message);
        return null;
      }
      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Erreur upload (exception):', error);
      return null;
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !openingParagraph.trim()) {
      Alert.alert('Erreur', 'Titre et premier paragraphe requis');
      return;
    }
    const maxC = parseInt(maxContributions, 10);
    const turnD = parseInt(turnDuration, 10);
    if (!Number.isFinite(maxC) || maxC < 2) {
      Alert.alert('Erreur', 'Le nombre de contributions doit être un nombre ≥ 2');
      return;
    }
    if (!Number.isFinite(turnD) || turnD < 1) {
      Alert.alert('Erreur', 'La durée de tour doit être un nombre ≥ 1 minute');
      return;
    }

    setLoading(true);

    // L'upload d'image ne doit jamais bloquer la création de l'histoire :
    // si le bucket/policy Storage a un souci, on log et on continue sans cover.
    let coverUrl: string | null = null;
    if (coverImage) {
      coverUrl = await uploadImage(coverImage);
      if (!coverUrl) {
        console.warn('Upload de la couverture échoué — poursuite sans image.');
      }
    }

    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        title: title.trim(),
        opening_paragraph: openingParagraph.trim(),
        max_contributions: maxC,
        turn_duration_minutes: turnD,
        is_public: isPublic,
        created_by: user!.id,
        cover_url: coverUrl,
        status: 'open',
      })
      .select()
      .single();

    if (storyError) {
      console.error('Erreur création histoire:', storyError);
      Alert.alert(
        'Erreur',
        storyError.code === '42501' || storyError.message?.includes('row-level security')
          ? "Permissions insuffisantes (RLS). Vérifie les policies Supabase sur la table 'stories'."
          : storyError.message
      );
      setLoading(false);
      return;
    }

    const { error: participantError } = await supabase
      .from('story_participants')
      .insert({ story_id: story.id, user_id: user!.id });
    if (participantError) console.error('Erreur ajout participant:', participantError);

    const { error: paragraphError } = await supabase
      .from('story_paragraphs')
      .insert({ story_id: story.id, turn_number: 0, author_id: user!.id, paragraph: openingParagraph.trim() });
    if (paragraphError) console.error('Erreur ajout paragraphe:', paragraphError);

    const endsAt = new Date(Date.now() + turnD * 60000);
    const { error: turnError } = await supabase
      .from('turns')
      .insert({ story_id: story.id, turn_number: 1, ends_at: endsAt.toISOString() });
    if (turnError) console.error('Erreur création tour:', turnError);

    setLoading(false);
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={kavBehavior}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle histoire</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollBox contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Titre de l'histoire</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Un titre qui donne envie..."
                placeholderTextColor={colors.t3}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Incipit — Premier paragraphe</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={openingParagraph}
                onChangeText={setOpeningParagraph}
                placeholder="Il était une fois, dans une ville que le temps avait oubliée..."
                placeholderTextColor={colors.t3}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{openingParagraph.length} caractères</Text>
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.fieldLabel}>Max contributions</Text>
                <TextInput
                  style={[styles.input, styles.numInput]}
                  value={maxContributions}
                  onChangeText={setMaxContributions}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.fieldLabel}>Durée d'un tour (min)</Text>
                <TextInput
                  style={[styles.input, styles.numInput]}
                  value={turnDuration}
                  onChangeText={setTurnDuration}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
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
                <Text style={styles.uploadSub}>Optionnel · JPEG ou PNG</Text>
                <input type="file" accept="image/*" onChange={handleWebImageUpload} style={{ marginTop: 10 }} />
              </View>
            )}

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

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollBox>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, minHeight: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: colors.bg2,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(124,92,191,0.2)',
    zIndex: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bg3, borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: colors.t1 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: colors.t1 },

  scrollContent: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  formContainer: { width: '100%', maxWidth: 480 },

  field: { marginBottom: 20 },
  fieldLabel: { ...typography.label, color: colors.primary3, marginBottom: 8 },
  input: {
    backgroundColor: colors.bg2, borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.25)',
    borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.t1,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top', lineHeight: 24, fontStyle: 'italic', paddingTop: 13 },
  charCount: { fontSize: 11, color: colors.t3, textAlign: 'right', marginTop: 5 },
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  halfField: { flex: 1, marginBottom: 20 },
  numInput: { textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.primary3 },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.bg2, borderWidth: 0.5, borderColor: 'rgba(124,92,191,0.2)',
    borderRadius: radii.md, padding: 16, marginBottom: 20,
  },
  switchLabel: { fontSize: 15, fontWeight: '500', color: colors.t1 },
  switchSub: { fontSize: 12, color: colors.t3, marginTop: 2 },
  uploadArea: {
    borderWidth: 1.5, borderColor: 'rgba(124,92,191,0.3)', borderStyle: 'dashed', borderRadius: radii.lg,
    paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center',
    backgroundColor: 'rgba(124,92,191,0.04)', marginBottom: 24,
  },
  uploadIcon: { fontSize: 36, marginBottom: 10 },
  uploadText: { fontSize: 15, fontWeight: '500', color: colors.t2, marginBottom: 4 },
  uploadSub: { fontSize: 12, color: colors.t3 },
  btnCreate: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radii.lg, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 8,
  },
  btnCreateText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  bottomSpacer: { height: 60 },
});