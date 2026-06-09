import React, { useState } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { isWeb } from '../utils/platform';

export default function CreateStoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [openingParagraph, setOpeningParagraph] = useState('');
  const [maxContributions, setMaxContributions] = useState('5');
  const [turnDuration, setTurnDuration] = useState('10');
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pour le web, on utilise un input file natif
  const handleWebImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const pickImage = async () => {
    if (isWeb) return; // Utiliser le input file à la place
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    // Pour le web, on upload via fetch en base64
    let blob: Blob;
    if (isWeb) {
      const response = await fetch(uri);
      blob = await response.blob();
    } else {
      const response = await fetch(uri);
      blob = await response.blob();
    }
    const fileName = `${Date.now()}.jpg`;
    const { data, error } = await supabase.storage.from('covers').upload(fileName, blob);
    if (error) {
      Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
      return null;
    }
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
      .from('stories')
      .insert({
        title,
        opening_paragraph: openingParagraph,
        max_contributions: parseInt(maxContributions),
        turn_duration_minutes: parseInt(turnDuration),
        is_public: isPublic,
        created_by: user!.id,
        status: 'open',
      })
      .select()
      .single();
    if (error) {
      Alert.alert('Erreur', error.message);
      setLoading(false);
      return;
    }
    await supabase.from('story_participants').insert({ story_id: story.id, user_id: user!.id });
    await supabase.from('story_paragraphs').insert({
      story_id: story.id,
      turn_number: 0,
      author_id: user!.id,
      paragraph: openingParagraph,
    });
    const endsAt = new Date(Date.now() + parseInt(turnDuration) * 60000);
    await supabase.from('turns').insert({
      story_id: story.id,
      turn_number: 1,
      ends_at: endsAt.toISOString(),
    });
    setLoading(false);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Titre</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Premier paragraphe (incipit)</Text>
      <TextInput style={[styles.input, styles.textArea]} value={openingParagraph} onChangeText={setOpeningParagraph} multiline numberOfLines={4} />
      <Text style={styles.label}>Nombre max de contributions</Text>
      <TextInput style={styles.input} value={maxContributions} onChangeText={setMaxContributions} keyboardType="numeric" />
      <Text style={styles.label}>Durée d'un tour (minutes)</Text>
      <TextInput style={styles.input} value={turnDuration} onChangeText={setTurnDuration} keyboardType="numeric" />
      <View style={styles.switchRow}>
        <Text style={styles.label}>Histoire publique</Text>
        <Switch value={isPublic} onValueChange={setIsPublic} />
      </View>
      
      {/* Upload d'image : version mobile avec expo-image-picker, version web avec input file */}
      {!isWeb ? (
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text>{coverImage ? 'Changer l’image de couverture' : 'Ajouter une image de couverture'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.webImageContainer}>
          <label htmlFor="cover-upload" style={styles.webLabel}>
            {coverImage ? 'Changer l’image' : 'Ajouter une image (web)'}
          </label>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            onChange={handleWebImageUpload}
            style={{ marginTop: 8 }}
          />
        </View>
      )}
      {coverImage && <Text style={styles.fileName}>Image sélectionnée</Text>}
      
      <TouchableOpacity style={styles.createButton} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Créer l'histoire</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 },
  textArea: { height: 100, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  imageButton: { backgroundColor: '#e0e0e0', padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 8 },
  webImageContainer: { marginVertical: 8, alignItems: 'center' },
  webLabel: { backgroundColor: '#e0e0e0', padding: 12, borderRadius: 8, textAlign: 'center', width: '100%' },
  fileName: { fontSize: 12, color: 'gray', textAlign: 'center' },
  createButton: { backgroundColor: '#6200ee', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});