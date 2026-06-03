import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, RefreshControl, FlatList, Alert, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView } from '../../src/tw';
import { getSessionToken, API_BASE_URL } from '../../src/lib/auth-store';

export default function RepertoireScreen() {
  const [songs, setSongs] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'songs' | 'suggestions'>('songs');

  // Suggestion Modal Form States
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRepertoire = useCallback(async (query = '') => {
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/api/mobile/repertoire?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setSongs(data.songs);
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error loading repertoire:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRepertoire();
  }, [loadRepertoire]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRepertoire(searchQuery);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    loadRepertoire(text);
  };

  async function handleSuggestSong() {
    if (!title.trim() || !artist.trim()) {
      Alert.alert('Campos Obligatorios', 'Por favor ingresa el título y el artista de la canción.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/mobile/repertoire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          youtubeLink: youtubeLink.trim() || undefined,
          spotifyLink: spotifyLink.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert('Éxito', 'Tu sugerencia ha sido enviada al administrador.');
        setTitle('');
        setArtist('');
        setYoutubeLink('');
        setSpotifyLink('');
        setNotes('');
        setModalVisible(false);
        loadRepertoire(searchQuery);
      } else {
        throw new Error(data.error || 'No se pudo guardar la sugerencia.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-zinc-950 px-4 pt-4">
      {/* Search Input Bar */}
      <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 h-12 mb-4">
        <Ionicons name="search" size={20} color="#71717a" className="mr-2" />
        <TextInput
          className="flex-1 text-zinc-100 text-sm h-full"
          placeholder="Buscar por canción, artista..."
          placeholderTextColor="#71717a"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color="#71717a" />
          </Pressable>
        )}
      </View>

      {/* Sub Tabs Selection */}
      <View className="flex-row bg-zinc-900 p-1 rounded-2xl mb-4 border border-zinc-800/40">
        <Pressable
          onPress={() => setActiveTab('songs')}
          className={`flex-1 py-2.5 rounded-xl justify-center items-center ${
            activeTab === 'songs' ? 'bg-blue-600' : 'bg-transparent'
          }`}
        >
          <Text className={`font-bold text-xs ${activeTab === 'songs' ? 'text-white' : 'text-zinc-400'}`}>
            Catálogo Oficial
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('suggestions')}
          className={`flex-1 py-2.5 rounded-xl justify-center items-center ${
            activeTab === 'suggestions' ? 'bg-blue-600' : 'bg-transparent'
          }`}
        >
          <Text className={`font-bold text-xs ${activeTab === 'suggestions' ? 'text-white' : 'text-zinc-400'}`}>
            Mis Sugerencias
          </Text>
        </Pressable>
      </View>

      {/* List Body */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : activeTab === 'songs' ? (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Ionicons name="musical-note-outline" size={48} color="#52525b" />
              <Text className="text-zinc-400 font-bold mt-4">No se encontraron canciones.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl mb-2 flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <Text className="text-white font-bold text-sm">{item.title}</Text>
                <Text className="text-zinc-400 text-xs mt-0.5">{item.artist}</Text>
              </View>
              {item.genre && (
                <View className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-lg">
                  <Text className="text-zinc-400 text-[10px] uppercase font-bold">{item.genre}</Text>
                </View>
              )}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Ionicons name="chatbubbles-outline" size={48} color="#52525b" />
              <Text className="text-zinc-400 font-bold mt-4">Aún no has sugerido canciones.</Text>
              <Text className="text-zinc-500 text-xs mt-1 text-center">Usa el botón flotante para proponer repertorio.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl mb-2">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                  <Text className="text-white font-bold text-sm">{item.title}</Text>
                  <Text className="text-zinc-400 text-xs mt-0.5">{item.artist}</Text>
                </View>

                {/* Suggestion Status Badge */}
                <View className={`px-2 py-1 rounded-lg border ${
                  item.status === 'approved' ? 'bg-green-500/10 border-green-500/20' :
                  item.status === 'rejected' ? 'bg-red-500/10 border-red-500/20' :
                  'bg-yellow-500/10 border-yellow-500/20'
                }`}>
                  <Text className={`text-[9px] font-black uppercase tracking-wider ${
                    item.status === 'approved' ? 'text-green-500' :
                    item.status === 'rejected' ? 'text-red-500' :
                    'text-yellow-500'
                  }`}>
                    {item.status === 'approved' ? 'Aprobada' :
                     item.status === 'rejected' ? 'Rechazada' :
                     'Pendiente'}
                  </Text>
                </View>
              </View>
              {item.notes && (
                <Text className="text-zinc-500 text-xs mt-2 italic bg-zinc-950 p-2 rounded-lg">
                  💡 {item.notes}
                </Text>
              )}
            </View>
          )}
        />
      )}

      {/* Floating Action Button (FAB) for Suggest Song */}
      <Pressable
        onPress={() => setModalVisible(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full justify-center items-center shadow-lg active:bg-blue-700"
      >
        <Ionicons name="add" size={30} color="#ffffff" />
      </Pressable>

      {/* Suggestion Modal Form */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/60"
        >
          <View className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 gap-4">
            <View className="flex-row justify-between items-center border-b border-zinc-800/60 pb-3 mb-1">
              <Text className="text-white text-lg font-black">Sugerir Canción</Text>
              <Pressable onPress={() => setModalVisible(false)} className="p-1">
                <Ionicons name="close" size={24} color="#71717a" />
              </Pressable>
            </View>

            <ScrollView className="max-h-[400px]">
              <View className="gap-4">
                <View>
                  <Text className="text-xs font-bold text-zinc-400 uppercase mb-2">Título de la Canción *</Text>
                  <TextInput
                    className="h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-100 placeholder-zinc-700 focus:border-blue-500"
                    placeholder="Ej. Wake Me Up"
                    placeholderTextColor="#52525b"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-zinc-400 uppercase mb-2">Artista / Banda *</Text>
                  <TextInput
                    className="h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-100 placeholder-zinc-700 focus:border-blue-500"
                    placeholder="Ej. Avicii"
                    placeholderTextColor="#52525b"
                    value={artist}
                    onChangeText={setArtist}
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-zinc-400 uppercase mb-2">Enlace de Spotify (Opcional)</Text>
                  <TextInput
                    className="h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-100 placeholder-zinc-700 focus:border-blue-500"
                    placeholder="https://open.spotify.com/..."
                    placeholderTextColor="#52525b"
                    autoCapitalize="none"
                    value={spotifyLink}
                    onChangeText={setSpotifyLink}
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-zinc-400 uppercase mb-2">Enlace de YouTube / Video (Opcional)</Text>
                  <TextInput
                    className="h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-100 placeholder-zinc-700 focus:border-blue-500"
                    placeholder="https://youtube.com/..."
                    placeholderTextColor="#52525b"
                    autoCapitalize="none"
                    value={youtubeLink}
                    onChangeText={setYoutubeLink}
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-zinc-400 uppercase mb-2">Notas / Comentarios</Text>
                  <TextInput
                    className="h-20 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 placeholder-zinc-700 focus:border-blue-500 text-xs"
                    placeholder="Ej. Ideal para el happening o coctel, la gente la canta mucho."
                    placeholderTextColor="#52525b"
                    multiline
                    numberOfLines={3}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSuggestSong}
              disabled={submitting}
              className="h-12 bg-blue-600 active:bg-blue-700 rounded-xl justify-center items-center mt-2 transition-colors"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">Enviar Sugerencia</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
