import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ProposeScreen({ route, navigation }: any) {
  const { storyId, turnId } = route.params;
  const { user } = useAuth();
  const [paragraph, setParagraph] = useState('');
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>Proposer une suite</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={6}
        placeholder="Écrivez la suite de l'histoire..."
        value={paragraph}
        onChangeText={setParagraph}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Soumettre</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  textArea: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, minHeight: 150, textAlignVertical: 'top' },
  button: { backgroundColor: '#03dac6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { fontWeight: 'bold', color: '#000' },
});